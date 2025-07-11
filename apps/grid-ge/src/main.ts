/**
 * Grid-GE Multiplayer Game API
 * A RESTful API for managing multiplayer grid-ge games
 */

import express from 'express';
import * as path from 'path';
import { initializeDatabase, createTables } from './db/database';
import apiRoutes from './routes/api';

const app = express();

// Middleware
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.send({ message: 'Grid-GE API is running!' });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    console.log('Initializing database...');
    initializeDatabase();
    await createTables();
    console.log('Database initialized successfully');

    const port = process.env.PORT || 3333;
    const server = app.listen(port, () => {
      console.log(`🚀 Grid-GE API listening at http://localhost:${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`📋 API endpoints: http://localhost:${port}/api`);
    });

    server.on('error', console.error);

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
