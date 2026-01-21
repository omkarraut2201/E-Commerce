import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, tap, catchError, map, switchMap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { LoginResponse } from '../models/auth.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  // private readonly MOCK_USERS: User[] = [
  //   {
  //     id: '1',
  //     name: 'John Doe',
  //     email: 'user@example.com',
  //     phone: '9876543210',
  //     address: '123 Main St, City',
  //     // role: 'customer',
  //     createdAt: new Date('2024-01-01')
  //   },
  //   {
  //     id: '2',
  //     name: 'Admin User',
  //     email: 'admin@example.com',
  //     phone: '9876543211',
  //     address: '456 Admin St, City',
  //     // role: 'admin',
  //     createdAt: new Date('2024-01-01')
  //   }
  // ];
private readonly USERS_API_URL = 'https://6937b2ba4618a71d77cd4f0c.mockapi.io/users';
  // Holds current user (null if not logged in)
  private currentUser$ = new BehaviorSubject<User | null>(
    this.loadFromLocalStorage()
  );
  
  // Holds current auth token
  private authToken$ = new BehaviorSubject<string | null>(
    this.getTokenFromStorage()
  );

  constructor(private http: HttpClient) {
    console.log('[AuthService] Initialized');
  }

  login(email: string, password: string): Observable<LoginResponse> {

    // Step 1: Fetch all users from API and find by email
    return this.http.get<User[]>(this.USERS_API_URL).pipe(
      delay(500),
      switchMap(users => {
        const user = users.find(u => u.email === email);
        
        if (!user) {
          return throwError(() => ({
            code: 'USER_NOT_FOUND',
            message: 'Invalid email or password'
          }));
        }

        // Step 2: Validate password
        if (!this.validatePassword(email, password)) {
          return throwError(() => ({
            code: 'INVALID_PASSWORD',
            message: 'Invalid email or password'
          }));
        }

        // Step 3: Generate token
        const token = this.generateToken(user.id);
        const response: LoginResponse = { user, token };

        return of(response);
      }),
      tap(res => {
        // Update state
        this.currentUser$.next(res.user);
        this.authToken$.next(res.token);
        
        // Persist to localStorage
        this.saveToLocalStorage('currentUser', JSON.stringify(res.user));
        this.saveToLocalStorage('authToken', res.token);
      }),
      catchError(error => {
        console.error('[AuthService] Login error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout current user
   * Clears session and localStorage
   */
  logout(): void {
    console.log('[AuthService] Logging out');
    this.currentUser$.next(null);
    this.authToken$.next(null);
    this.removeFromLocalStorage('currentUser');
    this.removeFromLocalStorage('authToken');
  }

  /**
   * Remove item from localStorage safely
   */
  private removeFromLocalStorage(key: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('[AuthService] Error removing from localStorage:', error);
    }
  }

  /**
   * Get current user as Observable
   * Used by: Navbar, Profile component
   */
  getCurrentUser(): Observable<User | null> {
    return this.currentUser$.asObservable();
  }

  /**
   * Get current user synchronously
   * Used by: Guards, Interceptors
   */
  getCurrentUserSync(): User | null {
    return this.currentUser$.value;
  }

  /**
   * Check if user is authenticated (synchronously)
   * Used by: Guards
   */
  isAuthenticated(): boolean {
    return this.currentUser$.value !== null;
  }

  /**
   * Get authentication state as Observable
   * Used by: Components that react to auth changes
   */
  isAuthenticated$(): Observable<boolean> {
    return this.currentUser$.pipe(
      map(user => user !== null)
    );
  }

  /**
   * Get auth token
   * Used by: HTTP Interceptor
   */
  getToken(): string | null {
    return this.authToken$.value;
  }

  /**
   * Validate password against hardcoded credentials
   * In real app, this would be on backend with bcrypt
   */
  private validatePassword(email: string, password: string): boolean {
    const credentials: { [key: string]: string } = {
      'user@example.com': 'password123',
      'admin@example.com': 'admin123'
    };
    return credentials[email] === password;
  }

  /**
   * Generate mock JWT token
   */
  private generateToken(userId: string): string {
    const payload = {
      userId: userId,
      timestamp: Date.now()
    };
    return btoa(JSON.stringify(payload)); // Base64 encode
  }

  /**
   * Load user from localStorage on app startup
   * So user stays logged in after page refresh
   */
  private loadFromLocalStorage(): User | null {
    try {
      // Check if localStorage is available
      if (typeof localStorage !== 'undefined') {
        const userJson = localStorage.getItem('currentUser');
        return userJson ? JSON.parse(userJson) : null;
      }
      return null;
    } catch (error) {
      console.error('[AuthService] Error loading from localStorage:', error);
      return null;
    }
  }

  /**
   * Get token from localStorage safely
   * Handles SSR environment where localStorage doesn't exist
   */
  private getTokenFromStorage(): string | null {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem('authToken');
      }
      return null;
    } catch (error) {
      console.error('[AuthService] Error getting token from localStorage:', error);
      return null;
    }
  }

  /**
   * Safely save to localStorage
   * Handles SSR environment where localStorage doesn't exist
   */
  private saveToLocalStorage(key: string, value: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('[AuthService] Error saving to localStorage:', error);
    }
  }

    // Used by: Profile page edit functionality

  updateUserProfile(userId: string, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.USERS_API_URL}/${userId}`, data).pipe(
      tap(updatedUser => {
        // Update current user state
        this.currentUser$.next(updatedUser);
        // Persist updated user to localStorage
        this.saveToLocalStorage('currentUser', JSON.stringify(updatedUser));
        console.log('[AuthService] Profile updated successfully');
      }),
      catchError(error => {
        console.error('[AuthService] Update profile error:', error);
        return throwError(() => error);
      })
    );
  }

}
