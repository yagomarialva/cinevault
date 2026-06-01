import { Router } from 'express';
import tvmazeService from '../services/tvmaze.js';

const router = Router();

// ─── GET /api/series/popular ─────────────────────────────────────
router.get('/popular', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const data = await tvmazeService.getPopular(page);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/series/search ──────────────────────────────────────
router.get('/search', async (req, res, next) => {
  try {
    const query = req.query.q || '';

    if (!query.trim()) {
      return res.json({ results: [], page: 1, totalPages: 0, totalResults: 0 });
    }

    const data = await tvmazeService.search(query);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/series/:id ─────────────────────────────────────────
// Single show details.
router.get('/:id', async (req, res, next) => {
  try {
    const show = await tvmazeService.getDetails(req.params.id);
    res.json(show);
  } catch (err) {
    next(err);
  }
});

export default router;
