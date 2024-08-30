import express from 'express';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import Ticket from '@/models/Ticket';
import cors from 'cors';
import { setSocketInstance } from './app/api/tickets/route';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.prepare().then(() => {
  const expressApp = express();
  const server = createServer(expressApp);

  // Aplicar CORS a todas las rutas HTTP
  expressApp.use(cors({
    origin: process.env.CORS_ORIGIN || "https://www.rmazh.com.mx",
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  }));

  // Configuración de Socket.IO
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "https://www.rmazh.com.mx",
      methods: ["GET", "POST"],
      credentials: true
    },
    path: '/socket.io'
  });
  setSocketInstance(io);

  io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('newTicket', async (ticketData) => {
      try {
        // Guardar el ticket en MongoDB
        const ticket = new Ticket(ticketData);
        await ticket.save();

        // Emitir actualización a todos los clientes
        io.emit('ticketUpdate', {
          date: new Date(),
          profit: ticket.totalProfit,
          sales: ticket.totalAmount,
          location: ticket.location
        });

        console.log('New ticket saved and update emitted:', ticket.ticketId);
      } catch (error) {
        console.error('Error saving ticket:', error);
      }
    });

    socket.on('requestInitialData', async ({ timeframe, location }) => {
      try {
        let startDate = new Date();
        if (timeframe === 'week') {
          startDate.setDate(startDate.getDate() - 7);
        } else if (timeframe === 'month') {
          startDate.setMonth(startDate.getMonth() - 1);
        } else {
          startDate.setHours(0, 0, 0, 0); // Inicio del día actual
        }

        const matchStage: any = { date: { $gte: startDate } };
        if (location) {
          matchStage.location = location;
        }

        const profitData = await Ticket.aggregate([
          { $match: matchStage },
          { 
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$date" }
              },
              totalProfit: { $sum: "$totalProfit" },
              totalSales: { $sum: "$totalAmount" }
            }
          },
          { $sort: { _id: 1 } }
        ]);

        socket.emit('initialData', profitData);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  // Manejar todas las solicitudes con Next.js
  expressApp.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(3000, (err?: any) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});