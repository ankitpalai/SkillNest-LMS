import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyEnrollments } from '../features/enrollment/enrollmentSlice';

export const StudentDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { myEnrollments, isLoading } = useSelector((state) => state.enrollment);

  useEffect(() => {
    dispatch(fetchMyEnrollments());
  }, [dispatch]);

  // Derived metrics
  const totalEnrolled = myEnrollments.length;
  const inProgressCourses = myEnrollments.filter((e) => !e.completed && (e.progress || 0) < 100);
  const completedCourses = myEnrollments.filter((e) => e.completed || (e.progress || 0) === 100);
  const totalCompletedLessons = myEnrollments.reduce(
    (acc, curr) => acc + (curr.completedLessons?.length || 0),
    0
  );

  // Spotlight course: Most recently accessed or first in-progress course
  const continueLearningCourse =
    inProgressCourses.length > 0 ? inProgressCourses[0] : myEnrollments[0] || null;

  const continuePlayerUrl = continueLearningCourse
    ? continueLearningCourse.lastAccessedLesson
      ? `/courses/${continueLearningCourse.course?._id}/learn?lessonId=${
          typeof continueLearningCourse.lastAccessedLesson === 'object'
            ? continueLearningCourse.lastAccessedLesson._id
            : continueLearningCourse.lastAccessedLesson
        }`
      : `/courses/${continueLearningCourse.course?._id}/learn`
    : '/courses';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Welcome back, {user?.name || 'Student'}! 👋
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Pick up right where you left off and advance through your enrolled learning tracks.
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <Link
            to="/my-courses"
            className="px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-md transition-colors"
          >
            My Courses
          </Link>
          <Link
            to="/courses"
            className="px-3.5 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors shadow-sm"
          >
            Explore Catalog
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-neutral-500">Enrolled Courses</p>
            <span className="p-1 bg-primary-50 text-primary-600 rounded">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </span>
          </div>
          <p className="text-2xl font-bold text-neutral-900 mt-2">{totalEnrolled}</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-neutral-500">In Progress</p>
            <span className="p-1 bg-blue-50 text-blue-600 rounded">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <p className="text-2xl font-bold text-neutral-900 mt-2">{inProgressCourses.length}</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-neutral-500">Completed Courses</p>
            <span className="p-1 bg-emerald-50 text-emerald-600 rounded">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <p className="text-2xl font-bold text-neutral-900 mt-2">{completedCourses.length}</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-neutral-500">Lessons Completed</p>
            <span className="p-1 bg-purple-50 text-purple-600 rounded">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </div>
          <p className="text-2xl font-bold text-neutral-900 mt-2">{totalCompletedLessons}</p>
        </div>
      </div>

      {/* Continue Learning Spotlight Hero Card */}
      {continueLearningCourse && continueLearningCourse.course && (
        <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 rounded-xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            {/* Left Info */}
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary-600 text-white">
                  Continue Learning
                </span>
                <span className="text-xs text-neutral-300">
                  {continueLearningCourse.course.category?.name || 'Curriculum'}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                {continueLearningCourse.course.title}
              </h2>

              {continueLearningCourse.lastAccessedLesson && (
                <p className="text-xs text-neutral-300 flex items-center space-x-1.5">
                  <svg className="w-3.5 h-3.5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                  <span>
                    Current lesson:{' '}
                    <strong className="text-white">
                      {typeof continueLearningCourse.lastAccessedLesson === 'object'
                        ? continueLearningCourse.lastAccessedLesson.title
                        : 'Active Lesson'}
                    </strong>
                  </span>
                </p>
              )}

              {/* Progress bar in hero */}
              <div className="space-y-1.5 max-w-md pt-1">
                <div className="flex justify-between text-xs text-neutral-300">
                  <span>Track Progress</span>
                  <span className="font-semibold text-white">
                    {continueLearningCourse.progress || 0}% Complete
                  </span>
                </div>
                <div className="w-full h-2 bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-300"
                    style={{ width: `${continueLearningCourse.progress || 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Right Action */}
            <div className="shrink-0 w-full md:w-auto">
              <Link
                to={continuePlayerUrl}
                className="w-full md:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white text-xs sm:text-sm font-bold rounded-lg shadow-lg transition-colors"
              >
                <span>Resume Lesson</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Recently Enrolled Courses (with progress) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-900">
            Recently Enrolled & In-Progress Tracks
          </h2>
          {myEnrollments.length > 0 && (
            <Link
              to="/my-courses"
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              View All ({myEnrollments.length}) →
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-neutral-500">
            Loading course dashboard...
          </div>
        ) : myEnrollments.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center space-y-3">
            <p className="text-sm font-medium text-neutral-700">You haven't enrolled in any courses yet.</p>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              Explore our catalogue of full-stack engineering, cloud architecture, and data science courses to start learning.
            </p>
            <Link
              to="/courses"
              className="inline-block mt-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
            >
              Explore Course Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myEnrollments.slice(0, 6).map((item) => {
              const course = item.course;
              if (!course) return null;
              const progress = item.progress || 0;
              const isFinished = item.completed || progress === 100;
              const completedCount = item.completedLessons?.length || 0;
              const total = item.totalLessons || 0;

              const url = item.lastAccessedLesson
                ? `/courses/${course._id}/learn?lessonId=${
                    typeof item.lastAccessedLesson === 'object'
                      ? item.lastAccessedLesson._id
                      : item.lastAccessedLesson
                  }`
                : `/courses/${course._id}/learn`;

              return (
                <div
                  key={item._id}
                  className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm hover:border-neutral-300 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex space-x-3 items-start">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-16 h-16 rounded-md object-cover border border-neutral-200 shrink-0"
                    />
                    <div className="truncate space-y-1">
                      <span className="text-[10px] font-semibold text-primary-600 uppercase tracking-wider block">
                        {course.category?.name || 'Course'}
                      </span>
                      <h3 className="text-xs font-bold text-neutral-900 truncate" title={course.title}>
                        {course.title}
                      </h3>
                      <p className="text-[11px] text-neutral-500 truncate">
                        By {course.instructor?.name || 'Instructor'}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                    <div className="flex justify-between text-[11px] text-neutral-600">
                      <span>{progress}% Complete</span>
                      {total > 0 && (
                        <span className="text-neutral-400">
                          {completedCount}/{total} lessons
                        </span>
                      )}
                    </div>
                    <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isFinished ? 'bg-emerald-500' : 'bg-primary-600'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Continue Button */}
                  <Link
                    to={url}
                    className={`w-full py-1.5 px-3 rounded text-xs font-semibold text-center block transition-colors ${
                      isFinished
                        ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                        : 'bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200'
                    }`}
                  >
                    {isFinished ? 'Review Track' : 'Continue Learning →'}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Courses Showcase Section */}
      {completedCourses.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center space-x-2">
              <span className="text-emerald-600 font-bold text-lg">🏆</span>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Completed Courses</h3>
                <p className="text-xs text-neutral-500">
                  Congratulations on finishing these curriculums. You have earned full completion status.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              {completedCourses.length} Completed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {completedCourses.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between p-3 bg-emerald-50/50 border border-emerald-200 rounded-md text-xs"
              >
                <div className="flex items-center space-x-3 truncate pr-2">
                  <img
                    src={item.course?.thumbnail}
                    alt={item.course?.title}
                    className="w-10 h-10 rounded object-cover border border-emerald-200 shrink-0"
                  />
                  <div className="truncate">
                    <h4 className="font-bold text-neutral-900 truncate">
                      {item.course?.title}
                    </h4>
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      ✓ 100% Finished • Full Completion
                    </span>
                  </div>
                </div>
                <Link
                  to={`/courses/${item.course?._id}/learn`}
                  className="px-3 py-1 bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-700 font-semibold rounded text-xs shrink-0 transition-colors"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
