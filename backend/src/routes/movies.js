import { Router } from 'express';
import ytsService from '../services/yts.js';

const router = Router();

// ─── GET /api/movies ─────────────────────────────────────────────
// Default listing — returns popular movies (same as /popular).
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const data = await ytsService.getPopular(page);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/movies/trending ────────────────────────────────────
// Returns 10 random trending movies for the hero banner carousel.
router.get('/trending', async (req, res, next) => {
  try {
    const data = await ytsService.getTrending(1);

    // Shuffle and pick 10 random results for the hero section
    const shuffled = [...data.results].sort(() => Math.random() - 0.5);
    const heroMovies = shuffled.slice(0, 10);

    res.json({
      results: heroMovies,
      page: 1,
      totalPages: 1,
      totalResults: heroMovies.length,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/movies/popular ─────────────────────────────────────
router.get('/popular', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const data = await ytsService.getPopular(page);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/movies/top-rated ───────────────────────────────────
router.get('/top-rated', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const data = await ytsService.getTopRated(page);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/movies/latest ─────────────────────────────────────
router.get('/latest', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const data = await ytsService.getLatest(page);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/movies/search ─────────────────────────────────────
router.get('/search', async (req, res, next) => {
  try {
    const query = req.query.q || '';
    const page = parseInt(req.query.page, 10) || 1;

    if (!query.trim()) {
      return res.json({ results: [], page: 1, totalPages: 0, totalResults: 0 });
    }

    const data = await ytsService.search(query, page);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/movies/:id ────────────────────────────────────────
// Single movie details (cast, images, torrents).
router.get('/:id', async (req, res, next) => {
  try {
    const movie = await ytsService.getDetails(req.params.id);
    res.json(movie);
  } catch (err) {
    next(err);
  }
});

export default router;
