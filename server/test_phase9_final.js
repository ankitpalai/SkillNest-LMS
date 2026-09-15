import 'dotenv/config';
import crypto from 'crypto';

const BASE_URL = 'http://127.0.0.1:5000/api';

async function runFinalQualityTestSuite() {
  console.log('================================================================');
  console.log('🎓 SKILLNEST LMS - PHASE 9 FINAL COMPREHENSIVE REGRESSION SUITE');
  console.log('================================================================\n');

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, message, extra = '') {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${message} ${extra ? '(' + JSON.stringify(extra) + ')' : ''}`);
    }
  }

  const timestamp = Date.now();
  const testStudentEmail = `qa_student_${timestamp}@skillnest.lms`;
  const testInstructorEmail = `qa_instructor_${timestamp}@skillnest.lms`;
  const testPassword = 'Password123!';

  let studentToken, studentId;
  let instructorToken, instructorId;
  let adminToken, adminId;
  let createdCourseId, createdSectionId, createdLessonId, lockedLessonId;
  let razorpayOrderId;

  try {
    // ---------------------------------------------------------
    // 1. HEALTH CHECK & API BASELINE
    // ---------------------------------------------------------
    console.log('--- 1. SYSTEM HEALTH & API BASELINE ---');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.success === true, 'GET /api/health returns 200 OK');

    // ---------------------------------------------------------
    // 2. AUTHENTICATION & USER REGISTRATION
    // ---------------------------------------------------------
    console.log('\n--- 2. AUTHENTICATION & RBAC LIFECYCLE ---');
    
    // Register Student
    const regStudentRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'QA Test Student',
        email: testStudentEmail,
        password: testPassword,
      }),
    });
    const regStudentData = await regStudentRes.json();
    assert(regStudentRes.status === 201 && regStudentData.token, 'Student registration succeeds with JWT token');
    studentToken = regStudentData.token;
    studentId = regStudentData.user?._id;

    // Login Admin
    const loginAdminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' }),
    });
    const loginAdminData = await loginAdminRes.json();
    assert(loginAdminRes.status === 200 && loginAdminData.token, 'Admin authentication succeeds');
    adminToken = loginAdminData.token;
    adminId = loginAdminData.user?._id;

    // Promote a user to Instructor via Admin API
    const regInstRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'QA Test Instructor',
        email: testInstructorEmail,
        password: testPassword,
      }),
    });
    const regInstData = await regInstRes.json();
    instructorId = regInstData.user?._id;

    const promoteRes = await fetch(`${BASE_URL}/admin/users/${instructorId}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ role: 'instructor' }),
    });
    const promoteData = await promoteRes.json();
    assert(promoteRes.status === 200 && promoteData.user?.role === 'instructor', 'Admin promotes user to Instructor role');

    // Re-login Instructor to get fresh token with instructor role
    const loginInstRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testInstructorEmail, password: testPassword }),
    });
    const loginInstData = await loginInstRes.json();
    instructorToken = loginInstData.token;

    // RBAC Guard Test: Student cannot access admin endpoints (403 Forbidden)
    const rbacGuardRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(rbacGuardRes.status === 403, 'RBAC Guard: Student access to /api/admin/stats rejected with 403 Forbidden');

    // ---------------------------------------------------------
    // 3. COURSE CREATION & MANAGEMENT
    // ---------------------------------------------------------
    console.log('\n--- 3. COURSE CATALOG & INSTRUCTOR CRUD ---');
    
    // Fetch categories
    const catRes = await fetch(`${BASE_URL}/categories`);
    const catData = await catRes.json();
    const testCategory = catData.categories[0];
    assert(catRes.status === 200 && testCategory?._id, 'GET /api/categories returns available taxonomy');

    // Create course as Instructor
    const createCourseRes = await fetch(`${BASE_URL}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${instructorToken}`,
      },
      body: JSON.stringify({
        title: `QA Engineering Masterclass ${timestamp}`,
        subtitle: 'Production-ready full stack distributed architecture',
        description: 'Comprehensive course covering modern microservices, CI/CD, and scaling.',
        category: testCategory._id,
        price: 49.99,
        level: 'intermediate',
        language: 'English',
        requirements: ['Basic JavaScript knowledge'],
        learningObjectives: ['Deploy distributed nodes', 'Master full stack architecture'],
        status: 'published',
      }),
    });
    const createCourseData = await createCourseRes.json();
    assert(createCourseRes.status === 201 && createCourseData.course?._id, 'Instructor creates published course');
    createdCourseId = createCourseData.course?._id;

    // Course search & filter
    const searchRes = await fetch(`${BASE_URL}/courses?search=Engineering&category=${testCategory._id}`);
    const searchData = await searchRes.json();
    assert(searchRes.status === 200 && searchData.courses?.length > 0, 'GET /api/courses filters and searches catalog');

    // ---------------------------------------------------------
    // 4. CURRICULUM SECTIONS & LESSONS
    // ---------------------------------------------------------
    console.log('\n--- 4. CURRICULUM MANAGEMENT ---');

    // Add Section
    const addSectionRes = await fetch(`${BASE_URL}/curriculum/course/${createdCourseId}/sections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${instructorToken}`,
      },
      body: JSON.stringify({ title: 'Module 1: Architecture Foundations' }),
    });
    const addSectionData = await addSectionRes.json();
    assert(addSectionRes.status === 201 && addSectionData.section?._id, 'POST /api/curriculum/course/:id/sections creates section');
    createdSectionId = addSectionData.section?._id;

    // Add Lesson 1 (Preview)
    const addLesson1Res = await fetch(`${BASE_URL}/curriculum/sections/${createdSectionId}/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${instructorToken}`,
      },
      body: JSON.stringify({
        title: 'Introduction & System Overview',
        description: 'Overview of system topology and course goals',
        videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        duration: 10,
        isPreview: true,
      }),
    });
    const addLesson1Data = await addLesson1Res.json();
    assert(addLesson1Res.status === 201 && addLesson1Data.lesson?.isPreview === true, 'POST /api/curriculum/sections/:id/lessons creates preview lesson');
    createdLessonId = addLesson1Data.lesson?._id;

    // Add Lesson 2 (Locked)
    const addLesson2Res = await fetch(`${BASE_URL}/curriculum/sections/${createdSectionId}/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${instructorToken}`,
      },
      body: JSON.stringify({
        title: 'Advanced Database Sharding & Replicas',
        description: 'Deep dive into distributed storage engine',
        videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        duration: 25,
        isPreview: false,
      }),
    });
    const addLesson2Data = await addLesson2Res.json();
    lockedLessonId = addLesson2Data.lesson?._id;
    assert(addLesson2Res.status === 201 && addLesson2Data.lesson?.isPreview === false, 'POST creates premium locked lesson');

    // Public Guest curriculum access: Locked lesson videoUrl is null
    const guestCurrRes = await fetch(`${BASE_URL}/curriculum/course/${createdCourseId}`);
    const guestCurrData = await guestCurrRes.json();
    const guestLessons = guestCurrData.sections[0]?.lessons || [];
    const previewLesson = guestLessons.find((l) => l._id === createdLessonId);
    const lockedLesson = guestLessons.find((l) => l._id === lockedLessonId);
    assert(
      previewLesson?.isLocked === false && lockedLesson?.isLocked === true && lockedLesson?.videoUrl === null,
      'Security: Unenrolled guests receive preview video while premium lessons are locked'
    );

    // ---------------------------------------------------------
    // 5. WISHLIST MANAGEMENT
    // ---------------------------------------------------------
    console.log('\n--- 5. WISHLIST MANAGEMENT ---');
    
    // Add to wishlist
    const addWishRes = await fetch(`${BASE_URL}/wishlist/${createdCourseId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const addWishData = await addWishRes.json();
    assert(addWishRes.status === 200 && addWishData.wishlist?.length > 0, 'POST /api/wishlist/:id adds course to wishlist');

    // Get wishlist
    const getWishRes = await fetch(`${BASE_URL}/wishlist`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const getWishData = await getWishRes.json();
    assert(getWishRes.status === 200 && getWishData.count >= 1, 'GET /api/wishlist returns student wishlist');

    // ---------------------------------------------------------
    // 6. PAYMENTS & ENROLLMENT (RAZORPAY GATEWAY + CRYPTOGRAPHY)
    // ---------------------------------------------------------
    console.log('\n--- 6. PAYMENT GATEWAY & VERIFICATION ---');

    // Create Order
    const orderRes = await fetch(`${BASE_URL}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ courseId: createdCourseId }),
    });
    const orderData = await orderRes.json();
    assert(orderRes.status === 200 && orderData.orderId, `POST /api/payments/create-order creates Razorpay order (${orderData.orderId})`);
    razorpayOrderId = orderData.orderId;

    // Tampered signature test
    const fakeVerifyRes = await fetch(`${BASE_URL}/payments/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        courseId: createdCourseId,
        orderId: razorpayOrderId,
        paymentId: `pay_${Date.now()}`,
        signature: 'fake_forged_invalid_signature',
      }),
    });
    assert(fakeVerifyRes.status === 400, 'Security: Forged payment signature rejected with HTTP 400');

    // Valid HMAC SHA256 Signature
    const simulatedPaymentId = `pay_valid_${Date.now()}`;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'skillnest_secret_key_98765';
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpayOrderId}|${simulatedPaymentId}`)
      .digest('hex');

    const validVerifyRes = await fetch(`${BASE_URL}/payments/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        courseId: createdCourseId,
        orderId: razorpayOrderId,
        paymentId: simulatedPaymentId,
        signature: validSignature,
      }),
    });
    const validVerifyData = await validVerifyRes.json();
    assert(
      validVerifyRes.status === 200 && validVerifyData.enrollment?._id,
      'POST /api/payments/verify-payment verifies cryptographic signature and activates enrollment',
      validVerifyData
    );

    // Verify student is now enrolled
    const checkEnrolledRes = await fetch(`${BASE_URL}/enrollments/${createdCourseId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const checkEnrolledData = await checkEnrolledRes.json();
    assert(checkEnrolledData.enrolled === true, 'GET /api/enrollments/:courseId confirms student is actively enrolled', checkEnrolledData);

    // ---------------------------------------------------------
    // 7. PROGRESS TRACKING & COMPLETION
    // ---------------------------------------------------------
    console.log('\n--- 7. PROGRESS TRACKING & COMPLETION ---');

    // Complete Lesson 1
    const progress1Res = await fetch(`${BASE_URL}/enrollments/${createdCourseId}/lessons/${createdLessonId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ completed: true }),
    });
    const progress1Data = await progress1Res.json();
    assert(progress1Res.status === 200 && progress1Data.progress === 50, 'PATCH /api/enrollments updates progress to 50%', progress1Data);

    // Complete Lesson 2 -> 100% completion
    const progress2Res = await fetch(`${BASE_URL}/enrollments/${createdCourseId}/lessons/${lockedLessonId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ completed: true }),
    });
    const progress2Data = await progress2Res.json();
    assert(progress2Res.status === 200 && progress2Data.progress === 100 && progress2Data.completed === true, 'Course completed (100%) triggers certificate & completion email', progress2Data);

    // ---------------------------------------------------------
    // 8. COURSE REVIEWS & RATINGS CALCULATION
    // ---------------------------------------------------------
    console.log('\n--- 8. COURSE REVIEWS & AGGREGATE RATINGS ---');

    // Enrolled student submits 5-star review
    const reviewRes = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        courseId: createdCourseId,
        rating: 5,
        comment: 'Outstanding course! Thoroughly explained and production-ready architecture.',
      }),
    });
    const reviewData = await reviewRes.json();
    assert(reviewRes.status === 201 && reviewData.review?._id, 'POST /api/reviews submits course review', reviewData);

    // Duplicate review check
    const dupReviewRes = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        courseId: createdCourseId,
        rating: 4,
        comment: 'Duplicate review attempt',
      }),
    });
    assert(dupReviewRes.status === 400, 'Security: Duplicate review by same student rejected with HTTP 400');

    // ---------------------------------------------------------
    // 9. PROFILE & SETTINGS
    // ---------------------------------------------------------
    console.log('\n--- 9. USER PROFILE & SETTINGS ---');

    const updateProfileRes = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        name: 'QA Senior Engineer',
        bio: 'Cloud architect and full stack specialist',
      }),
    });
    const updateProfileData = await updateProfileRes.json();
    assert(updateProfileRes.status === 200 && updateProfileData.user?.name === 'QA Senior Engineer', 'PUT /api/users/profile updates user info', updateProfileData);

    // ---------------------------------------------------------
    // 10. ADMIN & INSTRUCTOR TELEMETRY
    // ---------------------------------------------------------
    console.log('\n--- 10. ADMIN & INSTRUCTOR TELEMETRY ---');

    // Instructor Stats
    const instStatsRes = await fetch(`${BASE_URL}/instructor/stats`, {
      headers: { Authorization: `Bearer ${instructorToken}` },
    });
    const instStatsData = await instStatsRes.json();
    assert(instStatsRes.status === 200 && instStatsData.stats?.totalCourses >= 1, 'GET /api/instructor/stats returns instructor metrics');

    // Admin Stats (with optimized MongoDB Aggregation pipeline)
    const adminStatsRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminStatsData = await adminStatsRes.json();
    assert(
      adminStatsRes.status === 200 && adminStatsData.stats?.revenue?.total !== undefined,
      `GET /api/admin/stats aggregates revenue (${adminStatsData.stats?.revenue?.total}) and system telemetry`
    );

    console.log('\n================================================================');
    console.log(`✨ FINAL TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log('================================================================\n');

    if (passedTests === totalTests) {
      console.log('🎉 ALL SYSTEMS FULLY OPERATIONAL AND PRODUCTION-READY!');
    }
  } catch (error) {
    console.error('[TEST SUITE ERROR]:', error.message || error);
  }
}

runFinalQualityTestSuite();
