import axios from 'axios';

const BASE_URL = 'https://api.tvmaze.com';

/**
 * Strip HTML tags from a string (TVMaze returns HTML in summaries).
 *
 * @param {string} html - Raw HTML string
 * @returns {string} Plain text
 */
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Normalize a single TVMaze show object into the CineVault standard format.
 */
function normalizeShow(show) {
  return {
    id: show.id,
    title: show.name,
    year: show.premiered ? parseInt(show.premiered.slice(0, 4), 10) : null,
    rating: show.rating?.average ?? null,
    poster: show.image?.medium || null,
    backdrop: show.image?.original || null,
    summary: stripHtml(show.summary),
    genres: show.genres || [],
    runtime: show.runtime || show.averageRuntime || 0,
    type: 'series',
    status: show.status || null,
  };
}

/**
 * TVMazeService — wraps the free TVMaze REST API.
 *
 * Notes:
 *  • TVMaze's /shows index returns 250 shows per page starting at page 0.
 *    We manually sort by rating and slice into 20-item "virtual" pages for
 *    the frontend.
 *  • The search endpoint already returns relevance-ranked results.
 */
class TVMazeService {
  constructor() {
    /**
     * Simple in-memory cache for the paginated /shows index.
     * Key = TVMaze page number, Value = { data, timestamp }.
     * Entries expire after 1 hour.
     */
    this._cache = new Map();
    this._cacheTTL = 60 * 60 * 1000; // 1 hour
  }

  /**
   * Fetch a page from the /shows index and cache it.
   *
   * @param {number} tvmazePage - Zero-based TVMaze page index
   * @returns {Promise<object[]>} Array of raw show objects
   */
  async _fetchShowsPage(tvmazePage = 0) {
    const cached = this._cache.get(tvmazePage);
    if (cached && Date.now() - cached.timestamp < this._cacheTTL) {
      return cached.data;
    }

    const { data } = await axios.get(`${BASE_URL}/shows`, {
      params: { page: tvmazePage },
      timeout: 10_000,
      headers: { 'User-Agent': 'CineVault/1.0' }
    });

    this._cache.set(tvmazePage, { data, timestamp: Date.now() });
    return data;
  }

  /**
   * "Popular" shows — fetches a chunk from the index, sorts by rating
   * descending, and returns a 20-item page.
   *
   * We pull from several TVMaze pages to get a large pool, sort it,
   * then slice out the requested virtual page.
   *
   * @param {number} page - 1-based virtual page number
   */
  async getPopular(page = 1) {
    const PAGE_SIZE = 20;

    // Pull from 4 TVMaze pages (1 000 shows) — enough for 50 virtual pages.
    const pagesToFetch = [0, 1, 2, 3];
    const responses = await Promise.all(
      pagesToFetch.map((p) => this._fetchShowsPage(p))
    );

    // Flatten, filter out shows without ratings, sort descending
    const allShows = responses
      .flat()
      .filter((s) => s.rating?.average != null)
      .sort((a, b) => (b.rating.average ?? 0) - (a.rating.average ?? 0));

    const start = (page - 1) * PAGE_SIZE;
    const slice = allShows.slice(start, start + PAGE_SIZE);

    return {
      results: slice.map(normalizeShow),
      page,
      totalPages: Math.ceil(allShows.length / PAGE_SIZE),
      totalResults: allShows.length,
    };
  }

  /**
   * Free-text search across show titles.
   *
   * @param {string} query - Search term
   * @returns {Promise<object>} Paginated response (single page — TVMaze
   *   does not paginate search results)
   */
  async search(query) {
    if (!query) {
      return { results: [], page: 1, totalPages: 0, totalResults: 0 };
    }

    const { data } = await axios.get(`${BASE_URL}/search/shows`, {
      params: { q: query },
      timeout: 10_000,
      headers: { 'User-Agent': 'CineVault/1.0' }
    });

    const results = data.map((item) => normalizeShow(item.show));

    return {
      results,
      page: 1,
      totalPages: 1,
      totalResults: results.length,
    };
  }

  /**
   * Fetch full details for a single show.
   *
   * @param {number|string} showId - TVMaze show ID
   * @returns {Promise<object>} Normalized show object
   */
  async getDetails(showId) {
    const { data } = await axios.get(`${BASE_URL}/shows/${showId}`, {
      timeout: 10_000,
      headers: { 'User-Agent': 'CineVault/1.0' }
    });

    return normalizeShow(data);
  }
}

export default new TVMazeService();
