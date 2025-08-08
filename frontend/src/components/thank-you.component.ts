import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InterviewService } from '../services/interview.service';

@Component({
  selector: 'app-thank-you',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <div class="card fade-in">
        <div class="thank-you-container">
          <div class="thank-you-icon">✓</div>
          <h1>Interview Complete!</h1>
          <p class="subtitle">
            Thank you for completing the AI interview process
          </p>

          <div class="summary-card">
            <h3 style="margin-bottom: 1.5rem; color: #1e293b;">Interview Summary</h3>
            
            <div class="summary-row">
              <span class="summary-label">Candidate</span>
              <span class="summary-value">{{ userName }}</span>
            </div>
            
            <div class="summary-row">
              <span class="summary-label">Questions Answered</span>
              <span class="summary-value">{{ answeredCount }} / {{ totalQuestions }}</span>
            </div>
            
            <div class="summary-row">
              <span class="summary-label">Status</span>
              <span class="summary-value" style="color: #10b981;">✓ Completed</span>
            </div>
            
            <div class="summary-row">
              <span class="summary-label">Completion Date</span>
              <span class="summary-value">{{ completionDate }}</span>
            </div>
          </div>

          <div class="next-steps">
            <h4>What happens next?</h4>
            <ul>
              <li>Our team will review your responses within 2-3 business days</li>
              <li>You will receive an email notification with the next steps</li>
              <li>If selected, we'll schedule a follow-up interview or technical assessment</li>
              <li>Feel free to reach out if you have any questions about the process</li>
            </ul>
          </div>

          <div class="btn-group">
            <button 
              class="btn btn-secondary"
              (click)="startNewInterview()"
            >
              Start New Interview
            </button>
            <button 
              class="btn btn-primary"
              (click)="goToLogin()"
            >
              Return to Login
            </button>
          </div>

          <div class="reference-info">
            <p style="text-align: center; margin-bottom: 0.5rem;">
              📧 Check your email for confirmation and next steps
            </p>
            <p style="text-align: center; margin: 0;">
              <strong>Reference ID:</strong> <span class="reference-id">AI-{{ generateReferenceId() }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ThankYouComponent implements OnInit {
  userName = '';
  answeredCount = 0;
  totalQuestions = 0;
  completionDate = '';

  constructor(
    private router: Router,
    private interviewService: InterviewService
  ) {}

  ngOnInit() {
    this.interviewService.state$.subscribe(state => {
      if (!state.completed) {
        this.router.navigate(['/login']);
        return;
      }

      this.userName = state.user?.name || 'Anonymous';
      this.answeredCount = this.interviewService.getAnsweredCount();
      this.totalQuestions = this.interviewService.getTotalQuestions();
      this.completionDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    });
  }

  generateReferenceId(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${year}${month}${day}${random}`;
  }

  startNewInterview() {
    this.interviewService.reset();
    this.router.navigate(['/login']);
  }

  goToLogin() {
    this.interviewService.reset();
    this.router.navigate(['/login']);
  }
}