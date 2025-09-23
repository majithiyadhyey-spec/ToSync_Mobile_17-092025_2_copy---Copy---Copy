import React, { useMemo } from 'react';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import SearchIcon from './icons/SearchIcon';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (size: number) => void;
  totalItems: number;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
}

const pageOptions = [5, 10, 15, 20, 50];

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange, totalItems, t, searchQuery, onSearchChange, searchPlaceholder, showSearch = true }) => {
  const id = useMemo(() => `pagination-${Math.random().toString(36).substr(2, 9)}`, []);

  if (totalItems === 0 && !searchQuery) {
    return null;
  }

  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxPagesToShow = 5;
    const half = Math.floor(maxPagesToShow / 2);

    if (totalPages <= maxPagesToShow + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      if (currentPage > half + 2) {
        pageNumbers.push('...');
      }

      let start = Math.max(2, currentPage - half);
      let end = Math.min(totalPages - 1, currentPage + half);
      
      if(currentPage <= half + 1) {
        end = maxPagesToShow - 1;
      }
      
      if(currentPage > totalPages - (half + 1)) {
        start = totalPages - (maxPagesToShow - 2);
      }

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      if (currentPage < totalPages - half - 1) {
        pageNumbers.push('...');
      }
      pageNumbers.push(totalPages);
    }
    return pageNumbers;
  };

  const pages = getPageNumbers();
  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col md:flex-row items-center justify-between mt-6 py-4 border-t border-gray-200 dark:border-gray-700 gap-4">
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <label htmlFor={`${id}-items-per-page`} className="whitespace-nowrap">{t('pagination_items_per_page')}:</label>
          <select
            id={`${id}-items-per-page`}
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-1.5 focus:ring-2 focus:ring-blue-500"
          >
            {pageOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        {showSearch && (
            <div className="relative w-full sm:max-w-xs">
                <label htmlFor={`${id}-search`} className="sr-only">{searchPlaceholder}</label>
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    id={`${id}-search`}
                    type="search"
                    className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={searchPlaceholder || ''}
                    value={searchQuery || ''}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                />
            </div>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {t('pagination_showing_of', { start: startItem, end: endItem, total: totalItems })}
        </span>
        {totalPages > 1 && (
          <nav className="flex items-center justify-center space-x-1 sm:space-x-2" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={t('pagination_previous')}
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>

            {pages.map((page, index) =>
              typeof page === 'number' ? (
                <button
                  key={`${page}-${index}`}
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium rounded-md transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {page}
                </button>
              ) : (
                <span key={`ellipsis-${index}`} className="px-2 sm:px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {page}
                </span>
              )
            )}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={t('pagination_next')}
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
};

export default Pagination;