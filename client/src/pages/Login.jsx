import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../features/auth/authSlice';
import api from '../services/api';

export const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [validationError, setValidationError] = useState('');

  // Forgot password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error, isAuthenticated, user } = useSelector((state) => state.auth);

  const from = location.state?.from?.pathname || null;

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'admin') {
        navigate('/dashboard/admin', { replace: true });
      } else if (user.role === 'instructor') {
        navigate('/dashboard/instructor', { replace: true });
      } else {
        navigate('/dashboard/student', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, from]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationError('');
    if (error) dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    const { email, password } = formData;

    if (!email.trim() || !password) {
      setValidationError('Please enter both your email and password.');
      return;
    }

    dispatch(
      loginUser({
        email: email.trim().toLowerCase(),
        password,
      })
    );
  };

  const displayError = validationError || error;

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="bg-white border border-neutral-200 rounded-lg p-6 sm:p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-600 text-white mb-2 font-bold text-sm shadow-sm">
            SN
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Sign In to SkillNest</h1>
          <p className="text-xs text-primary-600 font-semibold tracking-wider uppercase mt-1">
            Learn. Build. Grow.
          </p>
        </div>

        {displayError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex items-start space-x-2">
            <svg
              className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{displayError}</span>
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5"
              htmlFor="email"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md bg-white text-neutral-900 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label
                className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider"
                htmlFor="password"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotModalOpen(true);
                  setForgotMsg('');
                  setForgotError('');
                }}
                className="text-xs text-primary-600 hover:text-primary-700 hover:underline font-medium"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-3 pr-10 py-2 text-sm border border-neutral-300 rounded-md bg-white text-neutral-900 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2.5 px-4 text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm flex items-center justify-center space-x-2 ${
              isLoading ? 'opacity-75 cursor-wait' : ''
            }`}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-neutral-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 font-medium hover:underline">
            Register as a Student
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
              <h3 className="text-base font-bold text-neutral-900">Reset Password</h3>
              <button
                onClick={() => setForgotModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-500">
              Enter your registered email address and we'll send you a password reset link.
            </p>

            {forgotMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg">
                {forgotMsg}
              </div>
            )}

            {forgotError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {forgotError}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!forgotEmail.trim()) return;
                setForgotLoading(true);
                setForgotMsg('');
                setForgotError('');
                try {
                  const res = await api.post('/auth/forgot-password', { email: forgotEmail.trim() });
                  setForgotMsg(res.data?.message || 'Password reset link sent to your email!');
                } catch (err) {
                  setForgotError(err.response?.data?.message || 'Failed to send reset link.');
                } finally {
                  setForgotLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
