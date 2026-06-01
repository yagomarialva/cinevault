const BASE_URL = '/api';

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

export const fetchTrending = () => fetchJSON(`${BASE_URL}/movies/trending`);
export const fetchPopular = (page = 1) => fetchJSON(`${BASE_URL}/movies/popular?page=${page}`);
export const fetchTopRated = (page = 1) => fetchJSON(`${BASE_URL}/movies/top-rated?page=${page}`);
export const fetchLatest = (page = 1) => fetchJSON(`${BASE_URL}/movies/latest?page=${page}`);
export const searchMovies = (query, page = 1) => fetchJSON(`${BASE_URL}/movies/search?q=${encodeURIComponent(query)}&page=${page}`);
export const fetchMovieDetails = (id) => fetchJSON(`${BASE_URL}/movies/${id}`);
export const fetchPopularSeries = (page = 1) => fetchJSON(`${BASE_URL}/series/popular?page=${page}`);
export const searchSeries = (query, page = 1) => fetchJSON(`${BASE_URL}/series/search?q=${encodeURIComponent(query)}&page=${page}`);
export const searchTorrents = (query) => fetchJSON(`${BASE_URL}/torrents/search?q=${encodeURIComponent(query)}`);
export const searchYouTube = (query, limit = 5) => fetchJSON(`${BASE_URL}/youtube/search?q=${encodeURIComponent(query)}&limit=${limit}`);
export const fetchYouTubeDetails = (url) => fetchJSON(`${BASE_URL}/youtube/details?url=${encodeURIComponent(url)}`);
export const fetchYouTubePlaylist = (url) => fetchJSON(`${BASE_URL}/youtube/playlist?url=${encodeURIComponent(url)}`);

export const downloadYouTubeZip = async (urls) => {
  const res = await fetch(`${BASE_URL}/youtube/playlist/download-zip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls }),
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.blob();
};
