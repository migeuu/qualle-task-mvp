import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';
import { EVENTS } from '../events/event.constants';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@Injectable()
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'events',
})
export class TaskGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TaskGateway.name);

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.query?.token;

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(
        typeof token === 'string' ? token : token[0] as string,
      );
      client.userId = payload.sub;
      client.join(`user:${payload.sub}`);
      this.logger.log(`Client connected: ${client.userId}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.userId}`);
  }

  @SubscribeMessage('ping')
  handlePing(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: unknown,
  ) {
    return { event: 'pong', data, userId: client.userId };
  }

  // Listener: Task Updated -> emite para usuarios relevantes
  @OnEvent(EVENTS.TASK_UPDATED)
  handleTaskUpdated(payload: { task: unknown; userIds: string[] }) {
    payload.userIds.forEach((userId) => {
      this.server.to(`user:${userId}`).emit('task.update', payload.task);
    });
  }

  // Listener: Task Assigned -> emite para usuarios relevantes
  @OnEvent(EVENTS.TASK_ASSIGNED)
  handleTaskAssigned(payload: { task: unknown; userIds: string[] }) {
    payload.userIds.forEach((userId) => {
      this.server.to(`user:${userId}`).emit('task.update', payload.task);
    });
  }

  // Listener: New Comment -> emite para usuarios relevantes
  @OnEvent(EVENTS.NEW_COMMENT)
  handleNewComment(payload: { comment: unknown; userIds: string[] }) {
    payload.userIds.forEach((userId) => {
      this.server.to(`user:${userId}`).emit('task.update', payload.comment);
    });
  }

  // Listener: Notificacoes individuais
  @OnEvent(EVENTS.NOTIFICATION)
  handleNotification(payload: { userId: string; message: string }) {
    this.server.to(`user:${payload.userId}`).emit('notification', {
      message: payload.message,
      timestamp: new Date(),
    });
  }
}
