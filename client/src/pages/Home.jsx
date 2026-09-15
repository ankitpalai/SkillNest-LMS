import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCourses, fetchCategories } from '../features/courses/courseSlice';
import CourseCard from '../components/CourseCard';
import { checkHealth } from '../services/api';

export const Home = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { courses, categories, isLoading } = useSelector((state) => state.courses);

  const [healthData, setHealthData] = useState(null);
  const [apiConnected, setApiConnected] = useState(true);

  useEffect(() => {
    checkHealth()
      .then((data) => {
        setHealthData(data);
        setApiConnected(data.success);
      })
      .catch(() => {
        setApiConnected(false);
      });

    dispatch(fetchCategories());
    dispatch(fetchCourses({ page: 1, limit: 3, sort: 'popular' }));
  }, [dispatch]);

  const valueProps = [
    {
      icon: (
        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Structured Video Curriculum',
      description: 'Step-by-step modular lessons with video playback, preview lectures, and notes.',
    },
    {
      icon: (
        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Real-Time Progress Tracking',
      description: 'Track lesson completions, overall progress percentage, and access last viewed modules.',
    },
    {
      icon: (
        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Instant Razorpay Checkout',
      description: 'Secure payment gateway with HMAC SHA256 cryptographic verification and instant activation.',
    },
    {
      icon: (
        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      title: 'Instructor Curriculum Studio',
      description: 'Drag & drop curriculum management, lecture uploads, and detailed student enrollment metrics.',
    },
  ];

  return (
    <div className="space-y-12 pb-6">
      {/* Hero Section */}
      <section className="bg-white border border-neutral-200 rounded-xl p-8 sm:p-12 shadow-sm relative overflow-hidden">
        <div className="max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-100">
            <span className="w-2 h-2 rounded-full bg-primary-600"></span>
            Learn. Build. Grow. • Enterprise Learning Platform
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-neutral-900 tracking-tight leading-tight">
            Master Software Engineering, Cloud & System Design
          </h1>

          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed max-w-2xl">
            SkillNest delivers production-grade courses curated by industry practitioners.
            Learn through real-world projects, structured video lessons, and interactive assessments.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap gap-3.5 items-center">
            <Link
              to="/courses"
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center space-x-2"
            >
              <span>Explore Course Catalog</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>

            {!isAuthenticated ? (
              <Link
                to="/register"
                className="px-5 py-2.5 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-sm font-semibold rounded-lg transition-colors"
              >
                Create Free Account
              </Link>
            ) : (
              <Link
                to={
                  user?.role === 'admin'
                    ? '/dashboard/admin'
                    : user?.role === 'instructor'
                    ? '/dashboard/instructor'
                    : '/dashboard/student'
                }
                className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-sm font-semibold rounded-lg transition-colors"
              >
                Go to {user?.role === 'admin' ? 'Admin Panel' : user?.role === 'instructor' ? 'Instructor Portal' : 'My Dashboard'}
              </Link>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-6 border-t border-neutral-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div>
              <div className="text-xl font-bold text-neutral-900">4.9 ★</div>
              <div className="text-xs text-neutral-500 font-medium">Average Course Rating</div>
            </div>
            <div>
              <div className="text-xl font-bold text-neutral-900">100%</div>
              <div className="text-xs text-neutral-500 font-medium">Hands-On Projects</div>
            </div>
            <div>
              <div className="text-xl font-bold text-neutral-900">Instant</div>
              <div className="text-xs text-neutral-500 font-medium">Course Activation</div>
            </div>
            <div>
              <div className="text-xl font-bold text-neutral-900">24/7</div>
              <div className="text-xs text-neutral-500 font-medium">Self-Paced Learning</div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions / Features */}
      <section className="space-y-4">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-xs font-bold text-primary-600 uppercase tracking-wider">Built for Modern Learners</h2>
          <p className="text-2xl font-bold text-neutral-900">A Complete Learning Ecosystem</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {valueProps.map((prop, idx) => (
            <div
              key={idx}
              className="bg-white border border-neutral-200 rounded-lg p-5 space-y-2.5 hover:border-neutral-300 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                {prop.icon}
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">{prop.title}</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">{prop.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Courses Showcase */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xs font-bold text-primary-600 uppercase tracking-wider">Popular Offerings</h2>
            <p className="text-2xl font-bold text-neutral-900">Featured Courses</p>
          </div>
          <Link
            to="/courses"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center space-x-1"
          >
            <span>View all courses</span>
            <span>→</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-neutral-200 rounded-lg p-4 animate-pulse space-y-3">
                <div className="aspect-[16/9] bg-neutral-200 rounded" />
                <div className="h-4 bg-neutral-200 rounded w-3/4" />
                <div className="h-3 bg-neutral-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : courses && courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {courses.slice(0, 3).map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center text-xs text-neutral-500">
            No courses available yet. Browse catalog to explore all offerings.
          </div>
        )}
      </section>

      {/* Categories Bar */}
      {categories && categories.length > 0 && (
        <section className="bg-white border border-neutral-200 rounded-xl p-6 space-y-3">
          <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Explore Disciplines</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/courses?category=${cat._id}`}
                className="px-3 py-1.5 rounded-lg bg-neutral-50 hover:bg-primary-50 hover:text-primary-700 border border-neutral-200 text-xs font-medium text-neutral-700 transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Platform Portals Overview */}
      <section className="bg-white border border-neutral-200 rounded-xl p-6 sm:p-8 space-y-4">
        <div>
          <h3 className="text-xs font-bold text-primary-600 uppercase tracking-wider">Role-Based Architecture</h3>
          <p className="text-xl font-bold text-neutral-900 mt-0.5">Role-Tailored Workspaces</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2">
            <span className="font-semibold text-neutral-900 block text-sm">🎓 Student Workspace</span>
            <p className="text-neutral-500">
              Access enrolled lectures, interactive video player, bookmark favorites to wishlist, and write course reviews.
            </p>
            <Link to="/dashboard/student" className="text-primary-600 hover:underline font-semibold block pt-1">
              Student Dashboard →
            </Link>
          </div>

          <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2">
            <span className="font-semibold text-neutral-900 block text-sm">👨‍🏫 Instructor Console</span>
            <p className="text-neutral-500">
              Author rich courses, build ordered curriculum sections and lessons, upload video content, and monitor analytics.
            </p>
            <Link to="/dashboard/instructor" className="text-primary-600 hover:underline font-semibold block pt-1">
              Instructor Studio →
            </Link>
          </div>

          <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2">
            <span className="font-semibold text-neutral-900 block text-sm">🛡️ Admin Command Center</span>
            <p className="text-neutral-500">
              Global user RBAC role management, course publishing controls, revenue telemetry, and category taxonomy.
            </p>
            <Link to="/dashboard/admin" className="text-primary-600 hover:underline font-semibold block pt-1">
              Admin Console →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
