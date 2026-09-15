# 🎓 SkillNest LMS - Enterprise Learning Management System

SkillNest is a full-stack, enterprise-grade **Learning Management System (LMS)** built with the MERN stack (MongoDB, Express, React, Node.js), Redux Toolkit, and Tailwind CSS. It is engineered for students, instructors, and administrators with role-based access control, modular curriculum management, interactive video player, real-time progress tracking, ratings and reviews, cloud file uploads, transactional email notifications, and Razorpay payment integration.

---

## 🚀 Key Features

### 👨‍🎓 Student Experience
- **Interactive Course Catalog**: Instant keyword search, category filtering, difficulty level selection, price filters, and pagination.
- **Dedicated Video Player (`CoursePlayer`)**: Sequential curriculum sidebar, video player, lesson notes scratchpad, and downloadable attachments.
- **Progress Tracking**: Automatic progress percentage computation and lesson completion tracking.
- **Course Reviews & Ratings**: Submit 1-5 star ratings with detailed feedback (restricted to enrolled students, strictly 1 review per course).
- **Personal Wishlist**: Save courses for later and enroll directly.
- **Student Dashboard & Profile**: Overview of enrolled courses, in-progress lectures, and completion statistics.

### 👨‍🏫 Instructor Studio
- **Course Creator & Editor**: Full course metadata authoring with category tagging, pricing, prerequisites, and learning objectives.
- **Interactive Curriculum Studio**: Create, edit, reorder sections and lessons with drag/reorder controls.
- **Preview & Premium Flags**: Mark specific lessons as free previews while keeping core content locked for enrolled students.
- **Instructor Telemetry**: Real-time analytics on enrolled students, average course ratings, revenue, and enrollment history.

### 🛡️ Admin Command Center
- **System Telemetry**: Aggregated counts for total users, courses, revenue (via MongoDB aggregation), and enrollments.
- **User Management & RBAC**: Search, filter, inspect, and elevate user roles (`student`, `instructor`, `admin`) with self-demotion safety guards.
- **Course Moderation**: Publish, unpublish, and cascade-delete courses and related curriculum.
- **Taxonomy Management**: Create, update, and manage course categories with relational integrity protection.

### ⚙️ Platform Infrastructure
- **Secure Authentication**: JWT Bearer token lifecycle, bcrypt password hashing, and token-based password reset.
- **Media Uploads**: Multer memory storage and Cloudinary integration for profile avatars, thumbnails, and video assets.
- **Transactional Emails**: Nodemailer integration for Welcome emails, Password Reset links, Enrollment receipts, and Course Completion certificates.
- **Razorpay Payments**: Order generation and cryptographic HMAC SHA256 signature verification.
- **Optimized Performance**: Code-splitting via `React.lazy()` and `Suspense`, MongoDB indexed queries, and optimized payload sizes.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Redux Toolkit, React Router v6, Tailwind CSS, Axios |
| **Backend** | Node.js (ES Modules), Express.js 4, Mongoose ODM |
| **Database** | MongoDB Atlas (Cluster with Replica Sets & Indexes) |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, Crypto HMAC SHA256 |
| **File Storage** | Cloudinary v2 API with Multer streaming upload fallback |
| **Email Service** | Nodemailer (SMTP / Ethereal test integration) |
| **Payment Gateway** | Razorpay Node.js SDK & Checkout API |

---

## 📁 Folder Structure

```
LMS/
├── client/                     # Frontend Single Page Application
│   ├── src/
│   │   ├── components/         # Reusable UI (Navbar, CourseCard, ProtectedRoute, RoleRoute)
│   │   ├── features/           # Redux Toolkit Slices (auth, courses, enrollment, admin, etc.)
│   │   │   └── store.js        # Configured Redux Store
│   │   ├── layouts/            # MainLayout (Navigation & Responsive Footer)
│   │   ├── pages/              # Route Pages (Home, Courses, CourseDetails, CoursePlayer, Dashboards)
│   │   │   ├── instructor/     # Instructor-specific views (MyCourses, CourseForm, CurriculumBuilder)
│   │   │   └── student/        # Student-specific views (MyCourses)
│   │   ├── routes/             # AppRoutes with React.lazy code splitting
│   │   ├── services/           # Axios HTTP client with JWT interceptor
│   │   └── utils/              # Application constants and helpers
│   ├── vercel.json             # Vercel SPA routing rewrite config
│   └── package.json
│
├── server/                     # Backend REST API Server
│   ├── config/                 # Database (MongoDB connection) and Cloudinary configs
│   ├── controllers/            # Route controllers (auth, course, curriculum, admin, payment, etc.)
│   ├── middleware/             # authMiddleware, uploadMiddleware, errorHandler, notFound
│   ├── models/                 # Mongoose Data Schemas (User, Course, Section, Lesson, Review, etc.)
│   ├── routes/                 # Express API route declarations
│   ├── services/               # emailService (Nodemailer notification templates)
│   ├── utils/                  # Token generation and crypto utilities
│   ├── test_phase9_final.js    # Comprehensive end-to-end regression test suite
│   ├── app.js                  # Express application setup and CORS
│   ├── server.js               # Server entry point
│   └── package.json
└── README.md                   # Project Documentation
```

