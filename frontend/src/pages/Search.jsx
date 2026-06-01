import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchResults from '../components/SearchResults';
import Pagination from '../components/Pagination';
import TorrentLinks from '../components/TorrentLinks';
import { searchMovies, searchSeries, searchYouTube } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';

export default function Search({ onMovieSelect }) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page'), 10) || 1;

  const [results, setResults] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setTotalPages(0);
      return;
    }

    let cancelled = false;

    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [moviesData, seriesData, ytData] = await Promise.all([
          searchMovies(query, page).catch(() => ({ results: [], totalPages: 0 })),
          searchSeries(query, page).catch(() => ({ results: [], totalPages: 0 })),
          searchYouTube(query, 10).catch(() => ({ results: [] })),
        ]);

        if (cancelled) return;

        const movieResults = moviesData?.results ?? [];
        const seriesResults = seriesData?.results ?? [];
        const ytResults = (ytData?.results ?? []).map(yt => ({
          id: `yt-${yt.id}`,
          title: yt.title,
          poster: yt.thumbnail,
          type: 'youtube',
          youtubeId: yt.id,
          summary: yt.channel,
          url: yt.url,
          year: 'YouTube',
          rating: 0
        }));

        const combined = [...movieResults, ...seriesResults, ...ytResults];

        const maxTotalPages = Math.max(
          moviesData?.totalPages ?? 0,
          seriesData?.totalPages ?? 0
        );

        setResults(combined);
        setTotalPages(maxTotalPages);
      } catch (err) {
        console.error('Search failed:', err);
        if (!cancelled) {
          setError(err.message || 'Search failed');
          setResults([]);
          setTotalPages(0);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchResults();
    return () => { cancelled = true; };
  }, [query, page]);

  const handlePageChange = (newPage) => {
    setSearchParams({ q: query, page: String(newPage) });
  };

  const handleRetry = () => {
    // Force re-fetch by toggling a param update
    setSearchParams({ q: query, page: String(page) });
  };

  return (
    <div>
      <SearchResults
        results={results}
        query={query}
        isLoading={isLoading}
        onMovieSelect={onMovieSelect}
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {query && !isLoading && (
        <div style={{ padding: '0 clamp(1rem, 4vw, 3rem) 2rem' }}>
          <h3 className="modal__section-title">{t('torrent.searchTitle')}</h3>
          <TorrentLinks query={query} />
        </div>
      )}

      {error && (
        <div className="error-state">
          <div className="error-state__icon">⚠️</div>
          <p className="error-state__message">{t('common.error')}</p>
          <button className="error-state__btn" onClick={handleRetry}>
            {t('common.retry')}
          </button>
        </div>
      )}
    </div>
  );
}
