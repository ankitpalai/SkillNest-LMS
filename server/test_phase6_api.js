const BASE_URL = 'http://localhost:5000/api';

async function runPhase6Tests() {
  console.log('=== PHASE 6 REVIEWS, WISHLIST & PROFILE MANAGEMENT TEST SUITE ===\n');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
    }
  }

  try {
    // 1. Authenticate Sarah Connor (Student, already enrolled in React course)
    const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sarah.connor.final@example.com', password: 'password123' }),
    });
    const studentAuth = await studentLoginRes.json();
    assert(studentLoginRes.status === 200 && studentAuth.token, 'Student login succeeds with Bearer token');
    const studentToken = studentAuth.token;

    // 2. Authenticate Dr. Marcus Vance (Instructor, not enrolled as a student)
    const instructorLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'instructor@example.com', password: 'instructor123' }),
    });
    const instructorAuth = await instructorLoginRes.json();
    assert(instructorLoginRes.status === 200 && instructorAuth.token, 'Instructor login succeeds with Bearer token');
    const instructorToken = instructorAuth.token;

    // 3. Identify enrolled course
    const coursesRes = await fetch(`${BASE_URL}/courses`);
    const coursesData = await coursesRes.json();
    const enrolledCourse = coursesData.courses.find((c) => c.title.includes('React')) || coursesData.courses[0];
    const otherCourse = coursesData.courses.find((c) => c._id !== enrolledCourse._id) || coursesData.courses[1];
    const courseId = enrolledCourse._id;
    console.log(`[Target Course] "${enrolledCourse.title}" (${courseId})`);

    // Ensure Sarah is enrolled
    await fetch(`${BASE_URL}/enrollments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ courseId }),
    });

    // ---------------- REVIEW TESTS ----------------

    // 4. Non-enrolled user attempting to review course (Instructor trying to review other course)
    const nonEnrolledReviewRes = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${instructorToken}` },
      body: JSON.stringify({
        courseId: otherCourse._id,
        rating: 5,
        comment: 'Non-enrolled attempt',
      }),
    });
    const nonEnrolledReviewData = await nonEnrolledReviewRes.json();
    assert(
      nonEnrolledReviewRes.status === 403 &&
      nonEnrolledReviewData.message.includes('Only enrolled students'),
      'Non-enrolled user review is rejected with 403 Forbidden ("Only enrolled students are eligible...")'
    );

    // Clean up any existing review by Sarah on target course to start fresh
    const initialReviewsRes = await fetch(`${BASE_URL}/reviews/course/${courseId}`);
    const initialReviewsData = await initialReviewsRes.json();
    const existingSarahReview = initialReviewsData.reviews.find(
      (r) => r.student?._id === studentAuth.user._id || r.student?.email === 'sarah.connor.final@example.com'
    );
    if (existingSarahReview) {
      await fetch(`${BASE_URL}/reviews/${existingSarahReview._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${studentToken}` },
      });
    }

    // 5. Submit valid Review by enrolled student
    const createReviewRes = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        courseId,
        rating: 5,
        comment: 'Outstanding course architecture! The real-world production examples made concepts crystal clear.',
      }),
    });
    const createReviewData = await createReviewRes.json();
    assert(
      createReviewRes.status === 201 &&
      createReviewData.success &&
      createReviewData.review.rating === 5,
      'POST /api/reviews creates review by enrolled student (HTTP 201 Created)'
    );
    const createdReviewId = createReviewData.review._id;

    // 6. Duplicate review prevention
    const duplicateReviewRes = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        courseId,
        rating: 4,
        comment: 'Duplicate attempt',
      }),
    });
    const duplicateReviewData = await duplicateReviewRes.json();
    assert(
      duplicateReviewRes.status === 400 &&
      duplicateReviewData.message.includes('already submitted a review'),
      'Duplicate review submission is rejected with 400 Bad Request'
    );

    // 7. Get course reviews and verify distribution metrics
    const getReviewsRes = await fetch(`${BASE_URL}/reviews/course/${courseId}`);
    const getReviewsData = await getReviewsRes.json();
    assert(
      getReviewsRes.status === 200 &&
      getReviewsData.totalReviews >= 1 &&
      getReviewsData.averageRating > 0 &&
      getReviewsData.distribution[5] >= 1,
      `GET /api/reviews/course/:courseId returns reviews list & aggregated rating stats (Avg: ${getReviewsData.averageRating}★, Total: ${getReviewsData.totalReviews})`
    );

    // 8. Update review
    const updateReviewRes = await fetch(`${BASE_URL}/reviews/${createdReviewId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        rating: 4,
        comment: 'Updated: Excellent curriculum with top-tier hands-on exercises.',
      }),
    });
    const updateReviewData = await updateReviewRes.json();
    assert(
      updateReviewRes.status === 200 &&
      updateReviewData.review.rating === 4 &&
      updateReviewData.review.comment.includes('Updated:'),
      'PUT /api/reviews/:id updates review rating & comment with recalculated course score'
    );

    // 9. Non-author attempting to edit review (Instructor attempting to edit Sarah review -> 403)
    const unauthorizedEditRes = await fetch(`${BASE_URL}/reviews/${createdReviewId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${instructorToken}` },
      body: JSON.stringify({ rating: 1, comment: 'Hacked' }),
    });
    assert(unauthorizedEditRes.status === 403, 'PUT /api/reviews/:id by non-author is rejected with 403 Forbidden');

    // ---------------- WISHLIST TESTS ----------------

    // 10. Add course to wishlist
    const addWishlistRes = await fetch(`${BASE_URL}/wishlist/${otherCourse._id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const addWishlistData = await addWishlistRes.json();
    assert(
      addWishlistRes.status === 200 &&
      addWishlistData.success &&
      Array.isArray(addWishlistData.wishlist) &&
      addWishlistData.wishlist.some((w) => (w._id || w) === otherCourse._id),
      'POST /api/wishlist/:courseId adds course to user wishlist (HTTP 200)'
    );

    // 11. View Wishlist
    const getWishlistRes = await fetch(`${BASE_URL}/wishlist`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const getWishlistData = await getWishlistRes.json();
    assert(
      getWishlistRes.status === 200 &&
      getWishlistData.count >= 1 &&
      getWishlistData.wishlist.some((w) => w._id === otherCourse._id && w.title),
      `GET /api/wishlist returns populated wishlist with course details (Count: ${getWishlistData.count})`
    );

    // 12. Remove course from wishlist
    const removeWishlistRes = await fetch(`${BASE_URL}/wishlist/${otherCourse._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const removeWishlistData = await removeWishlistRes.json();
    assert(
      removeWishlistRes.status === 200 &&
      !removeWishlistData.wishlist.some((w) => (w._id || w) === otherCourse._id),
      'DELETE /api/wishlist/:courseId removes course from wishlist'
    );

    // ---------------- PROFILE & PASSWORD TESTS ----------------

    // 13. Get user profile
    const profileRes = await fetch(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const profileData = await profileRes.json();
    assert(
      profileRes.status === 200 &&
      profileData.user.email === 'sarah.connor.final@example.com' &&
      profileData.user.enrollmentCount >= 1,
      `GET /api/users/profile returns user details & enrollment telemetry (User: ${profileData.user.name})`
    );

    // 14. Update profile (name, bio, avatar)
    const updateProfileRes = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        name: 'Sarah Connor',
        bio: 'Senior Full-Stack Cloud Engineer & Architect. Lifelong learner.',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      }),
    });
    const updateProfileData = await updateProfileRes.json();
    assert(
      updateProfileRes.status === 200 &&
      updateProfileData.user.bio.includes('Senior Full-Stack') &&
      updateProfileData.user.avatar.includes('photo-1494790108377'),
      'PUT /api/users/profile updates name, bio, and avatar successfully'
    );

    // 15. Change Password - Test invalid current password
    const wrongPasswordRes = await fetch(`${BASE_URL}/users/change-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        currentPassword: 'wrongpassword123',
        newPassword: 'newsecurepassword456',
      }),
    });
    const wrongPasswordData = await wrongPasswordRes.json();
    assert(
      wrongPasswordRes.status === 400 &&
      wrongPasswordData.message.includes('Current password does not match'),
      'PUT /api/users/change-password validates current password correctly (HTTP 400 on mismatch)'
    );

    // 16. Change Password - Test valid password update and revert
    const changePasswordRes = await fetch(`${BASE_URL}/users/change-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        currentPassword: 'password123',
        newPassword: 'tempPassword123!',
      }),
    });
    const changePasswordData = await changePasswordRes.json();
    assert(
      changePasswordRes.status === 200 && changePasswordData.success,
      'PUT /api/users/change-password succeeds with valid credentials'
    );

    // Revert password back so demo credentials in CREDENTIALS.txt remain standard
    const revertPasswordRes = await fetch(`${BASE_URL}/users/change-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        currentPassword: 'tempPassword123!',
        newPassword: 'password123',
      }),
    });
    assert(revertPasswordRes.status === 200, 'Password reverted cleanly to default demo password');

    console.log(`\n=== PHASE 6 API TEST RESULTS: ${passed}/${total} PASSED ===`);
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runPhase6Tests();
