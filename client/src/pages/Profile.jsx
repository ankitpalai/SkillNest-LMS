import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile, changePassword, fetchCurrentUser } from '../features/auth/authSlice';
import api from '../services/api';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
];

export const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Active section tab
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'account'

  // Profile Form state
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [showCustomAvatarInput, setShowCustomAvatarInput] = useState(false);

  // Profile status message
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // User stats from /users/profile
  const [stats, setStats] = useState({ enrollmentCount: 0, wishlistCount: 0 });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
    }

    const loadProfileStats = async () => {
      try {
        const res = await api.get('/users/profile');
        if (res.data?.user) {
          setStats({
            enrollmentCount: res.data.user.enrollmentCount || 0,
            wishlistCount: res.data.user.wishlistCount || 0,
          });
        }
      } catch (err) {
        // Fallback silently
      }
    };

    loadProfileStats();
  }, [user]);

  // Handle Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!name.trim()) {
      setProfileError('Full name is required');
      return;
    }

    if (name.trim().length > 50) {
      setProfileError('Name cannot exceed 50 characters');
      return;
    }

    if (bio.length > 250) {
      setProfileError('Bio cannot exceed 250 characters');
      return;
    }

    setProfileLoading(true);
    try {
      const result = await dispatch(
        updateUserProfile({
          name: name.trim(),
          bio: bio.trim(),
          avatar: avatar.trim(),
        })
      ).unwrap();

      setProfileSuccess(result.message || 'Profile updated successfully!');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err) {
      setProfileError(err || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    setPasswordLoading(true);
    try {
      const result = await dispatch(
        changePassword({ currentPassword, newPassword })
      ).unwrap();

      setPasswordSuccess(result.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err) {
      setPasswordError(err || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-neutral-200 pb-5">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Account Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Manage your personal profile, public information, and account security.
        </p>
      </div>

      {/* Main Layout Container */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-neutral-200">
        {/* Left Sidebar Navigation */}
        <aside className="p-4 sm:p-5 bg-neutral-50/70 space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-neutral-200/80">
            <img
              src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt={user?.name}
              className="w-11 h-11 rounded-full object-cover border border-neutral-300 shrink-0 bg-white"
            />
            <div className="truncate">
              <p className="text-xs font-bold text-neutral-900 truncate">{user?.name}</p>
              <span className="text-[11px] font-semibold text-primary-600 capitalize">
                {user?.role || 'student'}
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2.5 transition-colors ${
                activeTab === 'profile'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-neutral-700 hover:bg-neutral-200/60'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Profile Information</span>
            </button>

            <button
              onClick={() => setActiveTab('account')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2.5 transition-colors ${
                activeTab === 'account'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-neutral-700 hover:bg-neutral-200/60'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>Account Details</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2.5 transition-colors ${
                activeTab === 'security'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-neutral-700 hover:bg-neutral-200/60'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Security & Password</span>
            </button>
          </nav>
        </aside>

        {/* Right Settings Content */}
        <main className="md:col-span-3 p-6 sm:p-8 space-y-6">
          {/* TAB 1: Profile Information */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-xl">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Profile Information</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Update your display name, bio, and avatar. This information will be shown on your reviews and certificates.
                </p>
              </div>

              {profileSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center space-x-2">
                  <span>✓</span>
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center space-x-2">
                  <span>⚠️</span>
                  <span>{profileError}</span>
                </div>
              )}

              {/* Avatar Selector */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-neutral-700">Profile Avatar</label>
                <div className="flex items-center space-x-4">
                  <div className="relative group">
                    <img
                      src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                      alt="Preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary-500 shrink-0 shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    {/* File Upload Button */}
                    <div>
                      <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold rounded-lg shadow-sm transition-colors">
                        <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const formData = new FormData();
                            formData.append('avatar', file);
                            try {
                              setProfileLoading(true);
                              const res = await api.post('/upload/avatar', formData, {
                                headers: { 'Content-Type': 'multipart/form-data' },
                              });
                              if (res.data?.url) {
                                setAvatar(res.data.url);
                                dispatch(fetchCurrentUser());
                                setProfileSuccess('Avatar uploaded successfully!');
                                setTimeout(() => setProfileSuccess(''), 3000);
                              }
                            } catch (err) {
                              setProfileError(err.response?.data?.message || 'Failed to upload avatar image');
                            } finally {
                              setProfileLoading(false);
                            }
                          }}
                        />
                      </label>
                      <span className="text-[11px] text-neutral-400 ml-2">PNG, JPG, WEBP up to 5MB</span>
                    </div>

                    {/* Presets */}
                    <div className="flex items-center space-x-2 pt-1">
                      <span className="text-[11px] text-neutral-500">Or preset:</span>
                      {PRESET_AVATARS.map((url, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => {
                            setAvatar(url);
                            setShowCustomAvatarInput(false);
                          }}
                          className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${
                            avatar === url ? 'border-primary-600 scale-105 shadow-sm' : 'border-neutral-200 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={url} alt="Preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setShowCustomAvatarInput(!showCustomAvatarInput)}
                        className="text-[11px] font-semibold text-primary-600 hover:text-primary-700 pl-1"
                      >
                        URL
                      </button>
                    </div>
                  </div>
                </div>

                {showCustomAvatarInput && (
                  <div className="pt-1">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/your-photo.jpg"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-700">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  required
                  placeholder="e.g. Sarah Connor"
                  className="w-full px-3.5 py-2.5 text-xs text-neutral-900 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
                <p className="text-[11px] text-neutral-400">Max 50 characters</p>
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-700">Biography / About</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={250}
                  rows={3}
                  placeholder="Brief summary of your professional expertise or learning goals..."
                  className="w-full px-3.5 py-2 text-xs text-neutral-900 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
                />
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>Share your background or interests</span>
                  <span>{bio.length}/250</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={profileLoading}
                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {profileLoading ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </form>
          )}

          {/* TAB 2: Account Details */}
          {activeTab === 'account' && (
            <div className="space-y-6 max-w-xl">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Account Overview</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  System information, registration timestamp, and account roles.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg space-y-3">
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-neutral-200">
                    <span className="text-neutral-500 font-medium">Email Address</span>
                    <span className="font-semibold text-neutral-900 flex items-center space-x-1.5">
                      <span>{user?.email}</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded">
                        Verified
                      </span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs pb-2 border-b border-neutral-200">
                    <span className="text-neutral-500 font-medium">Assigned System Role</span>
                    <span className="font-bold uppercase tracking-wider text-xs px-2 py-0.5 bg-neutral-200 text-neutral-800 rounded">
                      {user?.role || 'student'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs pb-2 border-b border-neutral-200">
                    <span className="text-neutral-500 font-medium">Account Created</span>
                    <span className="text-neutral-700">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Member'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-500 font-medium">Enrolled Curriculums</span>
                    <span className="font-bold text-neutral-900">{stats.enrollmentCount} Tracks</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Security & Password */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-xl">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Security & Password</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Ensure your account uses a secure password with a minimum of 6 characters.
                </p>
              </div>

              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center space-x-2">
                  <span>✓</span>
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center space-x-2">
                  <span>⚠️</span>
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-700">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter existing password"
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs text-neutral-900 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 focus:outline-none"
                    aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? (
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

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-700">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs text-neutral-900 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 focus:outline-none"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? (
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

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-700">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs text-neutral-900 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 focus:outline-none"
                    aria-label={showConfirmNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmNewPassword ? (
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
                disabled={passwordLoading}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {passwordLoading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
};

export default Profile;
