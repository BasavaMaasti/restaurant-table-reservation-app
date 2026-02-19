import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard`);
  }

  getReservations(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach((k) => { if (filters[k]) params = params.set(k, filters[k]); });
    }
    return this.http.get<any>(`${this.apiUrl}/reservations`, { params });
  }

  getAnalytics(period = '30'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics`, { params: { period } });
  }

  getUsers(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) Object.keys(filters).forEach((k) => { if (filters[k]) params = params.set(k, filters[k]); });
    return this.http.get<any>(`${this.apiUrl}/users`, { params });
  }

  updateUserRole(userId: string, role: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/users/${userId}/role`, { role });
  }

  toggleUserActive(userId: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/users/${userId}/toggle`, {});
  }
}
