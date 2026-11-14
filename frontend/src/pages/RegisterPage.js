import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { DEFAULT_DONOR_RULES, COUNTRY_CODES, BLOOD_GROUPS } from '../config/donorRules';
import {
  HeartIcon as HeartSolidIcon,
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/solid';
import { HeartIcon } from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const RegisterPage = () => {
  const [selectedRole, setSelectedRole] = useState(null); // 'recipient', 'donor', 'hospital'

  // Configurable donor rules (fetched from server or defaulted)
  const [donorRules, setDonorRules] = useState(DEFAULT_DONOR_RULES);

  // Form fields
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    hospitalName: '',
    email: '',
    password: '',
    confirmPassword: '',
    countryCode: '+91',
    phoneNumber: '',
    emergencyCountryCode: '+91',
    emergencyPhoneNumber: '',
    bloodGroup: '',
    address: '',
    city: '',
    weight: '',
    hemoglobin: '',
    age: '',
    termsConsent: false,
    location: { lat: 0, lng: 0 }
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const { register, loading, clearError } = useAuth();
  const navigate = useNavigate();

  // Load donor rules from backend
  useEffect(() => {
    clearError();
    const fetchRules = async () => {
      try {
        const res = await authAPI.getDonorRules();
        if (res.data) {
          setDonorRules({
            minWeightKg: res.data.minWeightKg || DEFAULT_DONOR_RULES.minWeightKg,
            minHemoglobinGdl: res.data.minHemoglobinGdl || DEFAULT_DONOR_RULES.minHemoglobinGdl,
            minAgeYears: res.data.minAgeYears || DEFAULT_DONOR_RULES.minAgeYears,
            maxAgeYears: res.data.maxAgeYears || DEFAULT_DONOR_RULES.maxAgeYears,
            screeningDisclaimer: res.data.screeningDisclaimer || DEFAULT_DONOR_RULES.screeningDisclaimer
          });
        }
      } catch (err) {
        // Fallback to DEFAULT_DONOR_RULES if backend call fails
      }
    };
    fetchRules();

    // Optional location coordinates (non-blocking)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }));
        },
        () => {
          // Geolocation optional; defaults lat=0, lng=0
        }
      );
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: fieldValue
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
    if (serverError) setServerError('');
  };

  const validateForm = () => {
    const errs = {};

    // Common fields
    if (selectedRole === 'hospital') {
      if (!formData.hospitalName.trim()) {
        errs.hospitalName = 'Hospital name is required';
      }
    } else {
      if (!formData.firstName.trim()) {
        errs.firstName = 'First name is required';
      }
      if (!formData.lastName.trim()) {
        errs.lastName = 'Last name is required';
      }
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = 'Confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    // Phone number validation
    if (!formData.phoneNumber.trim()) {
      errs.phoneNumber = 'Phone number is required';
    } else if (!/^[0-9\-\s]{6,15}$/.test(formData.phoneNumber.trim())) {
      errs.phoneNumber = 'Enter a valid phone number (digits only)';
    }

    // Role-specific validations
    if (selectedRole === 'recipient') {
      if (!formData.bloodGroup) {
        errs.bloodGroup = 'Please select a blood group';
      }
    }

    if (selectedRole === 'donor') {
      if (!formData.bloodGroup) {
        errs.bloodGroup = 'Please select a blood group';
      }

      const weightNum = parseFloat(formData.weight);
      if (isNaN(weightNum) || weightNum <= 0) {
        errs.weight = 'Weight in kg is required';
      } else if (weightNum < donorRules.minWeightKg) {
        errs.weight = `Minimum donor weight is ${donorRules.minWeightKg} kg`;
      }

      const hgbNum = parseFloat(formData.hemoglobin);
      if (isNaN(hgbNum) || hgbNum <= 0) {
        errs.hemoglobin = 'Hemoglobin level is required';
      } else if (hgbNum < donorRules.minHemoglobinGdl) {
        errs.hemoglobin = `Minimum hemoglobin level is ${donorRules.minHemoglobinGdl} g/dL`;
      }

      const ageNum = parseInt(formData.age, 10);
      if (isNaN(ageNum) || ageNum <= 0) {
        errs.age = 'Age is required';
      } else if (ageNum < donorRules.minAgeYears) {
        errs.age = `Donors must be at least ${donorRules.minAgeYears} years old`;
      } else if (ageNum > donorRules.maxAgeYears) {
        errs.age = `Donors must be under ${donorRules.maxAgeYears} years old`;
      }
    }

    if (selectedRole === 'hospital') {
      if (!formData.emergencyPhoneNumber.trim()) {
        errs.emergencyPhoneNumber = 'Emergency phone number is required';
      }
      if (!formData.city.trim() && !formData.address.trim()) {
        errs.city = 'Hospital city or address is required';
      }
    }

    if (!formData.termsConsent) {
      errs.termsConsent = 'You must agree to the Terms of Service & Privacy Policy';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      return;
    }

    const fullPhone = `${formData.countryCode} ${formData.phoneNumber.trim()}`;
    const fullEmergencyPhone = formData.emergencyPhoneNumber.trim()
      ? `${formData.emergencyCountryCode} ${formData.emergencyPhoneNumber.trim()}`
      : fullPhone;

    const payload = {
      role: selectedRole,
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      termsConsent: formData.termsConsent,
      location: {
        lat: formData.location?.lat || 0,
        lng: formData.location?.lng || 0,
        address: formData.address.trim(),
        city: formData.city.trim()
      }
    };

    if (selectedRole === 'hospital') {
      payload.hospitalName = formData.hospitalName.trim();
      payload.name = formData.hospitalName.trim();
      payload.phone = fullPhone;
      payload.contactNumber = fullEmergencyPhone;
      payload.emergencyContact = fullEmergencyPhone;
    } else {
      payload.firstName = formData.firstName.trim();
      payload.lastName = formData.lastName.trim();
      payload.name = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      payload.phone = fullPhone;
      payload.bloodGroup = formData.bloodGroup;

      if (selectedRole === 'donor') {
        payload.donorHealthDetails = {
          weight: parseFloat(formData.weight),
          hemoglobin: parseFloat(formData.hemoglobin),
          age: parseInt(formData.age, 10)
        };
      }
    }

    try {
      const response = await register(payload);
      const userRole = response.user?.role || selectedRole;
      if (userRole === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(`/dashboard/${userRole}`, { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please check your inputs.';
      setServerError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-teal-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-10 left-10 w-32 h-32 bg-red-200 rounded-full opacity-20"
          animate={{ scale: [1, 1.3, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-48 h-48 bg-teal-200 rounded-full opacity-20"
          animate={{ scale: [1.3, 1, 1.3], x: [0, -30, 0], y: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full space-y-8 relative z-10"
      >
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <HeartSolidIcon className="h-14 w-14 text-red-500" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            Join BloodNet+
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {selectedRole
              ? `Registering as a ${selectedRole === 'recipient' ? 'Blood Recipient' : selectedRole === 'donor' ? 'Blood Donor' : 'Hospital'}`
              : 'Choose your role to get started saving lives'}
          </p>
        </div>

        {/* STEP 1: ROLE SELECTION */}
        {!selectedRole ? (
          <Card className="p-8 shadow-2xl bg-white/95 backdrop-blur-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
              Select Your Account Type
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Recipient Card */}
              <button
                type="button"
                onClick={() => setSelectedRole('recipient')}
                className="p-6 border-2 border-gray-200 rounded-2xl text-left hover:border-red-500 hover:bg-red-50/50 transition-all flex flex-col items-center text-center group cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <div className="p-4 bg-red-100 text-red-600 rounded-2xl group-hover:bg-red-500 group-hover:text-white transition-colors mb-4">
                  <UserIcon className="h-8 w-8" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">Blood Recipient</h4>
                <p className="text-xs text-gray-500">
                  Request blood units for urgent medical procedures or scheduled care.
                </p>
                <span className="mt-4 inline-flex items-center text-xs font-semibold text-red-600 group-hover:underline">
                  Select Recipient &rarr;
                </span>
              </button>

              {/* Donor Card */}
              <button
                type="button"
                onClick={() => setSelectedRole('donor')}
                className="p-6 border-2 border-gray-200 rounded-2xl text-left hover:border-red-500 hover:bg-red-50/50 transition-all flex flex-col items-center text-center group cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <div className="p-4 bg-teal-100 text-teal-600 rounded-2xl group-hover:bg-teal-500 group-hover:text-white transition-colors mb-4">
                  <HeartIcon className="h-8 w-8 stroke-2" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">Blood Donor</h4>
                <p className="text-xs text-gray-500">
                  Donate blood, find local blood camps, and respond to urgent hospital needs.
                </p>
                <span className="mt-4 inline-flex items-center text-xs font-semibold text-teal-600 group-hover:underline">
                  Select Donor &rarr;
                </span>
              </button>

              {/* Hospital Card */}
              <button
                type="button"
                onClick={() => setSelectedRole('hospital')}
                className="p-6 border-2 border-gray-200 rounded-2xl text-left hover:border-red-500 hover:bg-red-50/50 transition-all flex flex-col items-center text-center group cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-colors mb-4">
                  <BuildingOfficeIcon className="h-8 w-8" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">Hospital</h4>
                <p className="text-xs text-gray-500">
                  Manage blood inventory, process verified requests, and host donation camps.
                </p>
                <span className="mt-4 inline-flex items-center text-xs font-semibold text-blue-600 group-hover:underline">
                  Select Hospital &rarr;
                </span>
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-red-500 hover:text-red-600 transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>
          </Card>
        ) : (
          /* STEP 2: DEDICATED ROLE FORM */
          <Card className="p-8 shadow-2xl bg-white/95 backdrop-blur-sm border border-gray-100">
            {/* Role Header & Switch Button */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedRole(null)}
                className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5 mr-1" />
                Change Role
              </button>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 capitalize">
                {selectedRole === 'recipient' && 'Blood Recipient Registration'}
                {selectedRole === 'donor' && 'Blood Donor Registration'}
                {selectedRole === 'hospital' && 'Hospital Registration'}
              </span>
            </div>

            {serverError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
                role="alert"
              >
                <p className="text-red-700 text-sm font-medium">{serverError}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* Recipient / Donor Names */}
              {selectedRole !== 'hospital' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Jane"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        errors.firstName ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                      }`}
                    />
                    {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Doe"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        errors.lastName ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                      }`}
                    />
                    {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
                  </div>
                </div>
              ) : (
                /* Hospital Name */
                <div>
                  <label htmlFor="hospitalName" className="block text-sm font-semibold text-gray-700 mb-1">
                    Hospital / Blood Bank Name *
                  </label>
                  <input
                    id="hospitalName"
                    name="hospitalName"
                    type="text"
                    required
                    value={formData.hospitalName}
                    onChange={handleChange}
                    placeholder="City General Hospital & Blood Center"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.hospitalName ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                    }`}
                  />
                  {errors.hospitalName && <p className="mt-1 text-xs text-red-600">{errors.hospitalName}</p>}
                </div>
              )}

              {/* Email Address */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={selectedRole === 'hospital' ? 'admin@cityhospital.org' : 'jane.doe@example.com'}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    errors.email ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                  }`}
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="At least 6 characters"
                      className={`w-full px-4 py-3 pr-11 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        errors.password ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat password"
                      className={`w-full px-4 py-3 pr-11 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        errors.confirmPassword ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Phone number with Country Code */}
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 mb-1">
                  {selectedRole === 'hospital' ? 'Hospital Contact Phone *' : 'Phone Number *'}
                </label>
                <div className="flex rounded-xl shadow-sm">
                  <select
                    name="countryCode"
                    value={formData.countryCode}
                    onChange={handleChange}
                    aria-label="Country Code"
                    className="rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 px-3 py-3 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-red-500"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className={`w-full rounded-r-xl border px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.phoneNumber ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.phoneNumber && <p className="mt-1 text-xs text-red-600">{errors.phoneNumber}</p>}
              </div>

              {/* Hospital Emergency Phone & Address */}
              {selectedRole === 'hospital' && (
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  <div>
                    <label htmlFor="emergencyPhoneNumber" className="block text-sm font-semibold text-gray-700 mb-1">
                      24/7 Emergency Hotline *
                    </label>
                    <div className="flex rounded-xl shadow-sm">
                      <select
                        name="emergencyCountryCode"
                        value={formData.emergencyCountryCode}
                        onChange={handleChange}
                        aria-label="Emergency Country Code"
                        className="rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 px-3 py-3 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-red-500"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <input
                        id="emergencyPhoneNumber"
                        name="emergencyPhoneNumber"
                        type="tel"
                        required
                        value={formData.emergencyPhoneNumber}
                        onChange={handleChange}
                        placeholder="9876500000"
                        className={`w-full rounded-r-xl border px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                          errors.emergencyPhoneNumber ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.emergencyPhoneNumber && (
                      <p className="mt-1 text-xs text-red-600">{errors.emergencyPhoneNumber}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Mumbai"
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                          errors.city ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
                    </div>

                    <div>
                      <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-1">
                        Hospital Address
                      </label>
                      <input
                        id="address"
                        name="address"
                        type="text"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="123 Hospital Road, Sector 4"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Hospital Verification Notice */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start space-x-3">
                    <ShieldCheckIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-bold text-blue-900">Hospital Verification Required</h5>
                      <p className="text-xs text-blue-800 mt-1">
                        To safeguard clinical integrity and blood supply records, hospital accounts are subject to administrative review. Upon registration, your account status will show <strong>Pending Verification</strong> until validated by BloodNet administrators.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recipient & Donor Blood Group */}
              {selectedRole !== 'hospital' && (
                <div>
                  <label htmlFor="bloodGroup" className="block text-sm font-semibold text-gray-700 mb-1">
                    Blood Group *
                  </label>
                  <select
                    id="bloodGroup"
                    name="bloodGroup"
                    required
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white ${
                      errors.bloodGroup ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select your blood group</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                  {errors.bloodGroup && <p className="mt-1 text-xs text-red-600">{errors.bloodGroup}</p>}
                </div>
              )}

              {/* Donor Screening Section */}
              {selectedRole === 'donor' && (
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                      Preliminary Donor Screening
                    </h4>
                    <span className="text-xs text-gray-500">Configurable Guidelines</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="weight" className="block text-sm font-semibold text-gray-700 mb-1">
                        Weight (kg) *
                      </label>
                      <input
                        id="weight"
                        name="weight"
                        type="number"
                        min={donorRules.minWeightKg}
                        step="0.5"
                        required
                        value={formData.weight}
                        onChange={handleChange}
                        placeholder={`Min ${donorRules.minWeightKg} kg`}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                          errors.weight ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                        }`}
                      />
                      {errors.weight && <p className="mt-1 text-xs text-red-600">{errors.weight}</p>}
                    </div>

                    <div>
                      <label htmlFor="hemoglobin" className="block text-sm font-semibold text-gray-700 mb-1">
                        Hemoglobin (g/dL) *
                      </label>
                      <input
                        id="hemoglobin"
                        name="hemoglobin"
                        type="number"
                        min={donorRules.minHemoglobinGdl}
                        step="0.1"
                        required
                        value={formData.hemoglobin}
                        onChange={handleChange}
                        placeholder={`Min ${donorRules.minHemoglobinGdl} g/dL`}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                          errors.hemoglobin ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                        }`}
                      />
                      {errors.hemoglobin && <p className="mt-1 text-xs text-red-600">{errors.hemoglobin}</p>}
                    </div>

                    <div>
                      <label htmlFor="age" className="block text-sm font-semibold text-gray-700 mb-1">
                        Age (years) *
                      </label>
                      <input
                        id="age"
                        name="age"
                        type="number"
                        min={donorRules.minAgeYears}
                        max={donorRules.maxAgeYears}
                        required
                        value={formData.age}
                        onChange={handleChange}
                        placeholder={`Min ${donorRules.minAgeYears}`}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                          errors.age ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                        }`}
                      />
                      {errors.age && <p className="mt-1 text-xs text-red-600">{errors.age}</p>}
                    </div>
                  </div>

                  {/* Donor Medical Disclaimer & Privacy Notice */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                    <div className="flex items-start space-x-2.5">
                      <InformationCircleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-amber-900">
                          Preliminary Screening Disclaimer
                        </h5>
                        <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                          {donorRules.screeningDisclaimer} Meeting these preliminary values does not certify medical clearance; final donation eligibility will be established on-site by clinical staff following local statutory requirements.
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-amber-100 text-xs text-amber-800">
                      <strong>Privacy Notice:</strong> We collect only necessary screening metrics (weight, age, hemoglobin) solely to connect matching emergencies and protect donor safety. Your health data is securely restricted to authorized healthcare users.
                    </div>
                  </div>
                </div>
              )}

              {/* Terms and Privacy Consent Checkbox */}
              <div className="pt-2">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="termsConsent"
                    checked={formData.termsConsent}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-xs text-gray-600 leading-normal">
                    I agree to the{' '}
                    <span className="font-semibold text-gray-900">Terms of Service</span> and{' '}
                    <span className="font-semibold text-gray-900">Privacy Policy</span>. I consent to BloodNet+ processing my registration and clinical details to coordinate blood donation services.
                  </span>
                </label>
                {errors.termsConsent && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.termsConsent}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  loading={loading}
                  className="w-full py-4 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Create {selectedRole === 'recipient' ? 'Recipient' : selectedRole === 'donor' ? 'Donor' : 'Hospital'} Account
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-600">
                Already registered?{' '}
                <Link to="/login" className="font-semibold text-red-500 hover:text-red-600 transition-colors">
                  Sign in to your account
                </Link>
              </p>
            </div>
          </Card>
        )}

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
    </div>
  );
};

export default RegisterPage;
