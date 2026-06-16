import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private socket: Socket | null = null;

  constructor(private readonly zone: NgZone) {}

  connect(): void {
    if (!this.socket) {
      this.socket = io(environment.wsUrl, { transports: ['websocket'], autoConnect: true });
    }
  }

  onEvent<T>(eventName: string): Observable<T> {
    this.connect();
    return new Observable<T>((subscriber) => {
      const handler = (payload: T) => this.zone.run(() => subscriber.next(payload));
      this.socket?.on(eventName, handler);
      return () => this.socket?.off(eventName, handler);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}
