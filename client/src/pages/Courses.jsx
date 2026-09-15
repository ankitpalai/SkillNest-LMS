import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourses, fetchCategories } from '../features/courses/courseSlice';
import CourseCard from '../components/CourseCard';

export const Courses = () => {
  const dispatch = useDispatch();
  const {
    courses,
    totalCourses,
    totalPages,
    currentPage,
    categories,
    isLoading,
    error,
  } = useSelector((state) => state.courses);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [selectedSort, setSelectedSort] = useState('popular');
  const [page, setPage] = useState(1);

  // Mobile filter drawer toggle
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // reset to page 1 on new search
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch categories on mount
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Fetch courses on query change
  useEffect(() => {
    dispatch(
      fetchCourses({
        search: debouncedSearch,
        category: selectedCategory,
        level: selectedLevel,
        price: selectedPrice,
        sort: selectedSort,
        page,
        limit: 6,
      })
    );
  }, [dispatch, debouncedSearch, selectedCategory, selectedLevel, selectedPrice, selectedSort, page]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedCategory('all');
    setSelectedLevel('all');
    setSelectedPrice('all');
    setSelectedSort('popular');
    setPage(1);
  };

  const isFiltered =
    searchTerm !== '' ||
    selectedCategory !== 'all' ||
    selectedLevel !== 'all' ||
    selectedPrice !== 'all' ||
    selectedSort !== 'popular';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-neutral-200 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Course Catalog</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Explore industry-leading engineering, cloud, and design courses taught by practitioners
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title or topic..."
            className="w-full pl-9 pr-9 py-2 text-sm border border-neutral-300 rounded-md bg-white text-neutral-900 placeholder-neutral-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
          />
          <svg
            className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Layout: Filters Sidebar + Course Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Mobile Filter Toggle Button */}
        <div className="lg:hidden flex items-center justify-between bg-white p-3 border border-neutral-200 rounded-md">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center space-x-2 text-xs font-semibold text-neutral-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Filters {isFiltered && '• Active'}</span>
          </button>
          {isFiltered && (
            <button onClick={handleResetFilters} className="text-xs text-primary-600 hover:underline">
              Reset
            </button>
          )}
        </div>

        {/* Filter Sidebar */}
        <aside
          className={`${
            showMobileFilters ? 'block' : 'hidden'
          } lg:block space-y-6 bg-white border border-neutral-200 rounded-lg p-5`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Filter By
            </h2>
            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Reset all
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-2.5">
              Category
            </label>
            <div className="space-y-1.5 text-xs text-neutral-600">
              <label className="flex items-center space-x-2 cursor-pointer py-1 px-1.5 rounded hover:bg-neutral-50 transition-colors">
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === 'all'}
                  onChange={() => {
                    setSelectedCategory('all');
                    setPage(1);
                  }}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className={selectedCategory === 'all' ? 'font-semibold text-neutral-900' : ''}>
                  All Categories
                </span>
              </label>
              {categories.map((cat) => (
                <label
                  key={cat._id}
                  className="flex items-center justify-between space-x-2 cursor-pointer py-1 px-1.5 rounded hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === cat._id}
                      onChange={() => {
                        setSelectedCategory(cat._id);
                        setPage(1);
                      }}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className={`truncate ${selectedCategory === cat._id ? 'font-semibold text-neutral-900' : ''}`}>
                      {cat.name}
                    </span>
                  </div>
                  {cat.courseCount !== undefined && (
                    <span className="text-[11px] text-neutral-400">({cat.courseCount})</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Difficulty Level Filter */}
          <div className="pt-4 border-t border-neutral-100">
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-2.5">
              Difficulty Level
            </label>
            <div className="space-y-1.5 text-xs text-neutral-600">
              {[
                { id: 'all', label: 'All Levels' },
                { id: 'beginner', label: 'Beginner' },
                { id: 'intermediate', label: 'Intermediate' },
                { id: 'advanced', label: 'Advanced' },
              ].map((lvl) => (
                <label
                  key={lvl.id}
                  className="flex items-center space-x-2 cursor-pointer py-1 px-1.5 rounded hover:bg-neutral-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="level"
                    checked={selectedLevel === lvl.id}
                    onChange={() => {
                      setSelectedLevel(lvl.id);
                      setPage(1);
                    }}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className={selectedLevel === lvl.id ? 'font-semibold text-neutral-900' : ''}>
                    {lvl.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Pricing Filter */}
          <div className="pt-4 border-t border-neutral-100">
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-2.5">
              Pricing
            </label>
            <div className="space-y-1.5 text-xs text-neutral-600">
              {[
                { id: 'all', label: 'All Courses' },
                { id: 'free', label: 'Free Only' },
                { id: 'paid', label: 'Paid Courses' },
              ].map((p) => (
                <label
                  key={p.id}
                  className="flex items-center space-x-2 cursor-pointer py-1 px-1.5 rounded hover:bg-neutral-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="price"
                    checked={selectedPrice === p.id}
                    onChange={() => {
                      setSelectedPrice(p.id);
                      setPage(1);
                    }}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className={selectedPrice === p.id ? 'font-semibold text-neutral-900' : ''}>
                    {p.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Course Grid & Content */}
        <section className="lg:col-span-3 space-y-5">
          {/* Controls Bar: Total Count & Sorting */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-500 pb-2">
            <div>
              <span className="font-semibold text-neutral-900">{totalCourses}</span> course
              {totalCourses === 1 ? '' : 's'} available
              {debouncedSearch && <span> matching "{debouncedSearch}"</span>}
            </div>

            <div className="flex items-center space-x-2">
              <label htmlFor="sort-select" className="text-neutral-600 font-medium">
                Sort by:
              </label>
              <select
                id="sort-select"
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-medium border border-neutral-300 rounded bg-white text-neutral-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest Releases</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white border border-neutral-200 rounded-lg p-4 animate-pulse space-y-3">
                  <div className="aspect-[16/9] bg-neutral-200 rounded" />
                  <div className="h-4 bg-neutral-200 rounded w-3/4" />
                  <div className="h-3 bg-neutral-200 rounded w-1/2" />
                  <div className="h-4 bg-neutral-200 rounded w-1/4 mt-4" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && courses.length === 0 && (
            <div className="bg-white border border-neutral-200 rounded-lg p-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-neutral-900">No courses match your criteria</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Try searching for different keywords, adjusting difficulty levels, or resetting your active filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Active Course Cards Grid */}
          {!isLoading && courses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {!isLoading && totalPages > 1 && (
            <div className="pt-6 border-t border-neutral-200 flex items-center justify-between text-xs">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 border border-neutral-300 rounded font-medium ${
                  currentPage === 1
                    ? 'text-neutral-300 cursor-not-allowed bg-neutral-50'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                ← Previous
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => setPage(num)}
                    className={`w-7 h-7 rounded font-medium ${
                      currentPage === num
                        ? 'bg-primary-600 text-white'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 border border-neutral-300 rounded font-medium ${
                  currentPage === totalPages
                    ? 'text-neutral-300 cursor-not-allowed bg-neutral-50'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                Next →
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Courses;
