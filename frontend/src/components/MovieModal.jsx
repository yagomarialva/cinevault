import { useState, useEffect, useCallback } from 'react';
import { searchTorrents, fetchYouTubeDetails, fetchYouTubePlaylist, downloadYouTubeZip } from '../services/api';
import TorrentLinks from './TorrentLinks';
import { useTranslation } from '../i18n/LanguageContext';

export default function MovieModal({ movie, onClose, isOpen }) {
  const { t } = useTranslation();
  const [torrents, setTorrents] = useState([]);
  const [isLoadingTorrents, setIsLoadingTorrents] = useState(false);
  const [ytPlaylist, setYtPlaylist] = useState(null);
  const [ytEpisodeDetails, setYtEpisodeDetails] = useState({});
  const [loadingEpisodes, setLoadingEpisodes] = useState({});
  
  const [selectedEpisodes, setSelectedEpisodes] = useState(new Set());
  const [isZipping, setIsZipping] = useState(false);

  // Fetch torrents or youtube details when modal opens with a movie
  useEffect(() => {
    if (!isOpen || !movie?.title) {
      setTorrents([]);
      setYtPlaylist(null);
      setYtEpisodeDetails({});
      setSelectedEpisodes(new Set());
      setIsZipping(false);
      return;
    }

    let cancelled = false;
    const fetchData = async () => {
      setIsLoadingTorrents(true);
      try {
        if (movie.type === 'youtube' && movie.url) {
          const playlistData = await fetchYouTubePlaylist(movie.url);
          if (!cancelled) setYtPlaylist(playlistData?.results || []);
        } else {
          const data = await searchTorrents(movie.title);
          if (!cancelled) {
            const results = Array.isArray(data) ? data : data?.results ?? [];
            setTorrents(results);
          }
        }
      } catch (err) {
        console.error('Failed to fetch modal data:', err);
        if (!cancelled) {
          setTorrents([]);
          setYtPlaylist(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTorrents(false);
        }
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [movie, isOpen]);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleLoadEpisode = async (ep) => {
    if (ytEpisodeDetails[ep.id] || loadingEpisodes[ep.id]) return;
    
    setLoadingEpisodes(prev => ({ ...prev, [ep.id]: true }));
    try {
      const details = await fetchYouTubeDetails(ep.url);
      setYtEpisodeDetails(prev => ({ ...prev, [ep.id]: details }));
    } catch (err) {
      console.error('Failed to load episode details', err);
    } finally {
      setLoadingEpisodes(prev => ({ ...prev, [ep.id]: false }));
    }
  };

  const toggleEpisodeSelection = (url) => {
    setSelectedEpisodes(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedEpisodes.size === ytPlaylist.length) {
      setSelectedEpisodes(new Set());
    } else {
      setSelectedEpisodes(new Set(ytPlaylist.map(ep => ep.url)));
    }
  };

  const handleDownloadZip = async () => {
    if (selectedEpisodes.size === 0) return;
    setIsZipping(true);
    try {
      const urlsArray = Array.from(selectedEpisodes);
      const blob = await downloadYouTubeZip(urlsArray);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${movie.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_episodes.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Failed to download ZIP:', err);
      alert('Failed to download ZIP: ' + err.message);
    } finally {
      setIsZipping(false);
    }
  };

  if (!isOpen || !movie) return null;

  return (
    <div className="modal__overlay" onClick={handleOverlayClick}>
      <div className="modal__content">
        <button className="modal__close" onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        <div style={{ position: 'relative' }}>
          <img
            className="modal__backdrop"
            src={movie.backdrop || movie.poster}
            alt=""
          />
          <div className="modal__backdrop-gradient" />
        </div>

        <div className="modal__body">
          <div className="modal__header">
            {movie.poster && (
              <img
                className="modal__poster"
                src={movie.poster}
                alt={movie.title}
              />
            )}
            <div>
              <h2 className="modal__title">{movie.title}</h2>
              <div className="modal__info-row">
                {movie.rating != null && (
                  <span style={{ color: 'gold' }}>★ {movie.rating.toFixed(1)}</span>
                )}
                {movie.year && <span>{movie.year}</span>}
                {movie.runtime ? (
                  <span>{movie.runtime} {t('common.minutes')}</span>
                ) : null}
                {movie.type && (
                  <span>{movie.type.charAt(0).toUpperCase() + movie.type.slice(1)}</span>
                )}
              </div>
            </div>
          </div>

          {movie.genres?.length > 0 && (
            <div className="modal__genres">
              {movie.genres.map((genre, idx) => (
                <span className="modal__genre-tag" key={idx}>
                  {genre}
                </span>
              ))}
            </div>
          )}

          {movie.summary && (
            <p className="modal__summary">{movie.summary}</p>
          )}

          {movie.type === 'youtube' ? (
            <>
              <h3 className="modal__section-title">Playlist Episodes</h3>
              {isLoadingTorrents ? (
                <div className="torrent-list"><p>{t('common.loading')}</p></div>
              ) : ytPlaylist && ytPlaylist.length > 0 ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedEpisodes.size === ytPlaylist.length}
                        onChange={handleSelectAll}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                      />
                      <span>Select All ({selectedEpisodes.size}/{ytPlaylist.length})</span>
                    </label>
                    <button 
                      className="torrent-btn" 
                      onClick={handleDownloadZip}
                      disabled={isZipping || selectedEpisodes.size === 0}
                      style={{ background: 'var(--accent-primary)', opacity: (isZipping || selectedEpisodes.size === 0) ? 0.5 : 1 }}
                    >
                      {isZipping ? 'Downloading ZIP...' : `Download ${selectedEpisodes.size} via ZIP`}
                    </button>
                  </div>
                  
                  <div className="torrent-list">
                    {ytPlaylist.map(ep => {
                      const details = ytEpisodeDetails[ep.id];
                      const isLoading = loadingEpisodes[ep.id];
                      const isSelected = selectedEpisodes.has(ep.url);

                      return (
                        <div key={ep.id} style={{ marginBottom: '1rem', borderBottom: '1px solid var(--surface-glass)', paddingBottom: '1rem' }}>
                          <div className="torrent-item" style={{ gridTemplateColumns: '1fr auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <input 
                                type="checkbox" 
                                checked={isSelected} 
                                onChange={() => toggleEpisodeSelection(ep.url)}
                                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                              />
                              <img src={ep.thumbnail} alt="" style={{ width: '80px', borderRadius: '4px' }} />
                              <div>
                                <strong>{ep.title}</strong>
                                <div className="torrent-meta">{ep.channel}</div>
                              </div>
                            </div>
                            {!details && (
                              <button 
                                className="torrent-btn" 
                                onClick={() => handleLoadEpisode(ep)}
                                disabled={isLoading}
                              >
                                {isLoading ? t('common.loading') : 'Load Downloads'}
                              </button>
                            )}
                          </div>
                          
                          {details && (
                            <div style={{ marginTop: '0.5rem', paddingLeft: '1rem', borderLeft: '2px solid var(--accent-primary)', marginLeft: '34px' }}>
                              <div className="torrent-item" style={{ gridTemplateColumns: '1fr auto', display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                                <div>
                                  <strong>Video MP4</strong>
                                  <div className="torrent-meta">Direct Download Link</div>
                                </div>
                                <a href={details.directUrl} target="_blank" rel="noreferrer" className="torrent-btn">
                                  Download / Play
                                </a>
                              </div>
                              {details.formats?.map((fmt, i) => (
                                <div key={i} className="torrent-item" style={{ gridTemplateColumns: '1fr auto', display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                                  <div>
                                    <strong>{fmt.format_note || fmt.resolution} - {fmt.ext}</strong>
                                    <div className="torrent-meta">{fmt.vcodec} / {fmt.acodec}</div>
                                  </div>
                                  <a href={fmt.url} target="_blank" rel="noreferrer" className="torrent-btn">
                                    Download
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="torrent-list"><p>No episodes available in this playlist.</p></div>
              )}
            </>
          ) : (
            <>
              <h3 className="modal__section-title">{t('modal.torrents')}</h3>
              <TorrentLinks
                query={movie.title}
                torrents={torrents}
                isLoading={isLoadingTorrents}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
