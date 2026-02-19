import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;
  private tableUpdateSubject = new Subject<any>();
  private reservationStatusSubject = new Subject<any>();

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(environment.socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => console.log('Socket connected'));
    this.socket.on('disconnect', () => console.log('Socket disconnected'));

    this.socket.on('reservation-created', (data) => this.tableUpdateSubject.next({ type: 'created', ...data }));
    this.socket.on('reservation-cancelled', (data) => this.tableUpdateSubject.next({ type: 'cancelled', ...data }));
    this.socket.on('table-status-changed', (data) => this.tableUpdateSubject.next({ type: 'status', ...data }));
    this.socket.on('reservation-status-changed', (data) => this.reservationStatusSubject.next(data));
  }

  authenticate(userId: string) {
    this.socket?.emit('authenticate', userId);
  }

  joinRestaurantRoom(restaurantId: string) {
    this.socket?.emit('join-restaurant', restaurantId);
  }

  leaveRestaurantRoom(restaurantId: string) {
    this.socket?.emit('leave-restaurant', restaurantId);
  }

  onTableUpdate(): Observable<any> {
    return this.tableUpdateSubject.asObservable();
  }

  onReservationStatusChange(): Observable<any> {
    return this.reservationStatusSubject.asObservable();
  }

  disconnect() {
    this.socket?.disconnect();
  }
}
