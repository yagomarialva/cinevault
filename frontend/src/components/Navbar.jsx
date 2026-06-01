import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/LanguageContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate();
  const { t, language, setLanguage } = useTranslation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchKeyDown = (e) => {
    if (e.key !== 'Enter') return;

    const query = searchValue.trim();
    if (!query) return;

    navigate(`/search?q=${encodeURIComponent(query)}`);
    setSearchValue('');
  };

  return (
    <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      <span
        className="navbar__logo"
        role="button"
        tabIndex={0}
        onClick={() => navigate('/')}
        onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
      >
        CineVault
      </span>

      <div className="navbar__search">
        <span className="navbar__search-icon" aria-hidden="true">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          className="navbar__search-input"
          type="text"
          placeholder={t('nav.search.placeholder')}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
      </div>

      <div className="navbar__actions">
        <div className="lang-switcher">
          <button
            className={`lang-switcher__btn${language === 'pt-BR' ? ' lang-switcher__btn--active' : ''}`}
            onClick={() => setLanguage('pt-BR')}
            aria-label="Português"
          >
            PT
          </button>
          <button
            className={`lang-switcher__btn${language === 'en' ? ' lang-switcher__btn--active' : ''}`}
            onClick={() => setLanguage('en')}
            aria-label="English"
          >
            EN
          </button>
        </div>
      </div>
    </nav>
  );
}
