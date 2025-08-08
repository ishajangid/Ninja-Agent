import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Router, RouterOutlet, RouterModule } from '@angular/router';
import { provideHttpClient } from '@angular/common/http'; 
import { routes } from './app.routes';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, FormsModule],
  template: `
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  constructor(private router: Router) {
    // Add console log to debug
    console.log('AppComponent initialized');
    this.router.navigate(['/login']);
  }
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient() 
  ]
}).catch(err => console.error('Bootstrap error:', err)); 