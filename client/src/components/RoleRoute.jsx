import React from 'react';
import { useSelector } from 'react-redux';
import { Link, Outlet } from 'react-router-dom';

/**
 * RoleRoute
 * Restricts access to users possessing specified roles
 * @param {string[]} allowedRoles - Array of allowed roles (e.g. ['admin'], ['instructor'])
 */
export const RoleRoute = ({ allowedRoles = [], children }) => {
  const { user } = useSelector((state) => state.auth);

  const userRole = user?.role;
  const isAuthorized = allowedRoles.includes(userRole);

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="bg-white border border-neutral-200 rounded-lg p-8 shadow-sm">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-xl">
            !
          </div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Access Restricted</h1>
          <p className="text-sm text-neutral-500 mt-2">
            You do not have permission to view this section. This page requires{' '}
            <span className="font-semibold text-neutral-800 uppercase">
              {allowedRoles.join(' or ')}
            </span>{' '}
            privileges.
          </p>
          <div className="mt-2 text-xs text-neutral-400">
            Current role: <span className="font-semibold text-neutral-600 uppercase">{userRole || 'None'}</span>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            {userRole === 'student' && (
              <Link
                to="/dashboard/student"
                className="px-4 py-2 text-xs font-semibold rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                Go to Student Dashboard
              </Link>
            )}
            {userRole === 'instructor' && (
              <Link
                to="/dashboard/instructor"
                className="px-4 py-2 text-xs font-semibold rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                Go to Instructor Dashboard
              </Link>
            )}
            {userRole === 'admin' && (
              <Link
                to="/dashboard/admin"
                className="px-4 py-2 text-xs font-semibold rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                Go to Admin Dashboard
              </Link>
            )}
            <Link
              to="/"
              className="px-4 py-2 text-xs font-semibold rounded-md text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children ? children : <Outlet />;
};

export default RoleRoute;
