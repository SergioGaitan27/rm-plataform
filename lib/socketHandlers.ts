// lib/socketHandlers.ts

import { Server as SocketIOServer, Socket } from 'socket.io';
import Ticket from '@/models/Ticket';

export function setupSocketHandlers(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected');

    socket.on('newTicket', async (ticketData) => {
      try {
        // Save the ticket in MongoDB
        const ticket = new Ticket(ticketData);
        await ticket.save();

        // Emit update to all clients
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
          startDate.setHours(0, 0, 0, 0); // Start of the current day
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
}

export function emitTicketUpdate(io: SocketIOServer, ticketData: any) {
  io.emit('ticketUpdate', {
    date: ticketData.date,
    profit: ticketData.totalProfit,
    sales: ticketData.totalAmount,
    location: ticketData.location
  });
}