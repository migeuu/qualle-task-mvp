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
import { TaskEventVO } from '../modules/core/domain/value-objects/task-event.vo';

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

  @OnEvent('task.updated')
  handleTaskUpdated(event: TaskEventVO) {
    event.affectedUserIds.forEach((userId) => {
      this.server.to(`user:${userId}`).emit('task.update', {
        taskId: event.taskId,
        eventAuthorId: event.eventAuthorId,
        eventType: event.eventType,
      });
    });
  }

  @OnEvent('task.assigned')
  handleTaskAssigned(event: TaskEventVO) {
    event.affectedUserIds.forEach((userId) => {
      this.server.to(`user:${userId}`).emit('task.update', {
        taskId: event.taskId,
        eventAuthorId: event.eventAuthorId,
        eventType: event.eventType,
      });
    });
  }

  @OnEvent('task.newComment')
  handleNewComment(event: TaskEventVO) {
    event.affectedUserIds.forEach((userId) => {
      this.server.to(`user:${userId}`).emit('task.update', {
        taskId: event.taskId,
        eventAuthorId: event.eventAuthorId,
        eventType: event.eventType,
      });
    });
  }

  @OnEvent('notification.*')
  handleNotification(payload: { type: string; userId: string; payload: TaskEventVO }) {
    this.server.to(`user:${payload.userId}`).emit('notification', {
      taskId: payload.payload.taskId,
      eventAuthorId: payload.payload.eventAuthorId,
      eventType: payload.payload.eventType,
      timestamp: new Date(),
    });
  }
}
