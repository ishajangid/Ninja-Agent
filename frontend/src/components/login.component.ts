
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InterviewService, User } from '../services/interview.service';
import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="card fade-in">
        <div class="header">
          <div class="logo">🎤</div>
          <h1>Ninja AI Interview Platform</h1>
          <p class="subtitle">
            Welcome to your personalized interview experience
          </p>
        </div>
        
        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="form-group">
            <label for="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              [(ngModel)]="user.name"
              required
              minlength="2"
              placeholder="Enter your full name"
              #nameInput="ngModel"
            />
            <div *ngIf="nameInput.invalid && nameInput.touched" class="error-message">
              <span *ngIf="nameInput.errors?.['required']">⚠️ Name is required</span>
              <span *ngIf="nameInput.errors?.['minlength']">⚠️ Name must be at least 2 characters</span>
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              [(ngModel)]="user.email"
              required
              email
              placeholder="Enter your email address"
              #emailInput="ngModel"
            />
            <div *ngIf="emailInput.invalid && emailInput.touched" class="error-message">
              <span *ngIf="emailInput.errors?.['required']">⚠️ Email is required</span>
              <span *ngIf="emailInput.errors?.['email']">⚠️ Please enter a valid email address</span>
            </div>
          </div>

          <div class="btn-group">
            <button 
              type="submit" 
              class="btn btn-primary"
              [disabled]="!loginForm.form.valid || isSubmitting"
            >
              {{ isSubmitting ? 'Please wait...' : 'Continue to Terms' }}
            </button>
          </div>
        </form>

        <div class="reference-info">
          <p style="text-align: center; margin: 0;">
            🔒 Your information is secure and will only be used for this interview
          </p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  user: User = {
    name: '',
    email: ''
  };

  isSubmitting = false;

  constructor(
    
    private router: Router,
    private interviewService: InterviewService
    
  ) {}

  onSubmit() {
    if (this.user.name.trim() && this.user.email.trim()) {
      this.isSubmitting = true;
      
      // Simulate a brief loading state for better UX
      setTimeout(() => {
        this.interviewService.setUser(this.user);
        this.router.navigate(['/terms']);
      }, 800);
    }
  }
}