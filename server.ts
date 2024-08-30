import express from 'express';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import { setSocketInstance } from './lib/socket';
import { setupSocketHandlers } from './lib/socketHandlers';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.prepare().then(() => {
  const expressApp = express();
  const server = createServer(expressApp);

  // Apply CORS to all HTTP routes
  expressApp.use(cors({
    origin: process.env.CORS_ORIGIN || "https://www.rmazh.com.mx",
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  }));

  // Socket.IO configuration
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "https://www.rmazh.com.mx",
      methods: ["GET", "POST"],
      credentials: true
    },
    path: '/socket.io'
  });
  setSocketInstance(io);

  // Setup Socket.IO event handlers
  setupSocketHandlers(io);

  // Handle all requests with Next.js
  expressApp.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(3000, (err?: any) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});