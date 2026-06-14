import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/liquidations',
  cors: { origin: '*', credentials: true },
})
export class LiquidationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(LiquidationGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket): void {
    this.logger.debug(`Liquidation client connected: ${client.id}`);
    client.emit('connected', { message: 'Connected to liquidation events' });
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Liquidation client disconnected: ${client.id}`);
  }

  broadcastLiquidationEvent(event: any): void {
    this.server.emit('liquidationEvent', event);
  }
}
