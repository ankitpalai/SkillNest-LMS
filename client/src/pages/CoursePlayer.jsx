import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import api from '../services/api';
import {
  fetchCourseEnrollment,
  enrollInCourse,
  toggleLessonCompletion,
} from '../features/enrollment/enrollmentSlice';

export const CoursePlayer = () => {
  const { courseId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const {
    currentEnrollment,
    isEnrolledInCurrent: isEnrolled,
    isEnrolling,
  } = useSelector((state) => state.enrollment);

  const [curriculum, setCurriculum] = useState([]);
  const [course, setCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'resources' | 'notes'
  const [expandedSections, setExpandedSections] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Student Scratchpad Notes (Persisted per lesson in localStorage)
  const [noteContent, setNoteContent] = useState('');
  const [isNoteSaved, setIsNoteSaved] = useState(true);

  const videoRef = useRef(null);

  // 1. Fetch Curriculum and Enrollment Status
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch curriculum
        const currRes = await api.get(`/curriculum/course/${courseId}`);
        if (!isMounted) return;

        setCurriculum(currRes.data.sections || []);
        setCourse(currRes.data.course);

        // If user is authenticated, check enrollment
        if (isAuthenticated) {
          await dispatch(fetchCourseEnrollment(courseId)).unwrap();
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load course player');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (courseId) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [courseId, isAuthenticated, dispatch]);

  // 2. Select initial active lesson
  useEffect(() => {
    if (curriculum.length === 0) return;

    const allLessons = curriculum.flatMap((s) => s.lessons);
    if (allLessons.length === 0) return;

    const queryLessonId = searchParams.get('lessonId');
    let targetLesson = null;

    if (queryLessonId) {
      targetLesson = allLessons.find((l) => l._id === queryLessonId);
    }

    if (!targetLesson && currentEnrollment?.lastAccessedLesson) {
      const lastId =
        typeof currentEnrollment.lastAccessedLesson === 'object'
          ? currentEnrollment.lastAccessedLesson._id
          : currentEnrollment.lastAccessedLesson;
      targetLesson = allLessons.find((l) => l._id === lastId);
    }

    if (!targetLesson) {
      // Find first uncompleted lesson if enrolled, or simply first lesson
      if (currentEnrollment?.completedLessons) {
        const completedIds = new Set(
          currentEnrollment.completedLessons.map((l) => (typeof l === 'object' ? l._id : l))
        );
        targetLesson = allLessons.find((l) => !completedIds.has(l._id)) || allLessons[0];
      } else {
        targetLesson = allLessons[0];
      }
    }

    if (targetLesson) {
      setActiveLesson(targetLesson);

      // Auto expand the section holding target lesson
      const parentSection = curriculum.find((sec) =>
        sec.lessons.some((l) => l._id === targetLesson._id)
      );
      if (parentSection) {
        setExpandedSections((prev) => ({
          ...prev,
          [parentSection._id]: true,
        }));
      }
    }
  }, [curriculum, currentEnrollment, searchParams]);

  // 3. Load & sync personal notes for active lesson
  useEffect(() => {
    if (activeLesson) {
      const savedNote = localStorage.getItem(`lms_notes_${courseId}_${activeLesson._id}`) || '';
      setNoteContent(savedNote);
      setIsNoteSaved(true);
    }
  }, [courseId, activeLesson]);

  const handleNoteChange = (e) => {
    const text = e.target.value;
    setNoteContent(text);
    setIsNoteSaved(false);
    if (activeLesson) {
      localStorage.setItem(`lms_notes_${courseId}_${activeLesson._id}`, text);
      setIsNoteSaved(true);
    }
  };

  const handleClearNote = () => {
    if (activeLesson && window.confirm('Clear your personal notes for this lesson?')) {
      setNoteContent('');
      localStorage.removeItem(`lms_notes_${courseId}_${activeLesson._id}`);
      setIsNoteSaved(true);
    }
  };

  // Helper checks
  const allLessons = curriculum.flatMap((s) => s.lessons);
  const totalLessons = allLessons.length;
  const completedLessonsSet = new Set(
    (currentEnrollment?.completedLessons || []).map((l) => (typeof l === 'object' ? l._id : l))
  );
  const completedCount = completedLessonsSet.size;
  const progressPercent = currentEnrollment?.progress ?? (totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0);
  const isCompleted = currentEnrollment?.completed || (totalLessons > 0 && completedCount >= totalLessons);

  const isLessonCompleted = (lessonId) => completedLessonsSet.has(lessonId);

  // Lesson navigation
  const currentIndex = allLessons.findIndex((l) => l._id === activeLesson?._id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const selectLesson = (lesson) => {
    setActiveLesson(lesson);
    setSearchParams({ lessonId: lesson._id });

    const parentSection = curriculum.find((sec) =>
      sec.lessons.some((l) => l._id === lesson._id)
    );
    if (parentSection) {
      setExpandedSections((prev) => ({
        ...prev,
        [parentSection._id]: true,
      }));
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Toggle completion
  const handleToggleCompletion = async (lessonId = activeLesson?._id) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isEnrolled) {
      return;
    }
    try {
      await dispatch(
        toggleLessonCompletion({
          courseId,
          lessonId,
        })
      ).unwrap();
    } catch (err) {
      console.error('Failed to toggle completion:', err);
    }
  };

  // Handle Enrollment
  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await dispatch(enrollInCourse(courseId)).unwrap();
      // Reload curriculum to unlock protected lessons
      const currRes = await api.get(`/curriculum/course/${courseId}`);
      setCurriculum(currRes.data.sections || []);
    } catch (err) {
      console.error('Enrollment error:', err);
    }
  };

  // Auto-advance prompt on video end
  const handleVideoEnded = () => {
    if (activeLesson && isEnrolled && !isLessonCompleted(activeLesson._id)) {
      handleToggleCompletion(activeLesson._id);
    }
    if (nextLesson && (!nextLesson.isLocked || isEnrolled)) {
      selectLesson(nextLesson);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-neutral-600">Loading course player...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-neutral-900">Unable to Load Course</h2>
        <p className="text-sm text-neutral-500">{error || 'Course could not be loaded.'}</p>
        <Link
          to={`/courses/${courseId}`}
          className="inline-block px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
        >
          ← Back to Course Details
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Bar / Header */}
      <div className="bg-white border border-neutral-200 rounded-lg px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3 overflow-hidden">
          <Link
            to={`/courses/${courseId}`}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors shrink-0"
            title="Back to Course Details"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div className="truncate">
            <h1 className="text-sm sm:text-base font-bold text-neutral-900 truncate">
              {course.title}
            </h1>
            <p className="text-xs text-neutral-500 truncate">
              {activeLesson ? activeLesson.title : 'Select a lesson to begin'}
            </p>
          </div>
        </div>

        {/* Progress & Sidebar Toggle */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-100">
          {/* Progress Indicator */}
          {isEnrolled && (
            <div className="flex items-center space-x-2.5">
              <div className="text-right">
                <span className="text-xs font-semibold text-neutral-900">
                  {progressPercent}%
                </span>
                <span className="text-[11px] text-neutral-500 ml-1">
                  ({completedCount}/{totalLessons})
                </span>
              </div>
              <div className="w-24 sm:w-32 h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isCompleted ? 'bg-emerald-500' : 'bg-primary-600'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {isCompleted && (
                <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold shrink-0">
                  ✓ Finished
                </span>
              )}
            </div>
          )}

          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors flex items-center space-x-1.5 ${
              sidebarOpen
                ? 'bg-primary-50 text-primary-700 border-primary-200'
                : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span>{sidebarOpen ? 'Hide Curriculum' : 'Show Curriculum'}</span>
          </button>
        </div>
      </div>

      {/* 100% Course Completion Celebration Banner */}
      {isCompleted && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 sm:p-4 flex items-center justify-between text-emerald-800 text-xs sm:text-sm">
          <div className="flex items-center space-x-2.5">
            <span className="text-lg">🎉</span>
            <div>
              <span className="font-bold">Congratulations!</span> You have completed all {totalLessons} lessons in this course!
            </div>
          </div>
          <Link
            to="/dashboard/student"
            className="shrink-0 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-xs transition-colors"
          >
            View Dashboard
          </Link>
        </div>
      )}

      {/* Main Grid: Player Area + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Left Area: Video Player + Actions + Tabs (Cols 7 or 8 when sidebar open, 12 when closed) */}
        <div className={sidebarOpen ? 'lg:col-span-8 space-y-4' : 'lg:col-span-12 space-y-4'}>
          {/* Video Container */}
          <div className="bg-black rounded-lg overflow-hidden shadow-sm aspect-[16/9] relative flex items-center justify-center">
            {activeLesson ? (
              activeLesson.isLocked && !isEnrolled ? (
                /* Protected Lesson Gatekeeper Overlay */
                <div className="p-6 text-center max-w-md space-y-4 text-white">
                  <div className="w-12 h-12 rounded-full bg-neutral-800/90 text-amber-400 flex items-center justify-center mx-auto border border-neutral-700">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Protected Course Lesson</h3>
                    <p className="text-xs text-neutral-300 mt-1">
                      This lesson is part of the full curriculum. Enroll in the course to unlock all protected video modules, code resources, and progress tracking.
                    </p>
                  </div>
                  <button
                    onClick={handleEnroll}
                    disabled={isEnrolling}
                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-md shadow-md transition-colors inline-flex items-center space-x-2"
                  >
                    <span>{isEnrolling ? 'Enrolling...' : 'Enroll in Course to Unlock'}</span>
                    <span>→</span>
                  </button>
                </div>
              ) : (
                /* Active Video Player */
                <video
                  ref={videoRef}
                  key={activeLesson._id}
                  src={
                    activeLesson.videoUrl ||
                    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
                  }
                  controls
                  autoPlay={false}
                  onEnded={handleVideoEnded}
                  className="w-full h-full object-contain"
                  poster={course.thumbnail}
                >
                  Your browser does not support HTML5 video streaming.
                </video>
              )
            ) : (
              <div className="text-neutral-400 text-xs">No active lesson selected.</div>
            )}
          </div>

          {/* Lesson Action Bar */}
          {activeLesson && (
            <div className="bg-white border border-neutral-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                    Lesson {activeLesson.order}
                  </span>
                  {activeLesson.duration > 0 && (
                    <span className="text-xs text-neutral-500">
                      {activeLesson.duration} mins
                    </span>
                  )}
                  {activeLesson.isPreview && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Free Preview
                    </span>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900">
                  {activeLesson.title}
                </h2>
              </div>

              {/* Action Buttons: Mark Complete & Nav */}
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                {/* Navigation: Prev / Next */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => prevLesson && selectLesson(prevLesson)}
                    disabled={!prevLesson}
                    className="p-2 border border-neutral-300 rounded-md text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Previous Lesson"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => nextLesson && selectLesson(nextLesson)}
                    disabled={!nextLesson}
                    className="p-2 border border-neutral-300 rounded-md text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Next Lesson"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Mark as Complete Toggle */}
                {isEnrolled ? (
                  <button
                    onClick={() => handleToggleCompletion(activeLesson._id)}
                    className={`px-3.5 py-2 text-xs font-bold rounded-md transition-colors flex items-center space-x-1.5 shrink-0 ${
                      isLessonCompleted(activeLesson._id)
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-primary-600 hover:bg-primary-700 text-white'
                    }`}
                  >
                    {isLessonCompleted(activeLesson._id) ? (
                      <>
                        <span>✓ Completed</span>
                      </>
                    ) : (
                      <>
                        <span>Mark as Complete</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={isEnrolling}
                    className="px-3.5 py-2 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors shrink-0"
                  >
                    Enroll to Track
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Below Video Tabbed Section: Overview, Resources, Notes */}
          <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
            {/* Tabs Header */}
            <div className="flex border-b border-neutral-200 bg-neutral-50/50">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
                  activeTab === 'overview'
                    ? 'border-primary-600 text-primary-700 bg-white'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('resources')}
                className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
                  activeTab === 'resources'
                    ? 'border-primary-600 text-primary-700 bg-white'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Resources</span>
                {activeLesson?.resources?.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-neutral-200 text-neutral-700 rounded-full text-[10px]">
                    {activeLesson.resources.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('notes')}
                className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
                  activeTab === 'notes'
                    ? 'border-primary-600 text-primary-700 bg-white'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Personal Notes</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-5">
              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">About This Lesson</h3>
                    <p className="text-xs sm:text-sm text-neutral-600 mt-1 leading-relaxed">
                      {activeLesson?.description ||
                        'In this lesson module, we analyze real-world architecture, dive deep into hands-on code examples, and establish foundational engineering best practices.'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-neutral-600">
                    <div>
                      <span className="font-semibold text-neutral-800">Instructor:</span>{' '}
                      {course?.instructor?.name || 'Faculty Member'}
                    </div>
                    <div>
                      <span className="font-semibold text-neutral-800">Estimated Duration:</span>{' '}
                      {activeLesson?.duration || 15} minutes
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Resources */}
              {activeTab === 'resources' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-neutral-900">Downloadable Lesson Materials</h3>
                  {activeLesson?.resources && activeLesson.resources.length > 0 ? (
                    <div className="space-y-2">
                      {activeLesson.resources.map((res, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200 rounded-md text-xs text-neutral-700 hover:bg-neutral-100 transition-colors"
                        >
                          <div className="flex items-center space-x-2.5 truncate">
                            <svg className="w-4 h-4 text-primary-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium truncate">{res}</span>
                          </div>
                          <a
                            href="#download"
                            onClick={(e) => {
                              e.preventDefault();
                              alert(`Simulating download for: ${res}`);
                            }}
                            className="text-xs text-primary-600 font-semibold hover:underline shrink-0 ml-3"
                          >
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-neutral-500 py-4 text-center bg-neutral-50 rounded-md border border-dashed border-neutral-200">
                      No additional downloadable files attached to this specific lesson module.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Notes Scratchpad */}
              {activeTab === 'notes' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900">Personal Lesson Scratchpad</h3>
                      <p className="text-xs text-neutral-500">
                        Notes are automatically saved locally on this browser for this lesson.
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-neutral-400">
                        {isNoteSaved ? '✓ Auto-saved' : 'Saving...'}
                      </span>
                      {noteContent && (
                        <button
                          onClick={handleClearNote}
                          className="text-[11px] text-red-600 hover:text-red-700 font-medium"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <textarea
                    value={noteContent}
                    onChange={handleNoteChange}
                    placeholder="Take notes as you watch this lesson..."
                    rows={6}
                    className="w-full text-xs font-mono p-3 border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 leading-relaxed text-neutral-800"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Course Curriculum (Sections & Lessons) */}
        {sidebarOpen && (
          <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden sticky top-20">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Course Content</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {curriculum.length} sections • {totalLessons} lessons
                </p>
              </div>
              <span className="text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 px-2 py-0.5 rounded">
                {completedCount}/{totalLessons} done
              </span>
            </div>

            {/* Curriculum Accordion List */}
            <div className="divide-y divide-neutral-200 max-h-[calc(100vh-240px)] overflow-y-auto">
              {curriculum.map((section, sIdx) => {
                const isExpanded = Boolean(expandedSections[section._id]);
                const sectionLessons = section.lessons || [];
                const secCompletedCount = sectionLessons.filter((l) =>
                  isLessonCompleted(l._id)
                ).length;

                return (
                  <div key={section._id} className="bg-white">
                    {/* Section Header Button */}
                    <button
                      onClick={() => toggleSection(section._id)}
                      className="w-full text-left p-3.5 flex items-center justify-between bg-neutral-50/70 hover:bg-neutral-100/70 transition-colors"
                    >
                      <div className="truncate pr-2">
                        <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                          Section {sIdx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-neutral-900 truncate">
                          {section.title}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-[11px] text-neutral-500">
                          {secCompletedCount}/{sectionLessons.length}
                        </span>
                        <svg
                          className={`w-4 h-4 text-neutral-400 transform transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Section Lessons List */}
                    {isExpanded && (
                      <div className="divide-y divide-neutral-100">
                        {sectionLessons.map((lesson) => {
                          const isCurrent = activeLesson?._id === lesson._id;
                          const completed = isLessonCompleted(lesson._id);
                          const locked = lesson.isLocked && !isEnrolled;

                          return (
                            <div
                              key={lesson._id}
                              onClick={() => selectLesson(lesson)}
                              className={`p-3 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                                isCurrent
                                  ? 'bg-primary-50/80 border-l-4 border-primary-600 pl-2.5'
                                  : 'hover:bg-neutral-50'
                              }`}
                            >
                              {/* Left: Status Checkbox & Title */}
                              <div className="flex items-center space-x-2.5 truncate pr-2">
                                {/* Completion Indicator / Checkbox */}
                                {isEnrolled ? (
                                  <input
                                    type="checkbox"
                                    checked={completed}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleToggleCompletion(lesson._id);
                                    }}
                                    className="w-4 h-4 text-emerald-600 rounded border-neutral-300 focus:ring-emerald-500 cursor-pointer shrink-0"
                                    title="Mark complete"
                                  />
                                ) : (
                                  <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                                    {locked ? (
                                      <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                      </svg>
                                    ) : (
                                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    )}
                                  </div>
                                )}

                                <div className="truncate">
                                  <span
                                    className={`truncate block ${
                                      isCurrent
                                        ? 'font-bold text-primary-900'
                                        : completed
                                        ? 'text-neutral-500 line-through'
                                        : 'text-neutral-800'
                                    }`}
                                  >
                                    {lesson.title}
                                  </span>
                                  <span className="text-[10px] text-neutral-400">
                                    {lesson.duration || 15}m
                                  </span>
                                </div>
                              </div>

                              {/* Right: Badges */}
                              <div className="shrink-0 flex items-center space-x-1.5">
                                {lesson.isPreview && (
                                  <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded">
                                    Preview
                                  </span>
                                )}
                                {locked && (
                                  <span className="text-[9px] font-medium text-neutral-500 bg-neutral-100 px-1 py-0.2 rounded">
                                    Locked
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursePlayer;
