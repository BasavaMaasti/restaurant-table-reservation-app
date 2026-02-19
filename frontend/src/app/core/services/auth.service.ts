import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  register(data: { name: string; email: string; password: string; phone?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, data);
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { email, password });
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/logout`, {});
  }

  getMe(): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/auth/me`).pipe(
      // map to user
    ) as any;
  }

  updateMe(data: Partial<User>): Observable<User> {
    return this.http.patch<any>(`${this.apiUrl}/auth/me`, data) as any;
  }

  refreshToken(): Observable<{ accessToken: string }> {
    return this.http.post<any>(`${this.apiUrl}/auth/refresh`, {});
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.http.patch(`${this.apiUrl}/auth/change-password`, data);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/auth/reset-password/${token}`, { password });
  }
}
