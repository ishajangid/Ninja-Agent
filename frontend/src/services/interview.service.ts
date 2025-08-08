import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

export interface User {
  name: string;
  email: string;
  cid?: number;
}

export interface Question {
  id: number;
  problem: string;
  model_answer: string;
  field: string;
}

export interface AnswerRecord {
  audioBlob: Blob;
  filename?: string;
  questionId: number;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class InterviewService {
  private apiUrl = 'http://localhost:5000/api';

  private state = {
    user: null as User | null,
    termsAccepted: false,
    currentQuestionIndex: 0,
    completed: false,
    questions: [] as Question[],
    answers: [] as AnswerRecord[]
  };

  state$ = new BehaviorSubject(this.state);

  constructor(private http: HttpClient) {}

  setUser(user: User) {
    this.state.user = user;
    this.state$.next({ ...this.state });
  }

  getCurrentUser(): User | null {
    return this.state.user;
  }

  acceptTerms() {
    this.state.termsAccepted = true;
    this.state$.next({ ...this.state });
  }

  getTotalQuestions(): number {
    return 5;
  }

  getProgress(): number {
    const index = this.state.currentQuestionIndex + 1;
    return (index / this.getTotalQuestions()) * 100;
  }

  getCurrentQuestion(): Question | null {
    return this.state.questions[this.state.currentQuestionIndex] || null;
  }

  fetchAndStoreQuestion(qid: number) {
    this.http.get<Question>(`${this.apiUrl}/question/${qid}`).subscribe({
      next: (question: Question) => {
        this.state.questions[qid - 1] = question;
        this.state$.next({ ...this.state });
      },
      error: (err) => {
        console.error("Failed to load question", err);
      }
    });
  }

  nextQuestion(): void {
    this.state.currentQuestionIndex++;
    this.state.completed = this.state.currentQuestionIndex >= this.getTotalQuestions();
    this.state$.next({ ...this.state });

    const nextQid = this.state.currentQuestionIndex + 1;
    if (!this.state.questions[this.state.currentQuestionIndex]) {
      this.fetchAndStoreQuestion(nextQid);
    }
  }

  saveAnswer(blob: Blob, filename?: string) {
    const currentQuestion = this.getCurrentQuestion();
    const answerRecord: AnswerRecord = {
      audioBlob: blob,
      filename: filename,
      questionId: currentQuestion?.id || this.state.currentQuestionIndex + 1,
      timestamp: new Date()
    };

    this.state.answers.push(answerRecord);
    this.state$.next({ ...this.state });

    console.log('Answer saved:', {
      questionId: answerRecord.questionId,
      filename: answerRecord.filename,
      timestamp: answerRecord.timestamp
    });
  }

  getAnsweredCount(): number {
    return this.state.answers.length;
  }

  getAnswers(): AnswerRecord[] {
    return this.state.answers;
  }

  getUploadedFilenames(): string[] {
    return this.state.answers
      .filter(answer => answer.filename)
      .map(answer => answer.filename!);
  }

  downloadAllAudioFiles() {
    this.state.answers.forEach((answer, index) => {
      const url = URL.createObjectURL(answer.audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = answer.filename || `interview_question_${answer.questionId}_${index + 1}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  evaluateAllResponses(folderPath: string) {
    return this.http.post<any>('http://localhost:5000/api/evaluate-all', {
      folder: folderPath
    });
  }

  reset(): void {
    this.state = {
      user: null,
      termsAccepted: false,
      currentQuestionIndex: 0,
      completed: false,
      questions: [],
      answers: []
    };
    this.state$.next({ ...this.state });
  }
}
