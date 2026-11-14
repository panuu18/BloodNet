import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import {
  HeartIcon as HeartSolidIcon,
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/solid';
import { HeartIcon } from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [resetTokenInfo, setResetTokenInfo] = useState(null);

  const { login, loading, error, clearError, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    clearError();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath =
        user.role === 'admin'
          ? '/admin'
          : `/dashboard/${user.role}`;
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const response = await login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      // Role-based redirect determined strictly by the authenticated backend user
      const role = response.user?.role;
      let targetDashboard = '/';
      if (role === 'admin') {
        targetDashboard = '/admin';
      } else if (role === 'hospital' || role === 'donor' || role === 'recipient') {
        targetDashboard = `/dashboard/${role}`;
      }

      navigate(targetDashboard, { replace: true });
    } catch (err) {
      // Error message is caught and managed in AuthContext
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setResetTokenInfo(null);

    if (!forgotEmail.trim()) {
      setForgotError('Please enter your email address');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      setForgotError('Please enter a valid email address');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await authAPI.forgotPassword({ email: forgotEmail.trim().toLowerCase() });
      setForgotSuccess(res.data.message || 'Password reset instructions have been generated.');
      if (res.data.resetToken) {
        setResetTokenInfo(res.data.resetToken);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to process reset request. Please try again later.';
      setForgotError(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-teal-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-10 left-10 w-32 h-32 bg-red-200 rounded-full opacity-20"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 30, 0],
            y: [0, -20, 0]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-48 h-48 bg-teal-200 rounded-full opacity-20"
          animate={{
            scale: [1.3, 1, 1.3],
            x: [0, -30, 0],
            y: [0, 20, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: 'spring' }}
            className="flex justify-center mb-6"
          >
            <div className="relative">
              <HeartSolidIcon className="h-16 w-16 text-red-500" />
              <motion.div
                className="absolute inset-0 bg-red-500 rounded-full opacity-20"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0, 0.3]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity
                }}
              />
            </div>
          </motion.div>

          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your BloodNet+ account
          </p>
        </div>

        <Card className="p-8 shadow-2xl bg-white/95 backdrop-blur-sm border border-gray-100">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
              role="alert"
            >
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={`w-full px-4 py-3 pl-11 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${
                    errors.email ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                  }`}
                />
                <EnvelopeIcon className="h-5 w-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              {errors.email && (
                <p id="email-error" className="mt-1 text-xs text-red-600 font-medium">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotEmail(formData.email || '');
                    setForgotSuccess('');
                    setForgotError('');
                  }}
                  className="text-xs font-semibold text-red-500 hover:text-red-700 hover:underline transition-colors focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className={`w-full px-4 py-3 pl-11 pr-11 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${
                    errors.password ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                  }`}
                />
                <LockClosedIcon className="h-5 w-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="mt-1 text-xs text-red-600 font-medium">
                  {errors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              className="w-full py-3.5 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-red-500 hover:text-red-600 transition-colors"
              >
                Create an account
              </Link>
            </p>
          </div>
        </Card>

        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors group"
          >
            <HeartIcon className="h-4 w-4 mr-1 text-gray-400 group-hover:text-red-500 transition-colors" />
            Back to Home
          </Link>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative"
              role="dialog"
              aria-modal="true"
              aria-labelledby="forgot-modal-title"
            >
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                aria-label="Close dialog"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>

              <h3 id="forgot-modal-title" className="text-xl font-bold text-gray-900 mb-2">
                Reset Password
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Enter your registered email address to receive password reset instructions.
              </p>

              {forgotError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {forgotError}
                </div>
              )}

              {forgotSuccess ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm flex items-start space-x-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Request Received</p>
                      <p className="text-xs text-green-700 mt-1">{forgotSuccess}</p>
                    </div>
                  </div>

                  {resetTokenInfo && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-2">
                      <p className="font-medium text-gray-700">Password Reset Token (Generated):</p>
                      <div className="p-2 bg-white rounded border border-gray-200 font-mono select-all break-all text-gray-800">
                        {resetTokenInfo}
                      </div>
                      <Link
                        to={`/reset-password?token=${resetTokenInfo}`}
                        onClick={() => setShowForgotModal(false)}
                        className="inline-block mt-2 font-semibold text-red-600 hover:underline"
                      >
                        Click here to set new password &rarr;
                      </Link>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowForgotModal(false)}
                      className="w-full"
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        setShowForgotModal(false);
                        navigate('/reset-password');
                      }}
                      className="w-full"
                    >
                      Reset Page
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Registered Email
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForgotModal(false)}
                      className="w-1/2"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={forgotLoading}
                      loading={forgotLoading}
                      className="w-1/2"
                    >
                      Send Instructions
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
