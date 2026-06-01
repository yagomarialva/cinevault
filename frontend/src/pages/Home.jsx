import { useState, useCallback } from 'react';
import HeroBanner from '../components/HeroBanner';
import Carousel from '../components/Carousel';
import MovieModal from '../components/MovieModal';
import { fetchPopular, fetchTopRated, fetchLatest, fetchPopularSeries } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';

export default function Home({ onMovieSelect }) {
  const { t } = useTranslation();

  return (
    <main>
      <HeroBanner onMovieSelect={onMovieSelect} />

      <Carousel
        title={t('carousel.popular')}
        fetchFunction={fetchPopular}
        onMovieSelect={onMovieSelect}
      />

      <Carousel
        title={t('carousel.topRated')}
        fetchFunction={fetchTopRated}
        onMovieSelect={onMovieSelect}
      />

      <Carousel
        title={t('carousel.latest')}
        fetchFunction={fetchLatest}
        onMovieSelect={onMovieSelect}
      />

      <Carousel
        title={t('carousel.popularSeries')}
        fetchFunction={fetchPopularSeries}
        onMovieSelect={onMovieSelect}
      />

      <footer>
        <p
          className="footer__disclaimer"
          style={{
            textAlign: 'center',
            padding: '2rem',
            fontSize: '12px',
            color: 'var(--text-muted)',
          }}
        >
          {t('footer.disclaimer')}
        </p>
      </footer>
    </main>
  );
}
