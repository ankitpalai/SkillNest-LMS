import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../features/auth/authSlice';
import { fetchWishlist } from '../features/wishlist/wishlistSlice';

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { wishlist } = useSelector((state) => state.wishlist);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, isAuthenticated]);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  // Base navigation links
  const baseLinks = [
    { name: 'Home', path: '/' },
    { name: 'Courses', path: '/courses' },
  ];

  // Role-appropriate dashboard link
  const getDashboardPath = () => {
    if (!user) return '/dashboard/student';
    if (user.role === 'admin') return '/dashboard/admin';
    if (user.role === 'instructor') return '/dashboard/instructor';
    return '/dashboard/student';
  };

  const getDashboardLabel = () => {
    if (!user) return 'Dashboard';
    if (user.role === 'admin') return 'Admin Console';
    if (user.role === 'instructor') return 'Instructor Portal';
    return 'My Dashboard';
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <span className="w-8 h-8 rounded bg-primary-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm group-hover:bg-primary-700 transition-colors">
                SN
              </span>
              <div className="flex flex-col">
                <span className="font-semibold text-neutral-900 tracking-tight text-base leading-none">
                  SkillNest
                </span>
                <span className="text-[10px] text-neutral-400 font-medium tracking-wide leading-tight mt-0.5">
                  Learn. Build. Grow.
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {baseLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(link.path)
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {/* Student-specific My Courses link */}
            {isAuthenticated && user?.role === 'student' && (
              <Link
                to="/my-courses"
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive('/my-courses')
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                My Courses
              </Link>
            )}

            {/* Role-specific dashboard link if authenticated */}
            {isAuthenticated && (
              <Link
                to={getDashboardPath()}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive('/dashboard')
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                {getDashboardLabel()}
              </Link>
            )}
          </nav>

          {/* Action / Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2.5">
                {/* Wishlist Link with Badge */}
                <Link
                  to="/wishlist"
                  title="My Saved Wishlist"
                  className={`p-2 rounded-lg relative text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors ${
                    isActive('/wishlist') ? 'text-primary-600 bg-primary-50' : ''
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlist.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {wishlist.length}
                    </span>
                  )}
                </Link>

                {/* Profile Pill Link */}
                <Link
                  to="/profile"
                  title="Account Profile & Settings"
                  className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors ${
                    isActive('/profile') ? 'bg-primary-50/70 border-primary-300' : 'bg-white'
                  }`}
                >
                  <img
                    src={
                      user?.avatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                    }
                    alt={user?.name}
                    className="w-6 h-6 rounded-full object-cover border border-neutral-300"
                  />
                  <div className="flex flex-col text-left pr-1">
                    <span className="text-xs font-semibold text-neutral-900 leading-tight max-w-[100px] truncate">
                      {user?.name}
                    </span>
                    <span className="text-[9px] font-medium text-primary-600 uppercase tracking-wider">
                      {user?.role}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="text-xs font-medium text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-md border border-neutral-300 hover:bg-neutral-100 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-neutral-700 hover:text-neutral-900 px-3 py-1.5 rounded-md hover:bg-neutral-100 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 px-3.5 py-1.5 rounded-md transition-colors shadow-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {baseLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive(link.path)
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {link.name}
            </Link>
          ))}

          {isAuthenticated && (
            <>
              {user?.role === 'student' && (
                <Link
                  to="/my-courses"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/my-courses')
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  My Courses
                </Link>
              )}

              <Link
                to="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/wishlist')
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                Wishlist {wishlist.length > 0 && `(${wishlist.length})`}
              </Link>

              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/profile')
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                Profile & Settings
              </Link>

              <Link
                to={getDashboardPath()}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:bg-neutral-100"
              >
                {getDashboardLabel()}
              </Link>
            </>
          )}

          <div className="pt-3 border-t border-neutral-200 flex flex-col space-y-2">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="px-3 py-1 flex items-center justify-between">
                  <span className="text-sm font-semibold text-neutral-900">{user?.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-primary-50 text-primary-700 font-semibold uppercase">
                    {user?.role}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-center py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-md"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-medium text-white bg-primary-600 rounded-md"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
