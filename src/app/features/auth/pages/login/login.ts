import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorService } from '../../../../core/services/error.service';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    FloatLabelModule,
    PasswordModule,
    ButtonModule,
    DividerModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {

  loginForm!: FormGroup;
  isLoading = signal(false);
  showPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private errorService: ErrorService,
    private router: Router
  ) {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  getEmailError(): string {
    const emailControl = this.loginForm.get('email');
    if (emailControl?.hasError('required')) {
      return 'Email is required';
    }
    if (emailControl?.hasError('email') || emailControl?.hasError('pattern')) {
      return 'Please enter a valid email address (e.g., user@example.com)';
    }
    return '';
  }

  getPasswordError(): string {
    const passwordControl = this.loginForm.get('password');
    if (passwordControl?.hasError('required')) {
      return 'Password is required';
    }
    if (passwordControl?.hasError('minlength')) {
      return 'Password must be at least 6 characters';
    }
    return '';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      // console.log('[Login] Form is invalid');
      return;
    }

    this.isLoading.set(true);

    const { email, password } = this.loginForm.value;
    // console.log(`[Login] Submitting login for: ${email}`);

    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        // console.log('[Login] Login successful', response.user.email);

        this.errorService.showSuccess(`Welcome ${response.user.name}!`);

        this.router.navigate(['/products']).catch(err => {
          // console.log('[Login] Products route not ready, staying on login');
        });
      },
      error: (error) => {
        // console.error('[Login] Login failed:', error);
        this.isLoading.set(false);

        this.errorService.showError(error.message || 'Invalid email or password');
      },
      complete: () => {
        console.log('[Login] Login request completed');
      }
    });
  }
}

