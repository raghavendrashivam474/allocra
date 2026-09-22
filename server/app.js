import express from 'express';
import cors from 'cors';
import institutionRoutes from './routes/institutionRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// S0.2.1: Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// S0.3.4: Institution API
app.use('/api/institution', institutionRoutes);

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message || err);
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

export default app;
