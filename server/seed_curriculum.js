import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'node:dns';
import Course from './models/Course.js';
import Section from './models/Section.js';
import Lesson from './models/Lesson.js';

dotenv.config();

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

const seedCurriculum = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('[Seed Curriculum] Connecting to MongoDB...');
    await mongoose.connect(uri, { family: 4, serverSelectionTimeoutMS: 8000 });
    console.log('[Seed Curriculum] Connected.');

    const course = await Course.findOne({ title: 'Full-Stack React & Node.js Architecture' });
    if (!course) {
      console.log('[Seed Curriculum] Target course not found. Exiting.');
      process.exit(1);
    }

    // Clean existing sections & lessons for this course to avoid duplicate buildup
    const existingSections = await Section.find({ course: course._id });
    const existingSectionIds = existingSections.map((s) => s._id);
    await Lesson.deleteMany({ section: { $in: existingSectionIds } });
    await Section.deleteMany({ course: course._id });

    console.log('[Seed Curriculum] Seeding Sections & Lessons...');

    // Section 1
    const sec1 = await Section.create({
      title: 'Module 1: Modern Full-Stack Foundations',
      course: course._id,
      order: 1,
    });

    await Lesson.create([
      {
        title: 'Architectural Overview: Micro-frontends & Monoliths',
        description: 'Comprehensive breakdown of modern web architectures, decoupled client-server models, and state flows.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: 18,
        section: sec1._id,
        order: 1,
        isPreview: true,
        resources: ['System Architecture Cheatsheet PDF', 'Starter Git Repository'],
      },
      {
        title: 'Configuring Vite, React 19, and Tailwind CSS',
        description: 'Setting up an enterprise developer experience with ESLint, Prettier, PostCSS, and dynamic path aliases.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        duration: 24,
        section: sec1._id,
        order: 2,
        isPreview: false,
        resources: ['Vite Configuration Template'],
      },
      {
        title: 'State Synchronization with Redux Toolkit',
        description: 'Writing maintainable async thunks, normalized slice reducers, and custom selectors.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        duration: 32,
        section: sec1._id,
        order: 3,
        isPreview: false,
        resources: ['Redux Best Practices Guide'],
      },
    ]);

    // Section 2
    const sec2 = await Section.create({
      title: 'Module 2: Enterprise Express & MongoDB Mastery',
      course: course._id,
      order: 2,
    });

    await Lesson.create([
      {
        title: 'Designing Scalable RESTful API Architectures',
        description: 'Controller-service patterns, request sanitization, response standardization, and centralized error handling.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        duration: 28,
        section: sec2._id,
        order: 1,
        isPreview: true,
        resources: ['API Design Blueprint'],
      },
      {
        title: 'Mongoose Schema Modeling & Validation Hooks',
        description: 'Pre-save middleware, compound indexes, virtual populate fields, and transactions.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        duration: 35,
        section: sec2._id,
        order: 2,
        isPreview: false,
        resources: ['Mongoose Schemas Reference'],
      },
      {
        title: 'JWT Authentication & Role-Based Access Control',
        description: 'Cryptographic token generation, security headers, role authorization guards, and password hashing.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
        duration: 42,
        section: sec2._id,
        order: 3,
        isPreview: false,
        resources: ['Security Checklist for Production Node APIs'],
      },
    ]);

    // Section 3
    const sec3 = await Section.create({
      title: 'Module 3: Cloud Deployment & Production Hardening',
      course: course._id,
      order: 3,
    });

    await Lesson.create([
      {
        title: 'Containerizing MERN Applications with Docker',
        description: 'Multi-stage Docker builds, compose files, and optimizing container layer caches.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        duration: 25,
        section: sec3._id,
        order: 1,
        isPreview: false,
        resources: ['Dockerfile & docker-compose.yml'],
      },
      {
        title: 'CI/CD Deployment Pipelines and Zero-Downtime Releases',
        description: 'GitHub Actions automation, automated health verification, and zero-downtime rolling updates.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        duration: 30,
        section: sec3._id,
        order: 2,
        isPreview: false,
        resources: ['GitHub Actions Workflow YAML'],
      },
    ]);

    const finalSecCount = await Section.countDocuments({ course: course._id });
    const finalLesCount = await Lesson.countDocuments({
      section: { $in: [sec1._id, sec2._id, sec3._id] },
    });

    console.log(`[Seed Curriculum] Seeded ${finalSecCount} sections with ${finalLesCount} total lessons successfully.`);
    process.exit(0);
  } catch (error) {
    console.error('[Seed Curriculum] Error:', error.message);
    process.exit(1);
  }
};

seedCurriculum();
