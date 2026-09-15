import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchInstructorCourses,
  toggleCourseStatus,
  deleteInstructorCourse,
} from '../../features/instructor/instructorSlice';

export const MyCourses = () => {
  const dispatch = useDispatch();
  const { courses, isLoading } = useSelector((state) => state.instructor);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteModalCourse, setDeleteModalCourse] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchInstructorCourses());
  }, [dispatch]);

  const handleToggleStatus = async (courseId) => {
    await dispatch(toggleCourseStatus(courseId));
  };

  const handleDelete = async () => {
    if (!deleteModalCourse) return;
    setActionLoading(true);
    await dispatch(deleteInstructorCourse(deleteModalCourse._id));
    setActionLoading(false);
    setDeleteModalCourse(null);
  };

  const filteredCourses = courses.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Link
              to="/dashboard/instructor"
              className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              ← Instructor Portal
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight mt-1">Course Management</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Manage your instructional content, syllabus modules, and publishing states.
          </p>
        </div>

        <Link
          to="/instructor/courses/new"
          className="px-4 py-2 text-xs font-semibold rounded-md text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <span>+</span>
          <span>Create New Course</span>
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-neutral-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search your courses..."
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-neutral-300 rounded-md bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <svg
            className="w-4 h-4 text-neutral-400 absolute left-3 top-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center space-x-2 text-xs self-start sm:self-auto">
          <span className="text-neutral-500 font-medium mr-1">Status:</span>
          {['all', 'published', 'draft'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-md font-medium capitalize transition-colors ${
                statusFilter === status
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Courses List Table */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Course Info</th>
                <th className="px-5 py-3.5">Category & Level</th>
                <th className="px-5 py-3.5">Price</th>
                <th className="px-5 py-3.5">Curriculum</th>
                <th className="px-5 py-3.5">Students</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white text-neutral-700">
              {filteredCourses.map((course) => (
                <tr key={course._id} className="hover:bg-neutral-50/50 transition-colors">
                  {/* Title & Thumbnail */}
                  <td className="px-5 py-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-12 h-8 object-cover rounded border border-neutral-200 flex-shrink-0"
                        onError={(e) => {
                          e.target.src =
                            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60';
                        }}
                      />
                      <div className="max-w-xs">
                        <p className="font-bold text-neutral-900 line-clamp-1">{course.title}</p>
                        <p className="text-[11px] text-neutral-400 line-clamp-1">{course.subtitle}</p>
                      </div>
                    </div>
                  </td>

                  {/* Category & Level */}
                  <td className="px-5 py-4">
                    <p className="font-medium text-neutral-800">{course.category?.name || 'General'}</p>
                    <span className="text-[11px] text-neutral-400 capitalize">{course.level}</span>
                  </td>

                  {/* Price */}
                  <td className="px-5 py-4 font-bold text-neutral-900">
                    {course.price === 0 ? <span className="text-emerald-600">Free</span> : `$${course.price.toFixed(2)}`}
                  </td>

                  {/* Curriculum */}
                  <td className="px-5 py-4">
                    <span className="font-semibold text-neutral-900">{course.sectionCount || 0}</span> sections
                    <br />
                    <span className="text-[11px] text-neutral-400">{course.lessonCount || 0} total lessons</span>
                  </td>

                  {/* Students */}
                  <td className="px-5 py-4 font-semibold text-neutral-900">
                    {(course.enrolledStudents || 0).toLocaleString()}
                  </td>

                  {/* Status & Toggle */}
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleToggleStatus(course._id)}
                      title="Click to toggle publish status"
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-wider border transition-colors cursor-pointer ${
                        course.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          course.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      <span>{course.status}</span>
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                    <Link
                      to={`/instructor/courses/${course._id}/curriculum`}
                      className="px-3 py-1 rounded text-xs font-semibold bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 transition-colors"
                    >
                      Curriculum
                    </Link>
                    <Link
                      to={`/instructor/courses/${course._id}/edit`}
                      className="px-3 py-1 rounded text-xs font-semibold bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => setDeleteModalCourse(course)}
                      className="px-2.5 py-1 rounded text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Course"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {filteredCourses.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-neutral-400">
                    No courses match your search or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalCourse && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-neutral-200 rounded-lg p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-neutral-900">Delete Course</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-neutral-900">"{deleteModalCourse.title}"</span>? All
              associated sections and lessons will be removed. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeleteModalCourse(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                {actionLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCourses;
