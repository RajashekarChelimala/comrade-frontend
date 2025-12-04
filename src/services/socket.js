import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

let socket;

export function getSocket(accessToken) {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: {
        token: accessToken,
      },
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
