import { useState, useEffect } from 'react';
import { searchTorrents } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';

export default function TorrentLinks({ query, torrents: externalTorrents, isLoading: externalLoading }) {
  const { t } = useTranslation();
  const [internalTorrents, setInternalTorrents] = useState([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState(null);

  const isControlled = externalTorrents !== undefined;
  const activeTorrents = isControlled ? externalTorrents : internalTorrents;
  const loading = isControlled ? (externalLoading ?? false) : internalLoading;

  // Self-fetch when not controlled by parent
  useEffect(() => {
    if (isControlled || !query) return;

    let cancelled = false;
    const fetchData = async () => {
      setInternalLoading(true);
      setError(null);
      try {
        const data = await searchTorrents(query);
        if (!cancelled) {
          const results = Array.isArray(data) ? data : data?.results ?? [];
          setInternalTorrents(results);
        }
      } catch (err) {
        console.error('Failed to fetch torrents:', err);
        if (!cancelled) {
          setError(err.message || 'Failed to fetch torrents');
          setInternalTorrents([]);
        }
      } finally {
        if (!cancelled) {
          setInternalLoading(false);
        }
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [query, isControlled]);

  return (
    <div className="torrent-list">
      {loading ? (
        Array.from({ length: 3 }, (_, i) => (
          <div
            className="skeleton"
            key={`torrent-skeleton-${i}`}
            style={{ height: '60px', width: '100%' }}
          />
        ))
      ) : error ? (
        <p className="torrent-list__error">{error}</p>
      ) : !activeTorrents?.length ? (
        <p>{t('modal.noTorrents')}</p>
      ) : (
        <>
          {activeTorrents.map((torrent, idx) => (
            <div className="torrent-item" key={idx}>
              <span className="torrent-item__name">{torrent.name}</span>
              <span className="torrent-item__seeds">🌱 {torrent.seeds}</span>
              <span className="torrent-item__peers">👥 {torrent.peers}</span>
              <span className="torrent-item__size">{torrent.size}</span>
              <span className="torrent-item__source">{torrent.source}</span>
              <a
                className="torrent-item__magnet"
                href={torrent.magnet}
                title={torrent.name}
              >
                🧲 {t('torrent.magnet')}
              </a>
            </div>
          ))}
        </>
      )}

      <p className="torrent-disclaimer">{t('torrent.disclaimer')}</p>
    </div>
  );
}
