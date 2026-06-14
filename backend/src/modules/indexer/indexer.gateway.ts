import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/indexer',
  cors: { origin: '*', credentials: true },
})
export class IndexerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(IndexerGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket): void {
    this.logger.debug(`Indexer client connected: ${client.id}`);
    client.emit('connected', { message: 'Connected to indexer events' });
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Indexer client disconnected: ${client.id}`);
  }

  broadcastIndexedEvent(event: any): void {
    this.server.emit('indexedEvent', event);
  }
}
