import React from 'react';

const SUMMARY_LIMIT = 100;

function getRatingClass(rating) {
  if (rating > 7) return 'card__rating--high';
  if (rating > 5) return 'card__rating--medium';
  return 'card__rating--low';
}

function MovieCard({ movie, onClick }) {
  if (!movie) return null;

  const ratingClass = getRatingClass(movie.rating);
  const truncatedSummary = movie.summary
    ? `${movie.summary.substring(0, SUMMARY_LIMIT)}...`
    : '';

  return (
    <div
      className="card"
      onClick={() => onClick?.(movie)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(movie)}
    >
      <div className="card__poster-wrap">
        {movie.poster ? (
          <img
            className="card__poster"
            src={movie.poster}
            alt={movie.title || 'Movie poster'}
            loading="lazy"
          />
        ) : (
          <div className="card__fallback" aria-label="No poster available">
            🎬
          </div>
        )}

        <div className="card__overlay">
          {truncatedSummary && (
            <p className="card__overlay-text">{truncatedSummary}</p>
          )}
        </div>
      </div>

      <div className="card__info">
        <h3 className="card__title">{movie.title}</h3>
        <div className="card__meta">
          <span className={`card__rating ${ratingClass}`}>
            ★ {movie.rating?.toFixed(1)}
          </span>
          <span className="card__year">{movie.year}</span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(MovieCard);
