import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { userAPI, requestAPI } from '../services/api';
import { 
  UserIcon, 
  CameraIcon, 
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  HeartIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  
  // Helper function to construct image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) return imagePath;
    // If it's a relative path, construct full URL
    const baseUrl = process.env.REACT_APP_API_URL 
      ? process.env.REACT_APP_API_URL.replace(/\/api\/?$/, '') 
      : 'http://localhost:5000';
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    const fullUrl = `${baseUrl}${cleanPath}`;
    return fullUrl;
  };
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bloodGroup: user?.bloodGroup || '',
    address: user?.address || '',
    age: user?.age || '',
    weight: user?.donorHealthDetails?.weight || '',
    hemoglobin: user?.donorHealthDetails?.hemoglobin || '',
    hospitalName: user?.hospitalName || '',
    contactNumber: user?.contactNumber || ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(getImageUrl(user?.profileImage));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      console.log('User data in useEffect:', user);
      console.log('User profile image path:', user.profileImage);
      
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bloodGroup: user.bloodGroup || '',
        address: user.address || '',
        age: user.age || '',
        weight: user.donorHealthDetails?.weight || '',
        hemoglobin: user.donorHealthDetails?.hemoglobin || '',
        hospitalName: user.hospitalName || '',
        contactNumber: user.contactNumber || ''
      });
      
      const imageUrl = getImageUrl(user.profileImage);
      console.log('Setting preview image to:', imageUrl);
      setPreviewImage(imageUrl);
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setProfileImage(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Add profile image if changed
      if (profileImage) {
        formDataToSend.append('profileImage', profileImage);
      }

      const response = await userAPI.updateProfile(formDataToSend);
      
      console.log('Profile update response:', response.data);
      console.log('User profile image path:', response.data.user.profileImage);
      
      // Update user context with new data
      updateUser(response.data.user);
      // Update preview image with new URL
      const newImageUrl = getImageUrl(response.data.user.profileImage);
      console.log('New image URL:', newImageUrl);
      setPreviewImage(newImageUrl);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setProfileImage(null);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    setProfileImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">
            Manage your personal information and profile picture
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Picture & Basic Info */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
            >
              {/* Profile Picture */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 mx-auto mb-4">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Profile image failed to load:', previewImage);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                        onLoad={() => {
                          console.log('Profile image loaded successfully:', previewImage);
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center ${previewImage ? 'hidden' : ''}`}>
                      <UserIcon className="h-16 w-16 text-gray-400" />
                    </div>
                  </div>
                  
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <CameraIcon className="h-4 w-4" />
                    </button>
                  )}
                  
                  {isEditing && previewImage && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                
                <h3 className="text-lg font-semibold text-gray-900">{formData.name}</h3>
                <p className="text-sm text-gray-600">
                  {user?.role === 'donor' ? 'Donor' : 
                   user?.role === 'recipient' ? 'Recipient' : 'Hospital'}
                </p>
              </div>

              {/* Quick Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{formData.email}</span>
                </div>
                {formData.phone && (
                  <div className="flex items-center space-x-3 text-sm">
                    <PhoneIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{formData.phone}</span>
                  </div>
                )}
                {formData.bloodGroup && (
                  <div className="flex items-center space-x-3 text-sm">
                    <HeartIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Blood Group: {formData.bloodGroup}</span>
                  </div>
                )}
                {formData.address && (
                  <div className="flex items-center space-x-3 text-sm">
                    <MapPinIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{formData.address}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Edit Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant={isEditing ? "outline" : "primary"}
                  size="sm"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                  {success}
                </div>
              )}

              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        label="Full Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                      <Input
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                      <Input
                        label="Phone Number"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                      <Input
                        label="Address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* Role-specific Information */}
                  {user?.role === 'donor' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Health Information</h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Blood Group <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="bloodGroup"
                            value={formData.bloodGroup}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          >
                            <option value="">Select Blood Group</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                          </select>
                        </div>
                        <Input
                          label="Weight (kg)"
                          name="weight"
                          type="number"
                          value={formData.weight}
                          onChange={handleChange}
                        />
                        <Input
                          label="Hemoglobin (g/dL)"
                          name="hemoglobin"
                          type="number"
                          step="0.1"
                          value={formData.hemoglobin}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  )}

                  {user?.role === 'recipient' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Recipient Information</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <Input
                          label="Blood Group"
                          name="bloodGroup"
                          value={formData.bloodGroup}
                          onChange={handleChange}
                          required
                          disabled
                        />
                        <Input
                          label="Age"
                          name="age"
                          type="number"
                          value={formData.age}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  )}

                  {user?.role === 'hospital' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Hospital Information</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <Input
                          label="Hospital Name"
                          name="hospitalName"
                          value={formData.hospitalName}
                          onChange={handleChange}
                          required
                        />
                        <Input
                          label="Contact Number"
                          name="contactNumber"
                          value={formData.contactNumber}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      loading={loading}
                      disabled={loading}
                    >
                      {loading ? 'Updating...' : 'Update Profile'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="text-center py-12">
                    <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Click "Edit Profile" to update your information</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
