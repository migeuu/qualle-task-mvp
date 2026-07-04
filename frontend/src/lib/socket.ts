import { io, type Socket } from 'socket.io-client';
import { getToken } from './auth';
import { env } from './env';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(`${env.wsUrl}/events`, {
      auth: {
        token: getToken(),
      },
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });
  }

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
