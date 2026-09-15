import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchAdminStats,
  fetchAdminUsers,
  updateUserRoleThunk,
  deleteUserThunk,
  fetchAdminCourses,
  toggleAdminCourseStatus,
  deleteAdminCourseThunk,
  fetchAdminCategories,
  createCategoryThunk,
  updateCategoryThunk,
  deleteCategoryThunk,
  clearAdminStatus,
} from '../features/admin/adminSlice';

export const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);
  const {
    stats,
    isStatsLoading,
    users,
    totalUsers,
    totalPages,
    currentPage,
    isUsersLoading,
    courses,
    totalCourses,
    totalCoursePages,
    currentCoursePage,
    isCoursesLoading,
    categories,
    isCategoriesLoading,
    error,
    successMessage,
  } = useSelector((state) => state.admin);

  // Active Tab State
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'courses' | 'categories'

  // User Management filters & pagination
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userPage, setUserPage] = useState(1);

  // Course Management filters & pagination
  const [courseSearch, setCourseSearch] = useState('');
  const [courseStatusFilter, setCourseStatusFilter] = useState('all');
  const [coursePage, setCoursePage] = useState(1);

  // Category Management Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // null for create, object for edit
  const [categoryFormData, setCategoryFormData] = useState({ name: '', description: '' });

  // Confirmation Modals State
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    type: null, // 'user' | 'course' | 'category'
    id: null,
    title: '',
    message: '',
  });

  // Action feedback message timeout
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Initial Data Load
  useEffect(() => {
    dispatch(fetchAdminStats());
  }, [dispatch]);

  // Load tab-specific data when tab changes or filters change
  useEffect(() => {
    if (activeTab === 'users') {
      dispatch(
        fetchAdminUsers({
          page: userPage,
          limit: 10,
          search: userSearch,
          role: userRoleFilter,
        })
      );
    } else if (activeTab === 'courses') {
      dispatch(
        fetchAdminCourses({
          page: coursePage,
          limit: 10,
          search: courseSearch,
          status: courseStatusFilter,
        })
      );
    } else if (activeTab === 'categories') {
      dispatch(fetchAdminCategories());
    }
  }, [activeTab, userPage, userRoleFilter, coursePage, courseStatusFilter, dispatch]);

  // Handle Redux Slice Success/Error Notifications
  useEffect(() => {
    if (successMessage) {
      setFeedback({ type: 'success', message: successMessage });
      const timer = setTimeout(() => {
        setFeedback({ type: '', message: '' });
        dispatch(clearAdminStatus());
      }, 4000);
      return () => clearTimeout(timer);
    }
    if (error) {
      setFeedback({ type: 'error', message: error });
      const timer = setTimeout(() => {
        setFeedback({ type: '', message: '' });
        dispatch(clearAdminStatus());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error, dispatch]);

  // User search form submit handler
  const handleUserSearch = (e) => {
    e.preventDefault();
    setUserPage(1);
    dispatch(
      fetchAdminUsers({
        page: 1,
        limit: 10,
        search: userSearch,
        role: userRoleFilter,
      })
    );
  };

  // Course search form submit handler
  const handleCourseSearch = (e) => {
    e.preventDefault();
    setCoursePage(1);
    dispatch(
      fetchAdminCourses({
        page: 1,
        limit: 10,
        search: courseSearch,
        status: courseStatusFilter,
      })
    );
  };

  // Handle User Role Change
  const handleRoleChange = async (userId, newRole) => {
    if (userId === currentUser?._id && newRole !== 'admin') {
      setFeedback({
        type: 'error',
        message: 'Security Guard: You cannot demote your own admin account.',
      });
      return;
    }
    await dispatch(updateUserRoleThunk({ userId, role: newRole }));
    dispatch(fetchAdminStats());
  };

  // Trigger User Deletion Confirmation
  const promptDeleteUser = (user) => {
    if (user._id === currentUser?._id) {
      setFeedback({
        type: 'error',
        message: 'Security Guard: You cannot delete your own admin account.',
      });
      return;
    }
    setDeleteConfirm({
      isOpen: true,
      type: 'user',
      id: user._id,
      title: `Delete User: ${user.name}`,
      message: `Are you sure you want to permanently delete user "${user.name}" (${user.email})? All associated student enrollments and records will be cleaned up.`,
    });
  };

  // Trigger Course Deletion Confirmation
  const promptDeleteCourse = (course) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'course',
      id: course._id,
      title: `Delete Course: ${course.title}`,
      message: `Are you sure you want to permanently delete "${course.title}"? All associated lessons, reviews, and student enrollment records will be removed.`,
    });
  };

  // Trigger Category Deletion Confirmation
  const promptDeleteCategory = (category) => {
    if (category.courseCount > 0) {
      setFeedback({
        type: 'error',
        message: `Cannot delete category "${category.name}" because it is linked to ${category.courseCount} active course(s). Reassign them first.`,
      });
      return;
    }
    setDeleteConfirm({
      isOpen: true,
      type: 'category',
      id: category._id,
      title: `Delete Category: ${category.name}`,
      message: `Are you sure you want to delete category "${category.name}"?`,
    });
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    const { type, id } = deleteConfirm;
    setDeleteConfirm({ isOpen: false, type: null, id: null, title: '', message: '' });

    if (type === 'user') {
      await dispatch(deleteUserThunk(id));
      dispatch(fetchAdminStats());
    } else if (type === 'course') {
      await dispatch(deleteAdminCourseThunk(id));
      dispatch(fetchAdminStats());
    } else if (type === 'category') {
      await dispatch(deleteCategoryThunk(id));
    }
  };

  // Toggle Course Status (published <-> draft)
  const handleToggleCourseStatus = async (courseId, currentStatus) => {
    const nextStatus = currentStatus === 'published' ? 'draft' : 'published';
    await dispatch(toggleAdminCourseStatus({ courseId, status: nextStatus }));
    dispatch(fetchAdminStats());
  };

  // Category Modal Handlers
  const openCreateCategoryModal = () => {
    setEditingCategory(null);
    setCategoryFormData({ name: '', description: '' });
    setCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat) => {
    setEditingCategory(cat);
    setCategoryFormData({ name: cat.name || '', description: cat.description || '' });
    setCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) {
      setFeedback({ type: 'error', message: 'Category name is required' });
      return;
    }

    if (editingCategory) {
      await dispatch(
        updateCategoryThunk({
          categoryId: editingCategory._id,
          name: categoryFormData.name,
          description: categoryFormData.description,
        })
      );
    } else {
      await dispatch(
        createCategoryThunk({
          name: categoryFormData.name,
          description: categoryFormData.description,
        })
      );
    }
    setCategoryModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Admin Console</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded-full">
              System Admin
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Enterprise management hub for SkillNest users, courses, categories, and system telemetry.
          </p>
        </div>

        {/* Global Quick Action / Telemetry Refresh */}
        <button
          onClick={() => {
            dispatch(fetchAdminStats());
            if (activeTab === 'users') dispatch(fetchAdminUsers({ page: userPage, limit: 10, search: userSearch, role: userRoleFilter }));
            if (activeTab === 'courses') dispatch(fetchAdminCourses({ page: coursePage, limit: 10, search: courseSearch, status: courseStatusFilter }));
            if (activeTab === 'categories') dispatch(fetchAdminCategories());
          }}
          className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 shadow-sm transition-colors self-start sm:self-auto"
        >
          <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Action Notification Banner */}
      {feedback.message && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            {feedback.type === 'success' ? (
              <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="text-sm font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback({ type: '', message: '' })}
            className="text-xs font-semibold text-neutral-500 hover:text-neutral-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-neutral-200 overflow-x-auto space-x-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'overview'
              ? 'border-primary-600 text-primary-600 bg-primary-50/50'
              : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'users'
              ? 'border-primary-600 text-primary-600 bg-primary-50/50'
              : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>User Management</span>
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'courses'
              ? 'border-primary-600 text-primary-600 bg-primary-50/50'
              : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span>Course Management</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'categories'
              ? 'border-primary-600 text-primary-600 bg-primary-50/50'
              : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span>Category Management</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW TAB */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
              <p className="text-xs font-medium text-neutral-500">Total Users</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {isStatsLoading ? '...' : stats?.totalUsers ?? 0}
              </p>
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
              <p className="text-xs font-medium text-neutral-500">Students</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {isStatsLoading ? '...' : stats?.totalStudents ?? 0}
              </p>
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
              <p className="text-xs font-medium text-neutral-500">Instructors</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">
                {isStatsLoading ? '...' : stats?.totalInstructors ?? 0}
              </p>
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
              <p className="text-xs font-medium text-neutral-500">Total Courses</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {isStatsLoading ? '...' : stats?.totalCourses ?? 0}
              </p>
              <span className="text-[10px] text-neutral-400">
                {stats?.publishedCourses ?? 0} published
              </span>
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
              <p className="text-xs font-medium text-neutral-500">Enrollments</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {isStatsLoading ? '...' : stats?.totalEnrollments ?? 0}
              </p>
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
              <p className="text-xs font-medium text-neutral-500">Total Revenue</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                ${isStatsLoading ? '...' : (stats?.totalRevenue ?? 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* 2-Column Split: Recent Users & Recent Courses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Users Panel */}
            <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-neutral-900">Recently Registered Users</h2>
                  <p className="text-xs text-neutral-500">Latest platform accounts</p>
                </div>
                <button
                  onClick={() => setActiveTab('users')}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                >
                  Manage All →
                </button>
              </div>

              <div className="divide-y divide-neutral-100">
                {stats?.recentUsers?.length > 0 ? (
                  stats.recentUsers.map((u) => (
                    <div key={u._id} className="p-4 flex items-center justify-between hover:bg-neutral-50/70 transition-colors">
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={
                            u.avatar ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                          }
                          alt={u.name}
                          className="w-9 h-9 rounded-full object-cover border border-neutral-200 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-neutral-900 truncate">{u.name}</p>
                          <p className="text-xs text-neutral-500 truncate">{u.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 flex-shrink-0 ml-3">
                        <span
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                            u.role === 'admin'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : u.role === 'instructor'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                          }`}
                        >
                          {u.role}
                        </span>
                        <span className="text-xs text-neutral-400">
                          {new Date(u.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-neutral-500">
                    No recent users found.
                  </div>
                )}
              </div>
            </div>

            {/* Recent Courses Panel */}
            <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-neutral-900">Recently Created Courses</h2>
                  <p className="text-xs text-neutral-500">Latest additions to catalog</p>
                </div>
                <button
                  onClick={() => setActiveTab('courses')}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                >
                  Manage All →
                </button>
              </div>

              <div className="divide-y divide-neutral-100">
                {stats?.recentCourses?.length > 0 ? (
                  stats.recentCourses.map((c) => (
                    <div key={c._id} className="p-4 flex items-center justify-between hover:bg-neutral-50/70 transition-colors">
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={
                            c.thumbnail ||
                            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&auto=format&fit=crop&q=80'
                          }
                          alt={c.title}
                          className="w-12 h-8 rounded object-cover border border-neutral-200 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-neutral-900 truncate">{c.title}</p>
                          <p className="text-xs text-neutral-500 truncate">
                            By {c.instructor?.name || 'Instructor'} • ${c.price || 0}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 flex-shrink-0 ml-3">
                        <span
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                            c.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {c.status}
                        </span>
                        <Link
                          to={`/courses/${c._id}`}
                          className="text-xs font-semibold text-primary-600 hover:underline"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-neutral-500">
                    No recent courses created yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Stream */}
          <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-900 mb-3">System & Management Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-neutral-600">
              <div className="p-3 bg-neutral-50 rounded border border-neutral-200">
                <span className="font-semibold text-neutral-800 block mb-1">Role-Based Access Control</span>
                Strictly enforced on all backend API routes (`/api/admin/*`, `/api/categories/*`) and frontend protected routes.
              </div>
              <div className="p-3 bg-neutral-50 rounded border border-neutral-200">
                <span className="font-semibold text-neutral-800 block mb-1">Administrative Safety</span>
                Self-demotion and self-account deletion protection prevent admin lockout.
              </div>
              <div className="p-3 bg-neutral-50 rounded border border-neutral-200">
                <span className="font-semibold text-neutral-800 block mb-1">Relational Integrity</span>
                Deleting courses cleanly cascades enrollments & lessons. Category deletion guards active courses.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: USER MANAGEMENT TAB */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Controls Bar: Search & Role Filter */}
          <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <form onSubmit={handleUserSearch} className="flex-1 flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search user by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <svg
                  className="w-4 h-4 text-neutral-400 absolute left-3 top-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors"
              >
                Search
              </button>
            </form>

            <div className="flex items-center space-x-2">
              <label className="text-xs font-medium text-neutral-600 whitespace-nowrap">Filter Role:</label>
              <select
                value={userRoleFilter}
                onChange={(e) => {
                  setUserRoleFilter(e.target.value);
                  setUserPage(1);
                }}
                className="px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="instructor">Instructors</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    <th className="px-5 py-3.5">User</th>
                    <th className="px-5 py-3.5">Email</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5">Joined Date</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {isUsersLoading ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-8 text-center text-xs text-neutral-500">
                        Loading users...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-8 text-center text-xs text-neutral-500">
                        No users found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isSelf = u._id === currentUser?._id;
                      return (
                        <tr key={u._id} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center space-x-3">
                              <img
                                src={
                                  u.avatar ||
                                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                                }
                                alt={u.name}
                                className="w-8 h-8 rounded-full object-cover border border-neutral-300"
                              />
                              <div>
                                <span className="font-semibold text-neutral-900 block">{u.name}</span>
                                {isSelf && (
                                  <span className="text-[10px] text-primary-600 font-semibold">(You)</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-neutral-600 font-mono text-xs">{u.email}</td>
                          <td className="px-5 py-3.5">
                            <select
                              value={u.role}
                              disabled={isSelf}
                              onChange={(e) => handleRoleChange(u._id, e.target.value)}
                              className={`text-xs font-semibold px-2.5 py-1 rounded border focus:outline-none ${
                                u.role === 'admin'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : u.role === 'instructor'
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                              } ${isSelf ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:border-neutral-400'}`}
                            >
                              <option value="student">student</option>
                              <option value="instructor">instructor</option>
                              <option value="admin">admin</option>
                            </select>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-neutral-500">
                            {new Date(u.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => promptDeleteUser(u)}
                              disabled={isSelf}
                              title={isSelf ? 'You cannot delete yourself' : 'Delete user'}
                              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                                isSelf
                                  ? 'text-neutral-300 cursor-not-allowed'
                                  : 'text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200'
                              }`}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
                <span className="text-xs text-neutral-500">
                  Showing page <span className="font-semibold text-neutral-700">{currentPage}</span> of{' '}
                  <span className="font-semibold text-neutral-700">{totalPages}</span> ({totalUsers} users)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setUserPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage <= 1}
                    className="px-2.5 py-1 text-xs font-medium bg-white border border-neutral-300 rounded disabled:opacity-50 hover:bg-neutral-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setUserPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                    className="px-2.5 py-1 text-xs font-medium bg-white border border-neutral-300 rounded disabled:opacity-50 hover:bg-neutral-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: COURSE MANAGEMENT TAB */}
      {/* ========================================================================= */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <form onSubmit={handleCourseSearch} className="flex-1 flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search course title..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <svg
                  className="w-4 h-4 text-neutral-400 absolute left-3 top-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors"
              >
                Search
              </button>
            </form>

            <div className="flex items-center space-x-2">
              <label className="text-xs font-medium text-neutral-600 whitespace-nowrap">Status:</label>
              <select
                value={courseStatusFilter}
                onChange={(e) => {
                  setCourseStatusFilter(e.target.value);
                  setCoursePage(1);
                }}
                className="px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="all">All Courses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Courses Table */}
          <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    <th className="px-5 py-3.5">Course</th>
                    <th className="px-5 py-3.5">Instructor</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Price</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {isCoursesLoading ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-8 text-center text-xs text-neutral-500">
                        Loading courses...
                      </td>
                    </tr>
                  ) : courses.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-8 text-center text-xs text-neutral-500">
                        No courses found.
                      </td>
                    </tr>
                  ) : (
                    courses.map((c) => (
                      <tr key={c._id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center space-x-3">
                            <img
                              src={
                                c.thumbnail ||
                                'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&auto=format&fit=crop&q=80'
                              }
                              alt={c.title}
                              className="w-12 h-8 rounded object-cover border border-neutral-300 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="font-semibold text-neutral-900 block truncate max-w-[220px]">
                                {c.title}
                              </span>
                              <span className="text-xs text-neutral-400 capitalize">{c.level} level</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-medium text-neutral-800 block text-xs">
                            {c.instructor?.name || 'N/A'}
                          </span>
                          <span className="text-[11px] text-neutral-400 font-mono">
                            {c.instructor?.email || ''}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-neutral-600">
                          {c.category?.name || 'General'}
                        </td>
                        <td className="px-5 py-3.5 text-xs font-semibold text-neutral-900">
                          ${c.price || 0}
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => handleToggleCourseStatus(c._id, c.status)}
                            title="Click to toggle published / draft state"
                            className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                              c.status === 'published'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100'
                            }`}
                          >
                            {c.status === 'published' ? '✓ Published' : '✎ Draft'}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-2">
                          <Link
                            to={`/courses/${c._id}`}
                            className="px-2.5 py-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-300 hover:bg-neutral-50 rounded transition-colors"
                          >
                            Preview
                          </Link>
                          <button
                            onClick={() => promptDeleteCourse(c)}
                            className="px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalCoursePages > 1 && (
              <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
                <span className="text-xs text-neutral-500">
                  Showing page <span className="font-semibold text-neutral-700">{currentCoursePage}</span> of{' '}
                  <span className="font-semibold text-neutral-700">{totalCoursePages}</span> ({totalCourses} courses)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCoursePage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentCoursePage <= 1}
                    className="px-2.5 py-1 text-xs font-medium bg-white border border-neutral-300 rounded disabled:opacity-50 hover:bg-neutral-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCoursePage((prev) => Math.min(prev + 1, totalCoursePages))}
                    disabled={currentCoursePage >= totalCoursePages}
                    className="px-2.5 py-1 text-xs font-medium bg-white border border-neutral-300 rounded disabled:opacity-50 hover:bg-neutral-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CATEGORY MANAGEMENT TAB */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Course Categories</h2>
              <p className="text-xs text-neutral-500">Manage taxonomy and course classification</p>
            </div>
            <button
              onClick={openCreateCategoryModal}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
            >
              <span>+ Add Category</span>
            </button>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    <th className="px-5 py-3.5">Category Name</th>
                    <th className="px-5 py-3.5">Description</th>
                    <th className="px-5 py-3.5">Active Courses</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {isCategoriesLoading ? (
                    <tr>
                      <td colSpan="4" className="px-5 py-8 text-center text-xs text-neutral-500">
                        Loading categories...
                      </td>
                    </tr>
                  ) : categories.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-5 py-8 text-center text-xs text-neutral-500">
                        No categories found. Click "+ Add Category" to create one.
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr key={cat._id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-neutral-900">{cat.name}</td>
                        <td className="px-5 py-3.5 text-xs text-neutral-500 max-w-xs truncate">
                          {cat.description || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-700 rounded-full">
                            {cat.courseCount ?? 0} courses
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-2">
                          <button
                            onClick={() => openEditCategoryModal(cat)}
                            className="px-2.5 py-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-300 hover:bg-neutral-50 rounded transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => promptDeleteCategory(cat)}
                            className="px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CATEGORY CREATE / EDIT MODAL */}
      {/* ========================================================================= */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h3 className="text-base font-bold text-neutral-900">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Web Development"
                  value={categoryFormData.name}
                  onChange={(e) =>
                    setCategoryFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Brief description of this category..."
                  value={categoryFormData.description}
                  onChange={(e) =>
                    setCategoryFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-800 bg-neutral-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm"
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRMATION DELETION MODAL */}
      {/* ========================================================================= */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-neutral-900">{deleteConfirm.title}</h3>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">{deleteConfirm.message}</p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-neutral-200">
              <button
                type="button"
                onClick={() =>
                  setDeleteConfirm({ isOpen: false, type: null, id: null, title: '', message: '' })
                }
                className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-800 bg-neutral-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
