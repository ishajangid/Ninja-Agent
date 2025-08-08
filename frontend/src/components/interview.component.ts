import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InterviewService, Question } from '../services/interview.service';
import { AudioService, RecordingState } from '../services/audio.service';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-interview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <div class="card interview-card fade-in">
        <!-- Show Submit All Responses only if interview is completed -->
        <button 
          *ngIf="interviewState?.completed"
          (click)="submitAllResponses()" 
          style="margin: 20px auto; display: block;"
        >
          ✅ Submit All Responses
        </button>

        <div class="progress-container">
          <div class="progress-header">
            <h2>Interview in Progress</h2>
            <div class="progress-text">
              Question {{ currentQuestionIndex + 1 }} of {{ totalQuestions }}
            </div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="progress"></div>
          </div>
        </div>

        <div *ngIf="currentQuestion" class="question-container">
          <div class="question-header">
            <div class="question-number">
              Question {{ currentQuestion.id }}
            </div>
          </div>
          <div class="question-text">
            {{ currentQuestion.problem }}
          </div>
        </div>

        <div class="recording-container">
          <div *ngIf="!recordingState.hasRecording && !recordingState.isRecording">
            <p class="recording-status">Ready to record your answer</p>
            <button 
              class="recording-button record"
              (click)="startRecording()"
              [disabled]="!microphoneReady"
            >
              🎤
            </button>
            <p class="recording-hint">
              {{ microphoneReady ? 'Click to start recording' : 'Preparing microphone...' }}
            </p>
          </div>

          <div *ngIf="recordingState.isRecording">
            <p class="recording-status">Recording your answer...</p>
            <button 
              class="recording-button stop recording"
              (click)="stopRecording()"
            >
              ⏹️
            </button>
            <div class="recording-time">
              {{ audioService.formatTime(recordingState.duration) }}
            </div>
            <p class="recording-hint">Click to stop recording</p>
          </div>

          <div *ngIf="recordingState.hasRecording && !recordingState.isRecording">
            <div class="answer-preview">
              <div class="answer-preview-text">
                ✅ Answer recorded successfully!
              </div>
              <div class="answer-preview-duration">
                Duration: {{ audioService.formatTime(recordingState.duration) }}
              </div>
            </div>

            <div class="btn-group">
              <button 
                class="btn btn-secondary"
                (click)="playRecording()"
                [disabled]="isPlaying"
              >
                {{ isPlaying ? '🔊 Playing...' : '▶️ Play' }}
              </button>
              <button 
                class="btn btn-danger"
                (click)="reRecord()"
              >
                🔄 Re-record
              </button>
              <button 
                class="btn btn-success"
                (click)="submitAnswer()"
                [disabled]="isSubmitting"
              >
                {{ isSubmitting ? 'Submitting...' : '✓ Submit Answer' }}
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="!microphoneReady" class="warning-message">
          <p><strong>⚠️ Microphone access is required for this interview</strong></p>
          <p>Please allow microphone permissions and refresh the page</p>
        </div>

        <!-- Upload status indicator -->
        <div *ngIf="uploadStatus" class="upload-status" 
             [ngClass]="{'success': uploadStatus.type === 'success', 'error': uploadStatus.type === 'error'}">
          {{ uploadStatus.message }}
        </div>
      </div>
    </div>
  `
})
export class InterviewComponent implements OnInit, OnDestroy {
  currentQuestion: Question | null = null;
  currentQuestionIndex = 0;
  totalQuestions = 0;
  progress = 0;
  microphoneReady = false;
  isPlaying = false;
  isSubmitting = false;
  interviewState: any;

  recordingState: RecordingState = {
    isRecording: false,
    isPaused: false,
    duration: 0,
    hasRecording: false
  };

  uploadStatus: { type: 'success' | 'error', message: string } | null = null;
  private subscriptions: Subscription[] = [];
  private currentAudioBlob: Blob | null = null;

  constructor(
    private router: Router,
    public interviewService: InterviewService,
    public audioService: AudioService,
    private http: HttpClient
  ) {}

  async ngOnInit() {
    const subscription = this.interviewService.state$.subscribe(state => {
      this.interviewState = state;

      if (!state.user || !state.termsAccepted) {
        this.router.navigate(['/login']);
        return;
      }

      if (state.completed) {
        this.router.navigate(['/thank-you']);
        return;
      }

      this.currentQuestionIndex = state.currentQuestionIndex;
      this.totalQuestions = this.interviewService.getTotalQuestions();
      this.progress = this.interviewService.getProgress();
      this.currentQuestion = this.interviewService.getCurrentQuestion();

      if (!this.currentQuestion) {
        this.interviewService.fetchAndStoreQuestion(this.currentQuestionIndex + 1);
      }
    });
    this.subscriptions.push(subscription);

    const audioSubscription = this.audioService.state$.subscribe(state => {
      this.recordingState = state;
    });
    this.subscriptions.push(audioSubscription);

    this.microphoneReady = await this.audioService.initializeRecording();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.audioService.reset();
  }

  async startRecording() {
    if (!this.microphoneReady) return;
    this.audioService.reset();
    this.audioService.startRecording();
    this.uploadStatus = null;
  }

  async stopRecording() {
    this.currentAudioBlob = await this.audioService.stopRecording();
  }

  async playRecording() {
    if (!this.currentAudioBlob) return;
    this.isPlaying = true;
    try {
      await this.audioService.playRecording(this.currentAudioBlob);
    } finally {
      this.isPlaying = false;
    }
  }

  reRecord() {
    this.audioService.reset();
    this.currentAudioBlob = null;
    this.uploadStatus = null;
  }

  private async uploadAudioFile(audioBlob: Blob): Promise<string | null> {
    try {
      const formData = new FormData();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const questionId = this.currentQuestion?.id || 'unknown';
      const fullEmail = this.interviewService.getCurrentUser()?.email || 'anonymous@example.com';
      const emailPrefix = fullEmail.split('@')[0];

      const filename = `interview_${emailPrefix}_q${questionId}_${timestamp}.webm`;
      formData.append('audio', audioBlob, filename);
      formData.append('question_id', questionId.toString());
      formData.append('user_email', fullEmail);

      const response = await this.http.post<any>('http://localhost:5000/api/upload-audio', formData).toPromise();

      if (response && response.filename) {
        this.uploadStatus = { type: 'success', message: `Audio saved and evaluated: ${response.filename}` };
        return response.filename;
      }
      return null;
    } catch (error) {
      console.error('Upload failed:', error);
      this.uploadStatus = { type: 'error', message: 'Failed to save audio file' };
      return null;
    }
  }

  async submitAnswer() {
    if (!this.currentAudioBlob || !this.currentQuestion) return;
    this.isSubmitting = true;
    this.uploadStatus = null;

    try {
      const uploadedFilename = await this.uploadAudioFile(this.currentAudioBlob);
      if (uploadedFilename) {
        this.interviewService.saveAnswer(this.currentAudioBlob, uploadedFilename);
        setTimeout(() => (this.uploadStatus = null), 3000);
      } else {
        this.interviewService.saveAnswer(this.currentAudioBlob);
      }

      setTimeout(() => {
        this.interviewService.nextQuestion();
        this.audioService.reset();
        this.currentAudioBlob = null;
        this.isSubmitting = false;

        const state = this.interviewService['state$'].value;
        this.currentQuestionIndex = state.currentQuestionIndex;
        this.progress = this.interviewService.getProgress();
        this.currentQuestion = this.interviewService.getCurrentQuestion();

        if (!this.currentQuestion) {
          this.interviewService.fetchAndStoreQuestion(this.currentQuestionIndex + 1);
        }

        if (state.completed) {
          this.router.navigate(['/thank-you']);
        }
      }, 1000);
    } catch (error) {
      console.error('Error submitting answer:', error);
      this.uploadStatus = { type: 'error', message: 'Failed to submit answer' };
      this.isSubmitting = false;
    }
  }

  submitAllResponses() {
    const today = new Date().toISOString().split('T')[0];
    const folderPath = `candidate_recordings/by_date/${today}`;

    console.log(`Submitting all responses from folder: ${folderPath}`);

    this.interviewService.evaluateAllResponses(folderPath).subscribe({
      next: (response) => {
        console.log('✅ Batch evaluation complete:', response);
        alert('All responses evaluated successfully!');
      },
      error: (err) => {
        console.error('❌ Error during batch evaluation:', err);
        alert('Failed to evaluate all responses.');
      }
    });
  }
}
