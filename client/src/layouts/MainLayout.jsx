import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-neutral-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-neutral-100 text-xs text-neutral-600">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded bg-primary-600 flex items-center justify-center text-white font-bold text-xs">
                  SN
                </span>
                <span className="font-bold text-sm text-neutral-900">SkillNest</span>
              </div>
              <p className="text-neutral-500 leading-relaxed">
                <span className="font-semibold text-neutral-700">Learn. Build. Grow.</span> Enterprise-grade Learning Management System engineered for modern developers, instructors, and teams.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900 mb-2.5">Explore</h4>
              <ul className="space-y-1.5 text-neutral-500">
                <li><a href="/courses" className="hover:text-primary-600 transition-colors">Course Catalog</a></li>
                <li><a href="/courses?price=free" className="hover:text-primary-600 transition-colors">Free Tutorials</a></li>
                <li><a href="/wishlist" className="hover:text-primary-600 transition-colors">Saved Wishlist</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900 mb-2.5">Portals</h4>
              <ul className="space-y-1.5 text-neutral-500">
                <li><a href="/dashboard/student" className="hover:text-primary-600 transition-colors">Student Dashboard</a></li>
                <li><a href="/dashboard/instructor" className="hover:text-primary-600 transition-colors">Instructor Console</a></li>
                <li><a href="/dashboard/admin" className="hover:text-primary-600 transition-colors">Admin Telemetry</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900 mb-2.5">System Status</h4>
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  All Systems Operational
                </span>
                <p className="text-[11px] text-neutral-400">
                  Cloud API • MongoDB Atlas • Razorpay Gateway
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row justify-between items-center text-xs text-neutral-400 gap-3">
            <p>© {new Date().getFullYear()} SkillNest LMS. All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <span>Production Ready</span>
              <span>•</span>
              <span>Secure JWT & RBAC</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
