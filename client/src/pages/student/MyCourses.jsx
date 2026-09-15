import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyEnrollments } from '../../features/enrollment/enrollmentSlice';

export const MyCourses = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { myEnrollments, isLoading, error } = useSelector((state) => state.enrollment);
  const { user } = useSelector((state) => state.auth);

  const [filter, setFilter] = useState('all'); // 'all' | 'in-progress' | 'completed'
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchMyEnrollments());
  }, [dispatch]);

  const filteredEnrollments = myEnrollments.filter((item) => {
    if (!item.course) return false;
    const titleMatch = item.course.title?.toLowerCase().includes(search.toLowerCase());
    const instructorMatch = item.course.instructor?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesSearch = titleMatch || instructorMatch;

    if (!matchesSearch) return false;

    if (filter === 'in-progress') return !item.completed;
    if (filter === 'completed') return item.completed;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">My Enrolled Courses</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Track your ongoing progress, continue watching where you left off, and review completed tracks.
          </p>
        </div>
        <Link
          to="/courses"
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors shrink-0"
        >
          <span>Explore Catalog</span>
          <span>→</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-neutral-200 rounded-lg shadow-sm">
        {/* Tab Filters */}
        <div className="flex items-center space-x-1 w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-primary-50 text-primary-700'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            All Courses ({myEnrollments.length})
          </button>
          <button
            onClick={() => setFilter('in-progress')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              filter === 'in-progress'
                ? 'bg-primary-50 text-primary-700'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            In Progress ({myEnrollments.filter((e) => !e.completed).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              filter === 'completed'
                ? 'bg-primary-50 text-primary-700'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            Completed ({myEnrollments.filter((e) => e.completed).length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search enrolled courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs py-1.5 pl-8 pr-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <svg
            className="w-4 h-4 text-neutral-400 absolute left-2.5 top-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-500">Loading your enrolled courses...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredEnrollments.length === 0 && (
        <div className="bg-white border border-neutral-200 rounded-lg p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-neutral-900">No Courses Found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {search
              ? `No enrolled courses match your search "${search}".`
              : filter === 'completed'
              ? "You haven't completed any courses yet. Keep learning!"
              : "You haven't enrolled in any courses yet. Browse the catalog to begin learning."}
          </p>
          <Link
            to="/courses"
            className="inline-block mt-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
          >
            Browse Course Catalog
          </Link>
        </div>
      )}

      {/* Course Cards Grid */}
      {!isLoading && filteredEnrollments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEnrollments.map((item) => {
            const course = item.course;
            const progress = item.progress || 0;
            const isFinished = item.completed || progress === 100;
            const total = item.totalLessons || 0;
            const completedLessons = item.completedLessons?.length || 0;

            const playerUrl = item.lastAccessedLesson
              ? `/courses/${course._id}/learn?lessonId=${
                  typeof item.lastAccessedLesson === 'object'
                    ? item.lastAccessedLesson._id
                    : item.lastAccessedLesson
                }`
              : `/courses/${course._id}/learn`;

            return (
              <div
                key={item._id}
                className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm flex flex-col hover:border-neutral-300 transition-shadow"
              >
                {/* Course Thumbnail */}
                <div className="relative aspect-[16/9] w-full bg-neutral-100 overflow-hidden">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src =
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60';
                    }}
                  />
                  {/* Status Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    {isFinished ? (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 backdrop-blur-xs px-2 py-0.5 rounded shadow-xs border border-emerald-300">
                        ✓ Completed
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-primary-800 bg-primary-100/90 backdrop-blur-xs px-2 py-0.5 rounded shadow-xs border border-primary-200">
                        In Progress
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    {/* Category */}
                    <span className="text-[10px] font-semibold text-primary-700 uppercase tracking-wider">
                      {course.category?.name || 'General'}
                    </span>

                    {/* Course Title */}
                    <h3 className="text-sm font-bold text-neutral-900 leading-snug line-clamp-2">
                      {course.title}
                    </h3>

                    {/* Instructor */}
                    <div className="flex items-center space-x-2 pt-1">
                      <img
                        src={
                          course.instructor?.avatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                        }
                        alt={course.instructor?.name || 'Instructor'}
                        className="w-5 h-5 rounded-full object-cover border border-neutral-200 shrink-0"
                      />
                      <span className="text-xs text-neutral-600 truncate">
                        {course.instructor?.name || 'Instructor'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="space-y-2 pt-2 border-t border-neutral-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-800">
                        {progress}% Complete
                      </span>
                      {total > 0 && (
                        <span className="text-neutral-500 text-[11px]">
                          {completedLessons} of {total} lessons
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isFinished ? 'bg-emerald-500' : 'bg-primary-600'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      <Link
                        to={playerUrl}
                        className={`w-full py-2 px-3 rounded-md text-xs font-bold text-center block transition-colors shadow-xs ${
                          isFinished
                            ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                            : 'bg-primary-600 hover:bg-primary-700 text-white'
                        }`}
                      >
                        {isFinished ? 'Review Course Track' : 'Continue Learning →'}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyCourses;
