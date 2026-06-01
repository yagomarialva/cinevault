import { useTranslation } from '../i18n/LanguageContext';

function getPageNumbers(currentPage, totalPages) {
  const pages = [];
  const delta = 2;

  const rangeStart = Math.max(2, currentPage - delta);
  const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

  pages.push(1);

  if (rangeStart > 2) {
    pages.push('...');
  }

  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i);
  }

  if (rangeEnd < totalPages - 1) {
    pages.push('...');
  }

  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const { t } = useTranslation();

  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const handlePageChange = (page) => {
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pagination">
      <button
        className="pagination__btn"
        disabled={currentPage === 1}
        onClick={() => handlePageChange(currentPage - 1)}
      >
        {t('pagination.prev')}
      </button>

      {pageNumbers.map((page, idx) =>
        page === '...' ? (
          <span className="pagination__ellipsis" key={`ellipsis-${idx}`}>
            ...
          </span>
        ) : (
          <button
            className={`pagination__btn${page === currentPage ? ' pagination__btn--active' : ''}`}
            key={page}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </button>
        )
      )}

      <button
        className="pagination__btn"
        disabled={currentPage === totalPages}
        onClick={() => handlePageChange(currentPage + 1)}
      >
        {t('pagination.next')}
      </button>

      <span className="pagination__info">
        {t('pagination.page', { current: currentPage, total: totalPages })}
      </span>
    </div>
  );
}