---

## 💻 Local Installation & Setup

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** or **yarn**
- **MongoDB** (Local instance or MongoDB Atlas Connection String)

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/skillnest-lms.git
cd skillnest-lms
```

### 3. Server Setup
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/lms_db?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
CLIENT_URL=http://localhost:5173

# Cloudinary (Optional / Mocked in dev)
CLOUDINARY_CLOUD_NAME=demo_cloud
CLOUDINARY_API_KEY=demo_key
CLOUDINARY_API_SECRET=demo_secret

# Email Service
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="SkillNest LMS" <noreply@skillnest.lms>

# Razorpay
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

Start the server:
```bash
npm run dev
```

### 4. Client Setup
Open a new terminal tab:
```bash
cd client
npm install
```

Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

Start the Vite development server:
```bash
npm run dev
```

The application will be accessible at `http://localhost:5173`.

---

## 📡 API Reference Overview

| Domain | Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- | :--- |
| **System** | `GET` | `/api/health` | Public | System status and connectivity check |
| **Auth** | `POST` | `/api/auth/register` | Public | Register new student account |
| **Auth** | `POST` | `/api/auth/login` | Public | Authenticate user & return JWT |
| **Auth** | `POST` | `/api/auth/forgot-password` | Public | Send password reset email token |
| **Auth** | `POST` | `/api/auth/reset-password/:token` | Public | Reset password using valid token |
| **Courses** | `GET` | `/api/courses` | Public | Filterable, searchable course catalog |
| **Courses** | `GET` | `/api/courses/:id` | Public | Detailed course metadata |
| **Courses** | `POST` | `/api/courses` | Instructor/Admin | Create a new course |
| **Curriculum** | `GET` | `/api/curriculum/course/:id` | Public/Auth | Retrieve curriculum (unlocked for enrolled) |
| **Curriculum** | `POST` | `/api/curriculum/course/:id/sections` | Instructor/Admin | Add new section |
| **Curriculum** | `POST` | `/api/curriculum/sections/:id/lessons` | Instructor/Admin | Add lesson to section |
| **Enrollments** | `GET` | `/api/enrollments/:courseId` | Private | Check enrollment status & progress |
| **Enrollments** | `PATCH` | `/api/enrollments/:courseId/lessons/:lessonId` | Private | Toggle lesson completion state |
| **Reviews** | `POST` | `/api/reviews` | Enrolled Student | Submit 1-5 star course review |
| **Wishlist** | `POST` | `/api/wishlist/:courseId` | Private | Toggle course saved in wishlist |
| **Payments** | `POST` | `/api/payments/create-order` | Private | Create Razorpay payment order |
| **Payments** | `POST` | `/api/payments/verify-payment` | Private | Cryptographically verify HMAC SHA256 payment |
| **Admin** | `GET` | `/api/admin/stats` | Admin Only | System telemetry & revenue aggregation |
| **Admin** | `PATCH` | `/api/admin/users/:id/role` | Admin Only | Change user role (`student`/`instructor`/`admin`) |

---

## 🖼️ Application Screenshots

### 1. Course Catalog & Filters
*(Placeholder for catalog screenshot showing search, level, price, and category filters)*

### 2. Interactive Video Learning Player
*(Placeholder for CoursePlayer screenshot showing curriculum sidebar, video player, and notes scratchpad)*

### 3. Instructor Curriculum Studio
*(Placeholder for curriculum builder showing sections, preview toggle, and lesson management)*

### 4. Admin Command Center
*(Placeholder for Admin telemetry dashboard and user management)*

---

## 🚢 Production Deployment Guide

### Deploy Frontend (Vercel)
1. Push your repository to GitHub.
2. Link the repository on [Vercel](https://vercel.com).
3. Set the **Root Directory** to `client`.
4. Configure the Environment Variable:
   - `VITE_API_URL`: `https://your-backend-service.onrender.com/api`
5. Deploy. The `vercel.json` rewrite file handles client-side SPA routing automatically.

### Deploy Backend (Render / Railway)
1. Link the repository on [Render](https://render.com) or [Railway](https://railway.app).
2. Set the **Root Directory** to `server`.
3. Set the **Build Command** to `npm install`.
4. Set the **Start Command** to `node server.js`.
5. Add all production environment variables (`MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `RAZORPAY_*`, `CLOUDINARY_*`, `SMTP_*`).
6. Deploy.

---

## 🧪 Automated Testing

Run the full regression test suite:
```bash
cd server
node test_phase9_final.js
```

---

## 📄 License
This project is licensed under the MIT License.
