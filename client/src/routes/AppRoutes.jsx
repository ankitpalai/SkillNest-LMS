import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import RoleRoute from '../components/RoleRoute';

// Lazy-loaded route components for high performance and optimal code splitting
const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const ResetPassword = lazy(() => import('../pages/ResetPassword'));
const Courses = lazy(() => import('../pages/Courses'));
const CourseDetails = lazy(() => import('../pages/CourseDetails'));
const CoursePlayer = lazy(() => import('../pages/CoursePlayer'));
const StudentDashboard = lazy(() => import('../pages/StudentDashboard'));
const StudentMyCourses = lazy(() => import('../pages/student/MyCourses'));
const InstructorDashboard = lazy(() => import('../pages/InstructorDashboard'));
const InstructorMyCourses = lazy(() => import('../pages/instructor/MyCourses'));
const CourseForm = lazy(() => import('../pages/instructor/CourseForm'));
const CurriculumBuilder = lazy(() => import('../pages/instructor/CurriculumBuilder'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
const Wishlist = lazy(() => import('../pages/Wishlist'));
const Profile = lazy(() => import('../pages/Profile'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Clean loading placeholder skeleton
const PageLoadingFallback = () => (
  <div className="py-16 flex flex-col items-center justify-center space-y-4 min-h-[40vh]">
    <div className="w-8 h-8 border-3 border-neutral-200 border-t-primary-600 rounded-full animate-spin"></div>
    <span className="text-xs text-neutral-400 font-medium">Loading view...</span>
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Public Routes */}
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="reset-password/:token" element={<ResetPassword />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:id" element={<CourseDetails />} />
          
          {/* Course Player (Accessible for preview, unlocked for enrolled) */}
          <Route path="courses/:courseId/learn" element={<CoursePlayer />} />
          <Route path="learn/:courseId" element={<CoursePlayer />} />

          {/* Authenticated & Role-Protected Routes */}
          <Route element={<ProtectedRoute />}>
            {/* Universal Authenticated Routes */}
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="profile" element={<Profile />} />

            {/* Student Routes */}
            <Route element={<RoleRoute allowedRoles={['student']} />}>
              <Route path="dashboard/student" element={<StudentDashboard />} />
              <Route path="my-courses" element={<StudentMyCourses />} />
              <Route path="student/courses" element={<StudentMyCourses />} />
            </Route>

            {/* Instructor Portal & Curriculum Routes */}
            <Route element={<RoleRoute allowedRoles={['instructor', 'admin']} />}>
              <Route path="dashboard/instructor" element={<InstructorDashboard />} />
              <Route path="instructor/courses" element={<InstructorMyCourses />} />
              <Route path="instructor/courses/new" element={<CourseForm />} />
              <Route path="instructor/courses/:id/edit" element={<CourseForm />} />
              <Route path="instructor/courses/:id/curriculum" element={<CurriculumBuilder />} />
            </Route>

            {/* Admin Dashboard */}
            <Route element={<RoleRoute allowedRoles={['admin']} />}>
              <Route path="dashboard/admin" element={<AdminDashboard />} />
            </Route>
          </Route>

          {/* Fallback 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
