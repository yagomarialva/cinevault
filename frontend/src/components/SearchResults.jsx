import MovieCard from './MovieCard';
import { useTranslation } from '../i18n/LanguageContext';

export default function SearchResults({ results, query, isLoading, onMovieSelect }) {
  const { t } = useTranslation();

  return (
    <div className="search-results">
      <div className="search-results__header">
        {isLoading ? (
          <h2 className="search-results__title">{t('search.loading')}</h2>
        ) : results?.length ? (
          <h2 className="search-results__title">
            {t('search.results', { count: results.length })} &ldquo;{query}&rdquo;
          </h2>
        ) : (
          <h2 className="search-results__title">
            {t('search.noResults')} &ldquo;{query}&rdquo;
          </h2>
        )}
      </div>

      <div className="search-grid">
        {isLoading
          ? Array.from({ length: 12 }, (_, i) => (
              <div
                className="skeleton skeleton--card"
                key={`skeleton-${i}`}
                style={{ width: '100%', aspectRatio: '2 / 3' }}
              />
            ))
          : results?.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onClick={() => onMovieSelect(movie)}
              />
            ))}
      </div>

      {!isLoading && !results?.length && query && (
        <div className="empty-state">
          <div className="empty-state__icon">🔍</div>
          <p className="empty-state__message">
            {t('search.noResults')} &ldquo;{query}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
