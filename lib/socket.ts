import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function setSocketInstance(socketIo: SocketIOServer) {
  io = socketIo;
}

export function getSocketInstance() {
  return io;
}