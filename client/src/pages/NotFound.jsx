import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound = () => {
  return (
    <div className="max-w-lg mx-auto py-16 text-center">
      <div className="bg-white border border-neutral-200 rounded-lg p-8 shadow-sm">
        <span className="text-4xl font-bold text-neutral-300">404</span>
        <h1 className="text-xl font-bold text-neutral-900 mt-2">Page Not Found</h1>
        <p className="text-sm text-neutral-500 mt-2">
          The requested page could not be located. It may have been moved or does not exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
