import { useState, useEffect, useCallback } from 'react';
import { fetchTrending } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';

const ROTATION_INTERVAL = 8000;
const MAX_SLIDES = 6;
const SUMMARY_LIMIT = 150;

export default function HeroBanner({ onMovieSelect }) {
  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;

    const loadTrending = async () => {
      try {
        const data = await fetchTrending();
        if (!cancelled && data?.results?.length) {
          setMovies(data.results.slice(0, MAX_SLIDES));
        }
      } catch (err) {
        console.error('HeroBanner: failed to fetch trending', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadTrending();
    return () => { cancelled = true; };
  }, []);

  // Auto-rotate slides
  useEffect(() => {
    if (movies.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, [movies.length]);

  const handleDotClick = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  if (isLoading) {
    return <div className="skeleton skeleton--hero" aria-label="Loading hero banner" />;
  }

  if (!movies.length) return null;

  const movie = movies[currentIndex];
  if (!movie) return null;

  const truncatedSummary = movie.summary
    ? `${movie.summary.substring(0, SUMMARY_LIMIT)}...`
    : '';

  return (
    <div className="hero">
      <img
        className="hero__backdrop"
        src={movie.backdrop}
        alt={movie.title || ''}
        key={currentIndex}
      />
      <div className="hero__overlay" />

      <div className="hero__content">
        <h1 className="hero__title">{movie.title}</h1>

        <div className="hero__meta">
          <span className="hero__rating">★ {movie.rating?.toFixed(1)}</span>
          <span className="hero__year">{movie.year}</span>
          {movie.runtime ? <span>{movie.runtime} min</span> : null}
        </div>

        {truncatedSummary && (
          <p className="hero__summary">{truncatedSummary}</p>
        )}

        <div className="hero__buttons">
          <button
            className="hero__btn hero__btn--primary"
            onClick={() => onMovieSelect?.(movie)}
          >
            {t('hero.button.details')}
          </button>
          <button
            className="hero__btn hero__btn--secondary"
            onClick={() => onMovieSelect?.(movie)}
          >
            {t('hero.button.torrents')}
          </button>
        </div>
      </div>

      {movies.length > 1 && (
        <div className="hero__dots">
          {movies.map((_, index) => (
            <span
              key={index}
              className={`hero__dot${index === currentIndex ? ' hero__dot--active' : ''}`}
              onClick={() => handleDotClick(index)}
              role="button"
              tabIndex={0}
              aria-label={`Slide ${index + 1}`}
              onKeyDown={(e) => e.key === 'Enter' && handleDotClick(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
