import axios from 'axios';

const BASE_URL = 'https://yts.mx/api/v2';

const cache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
let apiQueue = Promise.resolve();

function enqueueApiCall(fn) {
  return new Promise((resolve, reject) => {
    apiQueue = apiQueue.then(async () => {
      try {
        // Add a small delay between requests to avoid rate limits
        await new Promise(r => setTimeout(r, 500));
        const result = await fn();
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  });
}

/**
 * Tracker list used to build magnet URIs from torrent hashes.
 * These are well-known, public UDP trackers.
 */
const TRACKERS = [
  'udp://open.demonii.com:1337/announce',
  'udp://tracker.openbittorrent.com:80',
  'udp://tracker.coppersurfer.tk:6969',
  'udp://glotorrents.pw:6969/announce',
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://torrent.gresille.org:80/announce',
  'udp://p4p.arenabg.com:1337',
  'udp://tracker.leechers-paradise.org:6969',
];

/**
 * Build a magnet URI from a torrent hash and display name.
 *
 * @param {string} hash  - Info hash of the torrent
 * @param {string} title - Human-readable name (URL-encoded automatically)
 * @returns {string} Fully-formed magnet link
 */
function buildMagnet(hash, title) {
  const encodedTitle = encodeURIComponent(title);
  const trackerParams = TRACKERS.map(
    (t) => `&tr=${encodeURIComponent(t)}`
  ).join('');
  return `magnet:?xt=urn:btih:${hash}&dn=${encodedTitle}${trackerParams}`;
}

/**
 * Normalize a single YTS movie object into the standard CineVault format.
 */
function normalizeMovie(movie) {
  return {
    id: movie.id,
    title: movie.title,
    year: movie.year,
    rating: movie.rating,
    poster: movie.medium_cover_image || movie.small_cover_image || null,
    backdrop: movie.background_image || movie.background_image_original || null,
    summary: movie.summary || movie.synopsis || '',
    genres: movie.genres || [],
    runtime: movie.runtime || 0,
    type: 'movie',
    torrents: (movie.torrents || []).map((t) => ({
      quality: t.quality,
      type: t.type,
      size: t.size,
      seeds: t.seeds,
      peers: t.peers,
      magnet: buildMagnet(t.hash, movie.title),
    })),
  };
}

/**
 * Wrap an array of normalized movies in the paginated envelope the
 * frontend expects.
 */
function buildResponse(data) {
  const movies = (data.movies || []).map(normalizeMovie);
  return {
    results: movies,
    page: data.page_number || 1,
    totalPages: Math.ceil((data.movie_count || 0) / (data.limit || 20)),
    totalResults: data.movie_count || 0,
  };
}

/**
 * YTSService — thin wrapper around the YTS public API.
 * Every public method returns data in the CineVault standard format.
 */
class YTSService {
  /**
   * Generic helper that hits the list_movies endpoint.
   *
   * @param {object} params - Query-string parameters forwarded to YTS
   * @returns {Promise<object>} Normalized paginated response
   */
  async _list(params = {}) {
    const cacheKey = JSON.stringify(params);
    if (cache.has(cacheKey)) {
      const { data, timestamp } = cache.get(cacheKey);
      if (Date.now() - timestamp < CACHE_TTL) {
        return data;
      }
    }

    return enqueueApiCall(async () => {
      const { data: res } = await axios.get(`${BASE_URL}/list_movies.json`, {
        params: { limit: 20, ...params },
        timeout: 10_000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (res.status !== 'ok') {
        throw new Error(`YTS API returned status: ${res.status}`);
      }

      const formatted = buildResponse(res.data);
      cache.set(cacheKey, { data: formatted, timestamp: Date.now() });
      return formatted;
    });
  }

  /**
   * Movies ordered by like count — ideal for the hero banner carousel.
   */
  async getTrending(page = 1) {
    return this._list({ sort_by: 'like_count', page });
  }

  /**
   * Movies ordered by download count — the "most watched" section.
   */
  async getPopular(page = 1) {
    return this._list({ sort_by: 'download_count', page });
  }

  /**
   * Critically acclaimed films (minimum 7.0 rating).
   */
  async getTopRated(page = 1) {
    return this._list({ sort_by: 'rating', minimum_rating: 7, page });
  }

  /**
   * Newest releases first.
   */
  async getLatest(page = 1) {
    return this._list({ sort_by: 'date_added', page });
  }

  /**
   * Free-text search across movie titles.
   *
   * @param {string} query - Search term
   * @param {number} page  - Page number
   */
  async search(query, page = 1) {
    return this._list({ query_term: query, page });
  }

  /**
   * Fetch detailed info for a single movie, including cast & images.
   *
   * @param {number|string} movieId
   * @returns {Promise<object>} Normalized single-movie object
   */
  async getDetails(movieId) {
    const cacheKey = `details_${movieId}`;
    if (cache.has(cacheKey)) {
      const { data, timestamp } = cache.get(cacheKey);
      if (Date.now() - timestamp < CACHE_TTL) return data;
    }

    return enqueueApiCall(async () => {
      const { data: res } = await axios.get(`${BASE_URL}/movie_details.json`, {
        params: { movie_id: movieId, with_cast: true, with_images: true },
        timeout: 10_000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });

      if (res.status !== 'ok') {
        throw new Error(`YTS API returned status: ${res.status}`);
      }

      const movie = normalizeMovie(res.data.movie);

      if (res.data.movie.cast) {
        movie.cast = res.data.movie.cast.map((c) => ({
          name: c.name,
          character: c.character_name,
          image: c.url_small_image || null,
        }));
      }

      cache.set(cacheKey, { data: movie, timestamp: Date.now() });
      return movie;
    });
  }
}

export default new YTSService();
