import express from 'express';
import cors from 'cors';
import institutionRoutes from './routes/institutionRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import programRoutes from './routes/programRoutes.js';
import termRoutes from './routes/termRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';

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

// S1.1: Academic Structure API
app.use('/api/departments', departmentRoutes);
app.use('/api/programs', programRoutes);

// S1.2: Academic Terms & Groups API
app.use('/api/terms', termRoutes);
app.use('/api/groups', groupRoutes);

// S1.3: Calendar Configuration API
app.use('/api/calendar', calendarRoutes);

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message || err);
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

export default app;

