import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InterviewService } from '../services/interview.service';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="card fade-in">
        <div class="header">
          <div class="logo">📋</div>
          <h2>Terms & Conditions</h2>
          <p class="subtitle">
            Please review and accept the terms before starting your interview
          </p>
        </div>

        <div class="terms-text">
          <h4>Interview Guidelines & Terms</h4>
          
          <p><strong>1. Interview Process:</strong></p>
          <ul>
            <li>This interview consists of 5 questions that will be presented one at a time</li>
            <li>You will record your voice responses for each question</li>
            <li>You have the option to re-record your answer before submitting</li>
            <li>There is no time limit for each question, but aim for 2-3 minutes per response</li>
          </ul>

          <p><strong>2. Technical Requirements:</strong></p>
          <ul>
            <li>Microphone access is required for voice recording</li>
            <li>Ensure you're in a quiet environment for clear audio quality</li>
            <li>Use a modern web browser with audio recording capabilities</li>
          </ul>

          <p><strong>3. Privacy & Data:</strong></p>
          <ul>
            <li>Your voice recordings will be used solely for interview evaluation</li>
            <li>Personal information provided will remain confidential</li>
            <li>Data will be securely stored and handled according to privacy standards</li>
          </ul>

          <p><strong>4. Interview Conduct:</strong></p>
          <ul>
            <li>Please answer questions honestly and authentically</li>
            <li>You may take a moment to think before recording your response</li>
            <li>Speak clearly and at a moderate pace</li>
            <li>If technical issues occur, you may restart the interview</li>
          </ul>
        </div>

        <div class="checkbox-group">
          <input 
            type="checkbox" 
            id="acceptTerms" 
            [(ngModel)]="termsAccepted"
          />
          <label for="acceptTerms">
            I have read and accept the terms and conditions above
          </label>
        </div>

        <div class="btn-group">
          <button 
            class="btn btn-secondary" 
            (click)="goBack()"
          >
            Back to Login
          </button>
          <button 
            class="btn btn-primary" 
            [disabled]="!termsAccepted || isStarting"
            (click)="startInterview()"
          >
            {{ isStarting ? 'Starting...' : 'Start Interview' }}
          </button>
        </div>

        <div class="reference-info">
          <p style="text-align: center; margin: 0;">
            💡 <strong>Tip:</strong> Find a quiet space and test your microphone before starting
          </p>
        </div>
      </div>
    </div>
  `
})
export class TermsComponent implements OnInit {
  termsAccepted = false;
  isStarting = false;

  constructor(
    private router: Router,
    private interviewService: InterviewService
  ) {}

  ngOnInit() {
    // Check if user has logged in
    this.interviewService.state$.subscribe(state => {
      if (!state.user) {
        this.router.navigate(['/login']);
      }
    });
  }

  goBack() {
    this.router.navigate(['/login']);
  }

  startInterview() {
    if (this.termsAccepted) {
      this.isStarting = true;
      
      setTimeout(() => {
        this.interviewService.acceptTerms();
        this.router.navigate(['/interview']);
      }, 1000);
    }
  }
}