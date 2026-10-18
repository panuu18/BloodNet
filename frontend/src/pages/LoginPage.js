import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { HeartIcon as HeartSolidIcon, EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/solid';
import { HeartIcon } from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Debug: Log initial form data
  React.useEffect(() => {
    console.log('LoginPage mounted, initial formData:', formData);
  }, []);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { login, loading, error, clearError, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  React.useEffect(() => {
    clearError();
  }, []);

  
  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('Input changed:', name, value);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
    
    try {
      console.log('Attempting login...');
      const response = await login(formData);
      console.log('Login successful, user role:', response.user.role);
      
      // Redirect to appropriate dashboard based on user role
      const dashboardPath = response.user.role === 'admin' ? '/admin' : `/dashboard/${response.user.role}`;
      navigate(dashboardPath, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-teal-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-10 left-10 w-32 h-32 bg-red-200 rounded-full opacity-20"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-48 h-48 bg-teal-200 rounded-full opacity-20"
          animate={{
            scale: [1.3, 1, 1.3],
            x: [0, -30, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <HeartSolidIcon className="h-16 w-16 text-red-500" />
              <motion.div
                className="absolute inset-0 bg-red-500 rounded-full opacity-20"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
            </div>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl font-bold text-gray-900 mb-3"
          >
            Welcome Back
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-gray-600"
          >
            Sign in to BloodNet+ and save lives
          </motion.p>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <Card className="p-8 shadow-2xl">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl"
              >
                <p className="text-red-600 text-sm">{error}</p>
              </motion.div>
            )}

            <div className="space-y-6">
              <Input
                type="email"
                label="Email Address"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => {
                  console.log('Email input changed:', e.target.value);
                  handleChange(e);
                }}
                error={errors.email}
                icon={<EnvelopeIcon className="h-5 w-5" />}
                name="email"
                autoComplete="email"
              />

              <Input
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => {
                  console.log('Password input changed:', e.target.value);
                  handleChange(e);
                }}
                error={errors.password}
                icon={<LockClosedIcon className="h-5 w-5" />}
                showPasswordToggle={true}
                name="password"
                autoComplete="current-password"
              />
            </div>

            <div className="mt-8">
              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                className="w-full py-4 text-lg shadow-lg hover:shadow-xl"
                onClick={() => console.log('Login button clicked')}
              >
                Sign In
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-medium text-red-500 hover:text-red-600 transition-colors"
                >
                  Sign up now
                </Link>
              </p>
            </div>
          </Card>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center"
        >
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors group"
          >
            <HeartIcon className="h-4 w-4 mr-1 group-hover:text-red-500 transition-colors" />
            Back to Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
