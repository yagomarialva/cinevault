import { Router } from 'express';
import torrentService from '../services/torrent.js';

const router = Router();

// ─── GET /api/torrents/search ────────────────────────────────────
// Aggregate torrent search across 1337x + TPB.
router.get('/search', async (req, res, next) => {
  try {
    const query = req.query.q || '';

    if (!query.trim()) {
      return res.json([]);
    }

    const results = await torrentService.search(query);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

export default router;
