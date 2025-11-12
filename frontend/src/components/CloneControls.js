import React from 'react';

const CloneControls = ({
  total,
  sortValue,
  onSortChange,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  view,
  onViewChange,
}) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white border border-green-100 rounded-2xl p-4 md:p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-gray-700 font-medium">{total} results</div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <select
              value={sortValue}
              onChange={(e) => onSortChange(e.target.value)}
              className="border border-green-200 rounded-xl px-4 py-2 text-sm bg-white"
            >
              <option value="created_at-desc">Default sorting</option>
              <option value="created_at-asc">Sort by oldest</option>
              <option value="name-asc">Name: A → Z</option>
              <option value="name-desc">Name: Z → A</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
            <div className="inline-flex border border-green-200 rounded-xl overflow-hidden">
              <button
                onClick={() => onViewChange('grid')}
                className={`px-3 py-2 text-sm ${view === 'grid' ? 'bg-green-600 text-white' : 'bg-white text-gray-700'}`}
              >
                Grid
              </button>
              <button
                onClick={() => onViewChange('list')}
                className={`px-3 py-2 text-sm border-l border-green-200 ${view === 'list' ? 'bg-green-600 text-white' : 'bg-white text-gray-700'}`}
              >
                List
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearchSubmit();
              }}
              className="flex-1 sm:flex-initial"
            >
              <div className="relative">
                <input
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search products…"
                  className="w-full sm:w-64 border border-green-200 rounded-xl pl-4 pr-10 py-2 text-sm"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-green-700">
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloneControls;


