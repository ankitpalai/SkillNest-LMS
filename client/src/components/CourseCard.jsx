import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToWishlist, removeFromWishlist } from '../features/wishlist/wishlistSlice';

export const CourseCard = ({ course }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { wishlistIds } = useSelector((state) => state.wishlist);
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (!course) return null;

  const {
    _id,
    title,
    subtitle,
    thumbnail,
    instructor,
    category,
    price,
    level,
    rating = 4.8,
    totalReviews = 0,
    enrolledStudents = 0,
  } = course;

  const isWishlisted = wishlistIds.includes(_id);

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (isWishlisted) {
      dispatch(removeFromWishlist(_id));
    } else {
      dispatch(addToWishlist(_id));
    }
  };

  const formattedPrice =
    price === 0 ? (
      <span className="text-emerald-700 font-semibold text-sm bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
        Free
      </span>
    ) : (
      <span className="text-neutral-900 font-bold text-base">
        ${price.toFixed(2)}
      </span>
    );

  const levelColor = {
    beginner: 'bg-blue-50 text-blue-700 border-blue-200',
    intermediate: 'bg-purple-50 text-purple-700 border-purple-200',
    advanced: 'bg-amber-50 text-amber-800 border-amber-200',
  }[level?.toLowerCase()] || 'bg-neutral-50 text-neutral-700 border-neutral-200';

  return (
    <div className="group bg-white border border-neutral-200 rounded-lg overflow-hidden flex flex-col justify-between hover:border-neutral-300 hover:shadow-sm transition-all duration-200 relative">
      <Link to={`/courses/${_id}`} className="block">
        {/* Thumbnail Banner */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-100">
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              e.target.src =
                'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60';
            }}
          />
          {/* Wishlist Button Overlay */}
          <button
            type="button"
            onClick={handleWishlistToggle}
            title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className="absolute top-2.5 left-2.5 z-10 p-1.5 bg-white/90 hover:bg-white text-neutral-600 rounded-full shadow-sm backdrop-blur-sm border border-neutral-200 transition-transform active:scale-90"
          >
            <svg
              className={`w-4 h-4 transition-colors ${
                isWishlisted ? 'text-red-500 fill-red-500' : 'text-neutral-400 hover:text-red-500 fill-none'
              }`}
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Level Badge Overlay */}
          <div className="absolute top-2.5 right-2.5">
            <span
              className={`text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded border capitalize backdrop-blur-sm ${levelColor}`}
            >
              {level}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1">
          {/* Category */}
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="text-xs font-medium text-neutral-500 hover:text-neutral-700 transition-colors">
              {category?.name || 'General'}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm sm:text-base font-semibold text-neutral-900 leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors">
            {title}
          </h3>

          {/* Subtitle snippet */}
          {subtitle && (
            <p className="text-xs text-neutral-500 mt-1 line-clamp-1 leading-relaxed">
              {subtitle}
            </p>
          )}

          {/* Instructor info */}
          <div className="flex items-center space-x-2 mt-3 text-xs text-neutral-600">
            <img
              src={
                instructor?.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
              }
              alt={instructor?.name || 'Instructor'}
              className="w-4 h-4 rounded-full object-cover border border-neutral-200"
            />
            <span className="truncate font-medium">{instructor?.name || 'Instructor'}</span>
          </div>

          {/* Social Proof: Rating & Students */}
          <div className="flex items-center space-x-3 mt-3 pt-3 border-t border-neutral-100 text-xs text-neutral-500">
            {/* Rating Stars */}
            <div className="flex items-center space-x-1">
              <span className="text-amber-500 font-bold">{rating.toFixed(1)}</span>
              <svg className="w-3.5 h-3.5 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {totalReviews > 0 && <span className="text-neutral-400">({totalReviews})</span>}
            </div>

            <span className="text-neutral-300">•</span>

            {/* Students */}
            <div className="flex items-center space-x-1">
              <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>{enrolledStudents.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Card Footer Bar */}
      <div className="px-4 py-3 bg-neutral-50/50 border-t border-neutral-100 flex items-center justify-between">
        <div>{formattedPrice}</div>
        <Link
          to={`/courses/${_id}`}
          className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center space-x-1 group/link"
        >
          <span>View Course</span>
          <span className="group-hover/link:translate-x-0.5 transition-transform">→</span>
        </Link>
      </div>
    </div>
  );
};

export default CourseCard;
