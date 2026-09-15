import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInstructorStats, fetchInstructorCourses } from '../features/instructor/instructorSlice';

export const InstructorDashboard = () => {
  const dispatch = useDispatch();
  const { stats, courses, isLoading } = useSelector((state) => state.instructor);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchInstructorStats());
    dispatch(fetchInstructorCourses());
  }, [dispatch]);

  const metrics = [
    {
      label: 'Total Courses',
      value: stats ? stats.totalCourses : '—',
      detail: stats ? `${stats.publishedCourses} Published · ${stats.draftCourses} Draft` : '',
      icon: (
        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      label: 'Total Students',
      value: stats ? stats.totalStudents.toLocaleString() : '—',
      detail: 'Enrolled across all courses',
      icon: (
        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      label: 'Total Enrollments',
      value: stats ? stats.totalEnrollments.toLocaleString() : '—',
      detail: 'Lifetime student registrations',
      icon: (
        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Average Course Rating',
      value: stats ? `${stats.avgRating} / 5.0` : '—',
      detail: 'From verified course reviews',
      icon: (
        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header with Quick Actions */}
      <div className="border-b border-neutral-200 pb-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Instructor Dashboard</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-primary-50 text-primary-700 border border-primary-200">
              Instructor Portal
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Welcome back, {user?.name || 'Instructor'}. Here is your course telemetry and student enrollment overview.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/instructor/courses"
            className="px-3.5 py-2 text-xs font-semibold rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            My Courses ({courses.length})
          </Link>
          <Link
            to="/instructor/courses/new"
            className="px-3.5 py-2 text-xs font-semibold rounded-md text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition-colors flex items-center space-x-1.5"
          >
            <span>+</span>
            <span>Create Course</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-white border border-neutral-200 rounded-lg p-5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{metric.label}</p>
              <div className="w-8 h-8 rounded-md bg-neutral-50 flex items-center justify-center border border-neutral-100">
                {metric.icon}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-extrabold text-neutral-900 tracking-tight">{metric.value}</p>
              {metric.detail && (
                <p className="text-xs text-neutral-400 mt-1">{metric.detail}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Active Courses Summary Table */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">Your Active Courses</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Manage curriculum, lectures, and enrollment settings</p>
          </div>
          <Link
            to="/instructor/courses"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700"
          >
            View All Courses →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-left text-xs">
            <thead className="bg-neutral-50/75 text-neutral-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Course</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Curriculum</th>
                <th className="px-5 py-3">Students</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white text-neutral-700">
              {courses.slice(0, 5).map((course) => (
                <tr key={course._id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center space-x-3">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-10 h-7 object-cover rounded border border-neutral-200"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60';
                        }}
                      />
                      <div>
                        <Link
                          to={`/courses/${course._id}`}
                          className="font-semibold text-neutral-900 hover:text-primary-600 transition-colors line-clamp-1"
                        >
                          {course.title}
                        </Link>
                        <span className="text-[11px] text-neutral-400 capitalize">{course.level} Level</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-neutral-600">{course.category?.name || 'General'}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide border ${
                        course.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {course.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-neutral-600">
                    <span className="font-medium text-neutral-900">{course.sectionCount || 0}</span> sections ·{' '}
                    <span className="font-medium text-neutral-900">{course.lessonCount || 0}</span> lessons
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-neutral-900">
                    {(course.enrolledStudents || 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right space-x-2">
                    <Link
                      to={`/instructor/courses/${course._id}/curriculum`}
                      className="px-2.5 py-1 rounded text-xs font-semibold bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
                    >
                      Curriculum
                    </Link>
                    <Link
                      to={`/instructor/courses/${course._id}/edit`}
                      className="px-2.5 py-1 rounded text-xs font-semibold border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Enrollments Activity Table */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h2 className="text-sm font-bold text-neutral-900">Recent Enrollments</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Students who recently registered for your courses</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-left text-xs">
            <thead className="bg-neutral-50/75 text-neutral-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Course</th>
                <th className="px-5 py-3">Price Paid</th>
                <th className="px-5 py-3 text-right">Enrolled At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white text-neutral-700">
              {stats?.recentEnrollments?.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-[10px]">
                        {item.studentName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">{item.studentName}</p>
                        <p className="text-[11px] text-neutral-400">{item.studentEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-neutral-800">{item.courseTitle}</td>
                  <td className="px-5 py-3.5 font-semibold text-neutral-900">
                    {item.price === 0 ? <span className="text-emerald-600">Free</span> : `$${item.price.toFixed(2)}`}
                  </td>
                  <td className="px-5 py-3.5 text-right text-neutral-500">
                    {new Date(item.enrolledAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;
