import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/markets',
  cors: { origin: '*', credentials: true },
})
export class LendingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(LendingGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket): void {
    this.logger.debug(`Market client connected: ${client.id}`);
    client.emit('connected', { message: 'Connected to market updates' });
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Market client disconnected: ${client.id}`);
  }

  broadcastMarketUpdate(marketData: any): void {
    this.server.emit('marketUpdate', marketData);
  }
}
