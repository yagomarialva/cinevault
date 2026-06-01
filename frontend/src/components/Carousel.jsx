import { useState, useEffect, useRef } from 'react';
import MovieCard from './MovieCard';

const SKELETON_COUNT = 6;
const SCROLL_FACTOR = 0.75;

export default function Carousel({ title, fetchFunction, onMovieSelect }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const trackRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const loadItems = async () => {
      try {
        if (typeof fetchFunction !== 'function') return;

        const data = await fetchFunction();
        if (!cancelled && data?.results) {
          setItems(data.results);
        }
      } catch (err) {
        console.error(`Carousel "${title}": failed to fetch items`, err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadItems();
    return () => { cancelled = true; };
  }, [fetchFunction, title]);

  const scroll = (direction) => {
    if (!trackRef.current) return;

    const distance = trackRef.current.offsetWidth * SCROLL_FACTOR;
    trackRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  return (
    <div className="carousel">
      <div className="carousel__header">
        <h2 className="carousel__title">{title}</h2>
      </div>

      <div style={{ position: 'relative' }}>
        <button
          className="carousel__arrow carousel__arrow--left"
          onClick={() => scroll('left')}
          aria-label="Scroll left"
        >
          ‹
        </button>

        <div className="carousel__track" ref={trackRef}>
          {isLoading
            ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
                <div className="skeleton skeleton--card" key={`skel-${i}`} />
              ))
            : items.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onClick={onMovieSelect}
                />
              ))}
        </div>

        <button
          className="carousel__arrow carousel__arrow--right"
          onClick={() => scroll('right')}
          aria-label="Scroll right"
        >
          ›
        </button>
      </div>
    </div>
  );
}
