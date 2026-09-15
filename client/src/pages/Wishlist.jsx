import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWishlist, removeFromWishlist } from '../features/wishlist/wishlistSlice';
import CourseCard from '../components/CourseCard';

export const Wishlist = () => {
  const dispatch = useDispatch();
  const { wishlist, isLoading } = useSelector((state) => state.wishlist);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, isAuthenticated]);

  const handleRemove = (e, courseId) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(removeFromWishlist(courseId));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border-b border-neutral-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">My Saved Wishlist</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200 rounded-full">
              {wishlist.length} {wishlist.length === 1 ? 'Course' : 'Courses'}
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Keep track of courses you're interested in taking next.
          </p>
        </div>
        <Link
          to="/courses"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors shrink-0"
        >
          <span>Explore Catalog</span>
          <span>→</span>
        </Link>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3 animate-pulse">
              <div className="w-full h-40 bg-neutral-200 rounded-lg"></div>
              <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
              <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
              <div className="h-8 bg-neutral-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : wishlist.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900">Your wishlist is empty</h2>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Explore our curated library of engineering, cloud, and data science courses and bookmark what you want to learn.
            </p>
          </div>
          <Link
            to="/courses"
            className="inline-block px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            Browse All Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((course) => (
            <div key={course._id} className="relative group">
              <CourseCard course={course} />
              <button
                onClick={(e) => handleRemove(e, course._id)}
                title="Remove from wishlist"
                className="absolute top-2.5 right-2.5 z-10 p-2 bg-white/95 hover:bg-red-50 text-neutral-500 hover:text-red-600 rounded-full shadow-md border border-neutral-200 transition-all opacity-90 group-hover:opacity-100"
              >
                <svg className="w-4 h-4 fill-current text-red-500" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
