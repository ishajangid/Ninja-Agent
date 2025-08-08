import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  hasRecording: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private startTime: number = 0;
  private durationInterval: any;
  private stream: MediaStream | null = null; // Keep reference to stream

  private recordingState = new BehaviorSubject<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    hasRecording: false
  });

  public state$ = this.recordingState.asObservable();

  async initializeRecording(): Promise<boolean> {
    try {
      // Always get fresh stream for each recording session
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      return true;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      return false;
    }
  }

  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    return 'audio/webm';
  }

  async startRecording() {
    // Ensure we have a fresh stream
    if (!this.stream || !this.stream.active) {
      const success = await this.initializeRecording();
      if (!success) return;
    }

    // Create new MediaRecorder for each recording
    this.mediaRecorder = new MediaRecorder(this.stream!, {
      mimeType: this.getSupportedMimeType()
    });

    this.audioChunks = [];
    this.startTime = Date.now();

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start();
    
    this.updateState({ 
      isRecording: true, 
      isPaused: false, 
      duration: 0,
      hasRecording: false 
    });

    this.durationInterval = setInterval(() => {
      const duration = Math.floor((Date.now() - this.startTime) / 1000);
      this.updateState({ duration });
    }, 1000);
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(new Blob());
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { 
          type: this.getSupportedMimeType() 
        });
        this.updateState({ 
          isRecording: false, 
          hasRecording: true 
        });
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();

      if (this.durationInterval) {
        clearInterval(this.durationInterval);
        this.durationInterval = null;
      }

      // Don't stop the stream here - keep it active for next recording
    });
  }

  playRecording(audioBlob: Blob): Promise<void> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.src = URL.createObjectURL(audioBlob);
      audio.onended = () => {
        URL.revokeObjectURL(audio.src);
        resolve();
      };
      audio.play();
    });
  }

  reset() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }

    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }

    this.audioChunks = [];
    this.updateState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      hasRecording: false
    });
  }

  // Call this when completely done with recording (e.g., when leaving interview)
  cleanup() {
    this.reset();
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private updateState(updates: Partial<RecordingState>) {
    const currentState = this.recordingState.value;
    this.recordingState.next({
      ...currentState,
      ...updates
    });
  }
}