// server.ts

import dotenv from 'dotenv';
dotenv.config(); // Carga las variables de entorno al inicio

import express from 'express';
import { createServer } from 'http';
import next from 'next';
import { Server } from 'socket.io';
import cors from 'cors';
import { setSocketInstance } from '@/lib/socket';
import { setupSocketHandlers } from '@/lib/socketHandlers';
import { connectDB } from '@/lib/mongodb';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Define CORS_ORIGIN y PORT
const CORS_ORIGIN = process.env.CORS_ORIGIN || "https://www.rmazh.com.mx";
const PORT = process.env.PORT || 3000;

// Función principal para iniciar el servidor
async function startServer() {
  try {
    // Conecta a MongoDB
    await connectDB();
    console.log('Connected to MongoDB');

    // Prepara la aplicación Next.js
    await app.prepare();

    const expressApp = express();
    const server = createServer(expressApp);

    // Aplica CORS a todas las rutas HTTP
    expressApp.use(cors({
      origin: CORS_ORIGIN,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
    }));

    // Configuración de Socket.IO
    const io = new Server(server, {
      cors: {
        origin: CORS_ORIGIN,
        methods: ["GET", "POST"],
        credentials: true
      },
      path: '/socket.io'
    });
    setSocketInstance(io);

    // Configura los manejadores de eventos de Socket.IO
    setupSocketHandlers(io);

    io.on('connection', (socket) => {
      console.log('New client connected');
      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });

    // Maneja todas las peticiones con Next.js
    expressApp.all('*', (req, res) => {
      return handle(req, res);
    });

    // Inicia el servidor
    server.listen(PORT, () => {
      console.log(`> Ready on http://localhost:${PORT}`);
      console.log(`> CORS configured for origin: ${CORS_ORIGIN}`);
    });

  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Inicia el servidor
startServer();