import express from 'express';
import cors from 'cors';

import moviesRouter from './routes/movies.js';
import seriesRouter from './routes/series.js';
import torrentsRouter from './routes/torrents.js';
import youtubeRouter from './routes/youtube.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Global Middleware ───────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// ─── Health Check ────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ──────────────────────────────────────────────────
app.use('/api/movies', moviesRouter);
app.use('/api/series', seriesRouter);
app.use('/api/torrents', torrentsRouter);
app.use('/api/youtube', youtubeRouter);

// ─── Global Error Handler (must be registered last) ─────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🎬 CineVault API running on http://localhost:${PORT}`);
  console.log(`   Health check → http://localhost:${PORT}/api/health`);
});

export default app;
