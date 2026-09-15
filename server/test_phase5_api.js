const BASE_URL = 'http://localhost:5000/api';

async function runPhase5Tests() {
  console.log('=== PHASE 5 STUDENT ENROLLMENT & COURSE LEARNING TEST SUITE ===\n');
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
    // 1. Authenticate Sarah Connor (Student)
    const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sarah.connor.final@example.com', password: 'password123' }),
    });
    const studentAuth = await studentLoginRes.json();
    assert(studentLoginRes.status === 200 && studentAuth.token, 'Student login succeeds with Bearer token');
    const token = studentAuth.token;

    // 2. Fetch target published course
    const coursesRes = await fetch(`${BASE_URL}/courses`);
    const coursesData = await coursesRes.json();
    const targetCourse = coursesData.courses.find((c) => c.title.includes('React')) || coursesData.courses[0];
    assert(targetCourse && targetCourse._id, `Target course identified: "${targetCourse.title}" (${targetCourse._id})`);
    const courseId = targetCourse._id;

    // 3. Check public curriculum before enrollment (Protected vs Preview Lessons)
    const publicCurriculumRes = await fetch(`${BASE_URL}/curriculum/course/${courseId}`);
    const publicCurriculumData = await publicCurriculumRes.json();
    const allLessons = publicCurriculumData.sections.flatMap((s) => s.lessons);
    const previewLessons = allLessons.filter((l) => l.isPreview);
    const protectedLessons = allLessons.filter((l) => !l.isPreview);

    assert(
      publicCurriculumRes.status === 200 &&
      publicCurriculumData.hasFullAccess === false &&
      previewLessons.length > 0 &&
      previewLessons.every((l) => l.isLocked === false && l.videoUrl) &&
      protectedLessons.length > 0 &&
      protectedLessons.every((l) => l.isLocked === true && l.videoUrl === null),
      `Course access protection: Public curriculum exposes ${previewLessons.length} preview lessons and locks ${protectedLessons.length} protected lessons`
    );

    // 4. Check initial enrollment status
    const initialEnrollmentRes = await fetch(`${BASE_URL}/enrollments/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const initialEnrollmentData = await initialEnrollmentRes.json();
    console.log(`[Status] Initial enrollment state: enrolled=${initialEnrollmentData.enrolled}`);

    // If student was already enrolled in a previous test run, we test the existing state or proceed
    let enrolledData;
    if (!initialEnrollmentData.enrolled) {
      // 5. Enroll student in course (POST /api/enrollments)
      const enrollRes = await fetch(`${BASE_URL}/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId }),
      });
      enrolledData = await enrollRes.json();
      assert(
        enrollRes.status === 201 && enrolledData.success && enrolledData.enrollment,
        'POST /api/enrollments creates enrollment record (HTTP 201)'
      );
    } else {
      enrolledData = initialEnrollmentData;
      console.log('[Info] Student was already enrolled from a prior session');
    }

    // 6. Test duplicate enrollment prevention
    const duplicateEnrollRes = await fetch(`${BASE_URL}/enrollments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ courseId }),
    });
    const duplicateData = await duplicateEnrollRes.json();
    assert(
      duplicateEnrollRes.status === 400 &&
      duplicateData.success === false &&
      duplicateData.message.includes('Already enrolled'),
      'POST /api/enrollments duplicate enrollment prevention succeeds (HTTP 400 with "Already enrolled")'
    );

    // 7. Verify enrolled status via GET /api/enrollments/:courseId
    const checkRes = await fetch(`${BASE_URL}/enrollments/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const checkData = await checkRes.json();
    assert(
      checkRes.status === 200 && checkData.enrolled === true && checkData.enrollment,
      'GET /api/enrollments/:courseId returns enrolled: true and enrollment details'
    );

    // 8. Fetch My Courses via GET /api/enrollments/my-courses
    const myCoursesRes = await fetch(`${BASE_URL}/enrollments/my-courses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const myCoursesData = await myCoursesRes.json();
    assert(
      myCoursesRes.status === 200 &&
      Array.isArray(myCoursesData.enrollments) &&
      myCoursesData.enrollments.some((e) => e.course._id === courseId),
      `GET /api/enrollments/my-courses lists enrolled courses with populated details (Count: ${myCoursesData.count})`
    );

    // 9. Verify enrolled student curriculum access (hasFullAccess: true, all lessons unlocked)
    const authedCurriculumRes = await fetch(`${BASE_URL}/curriculum/course/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const authedCurriculumData = await authedCurriculumRes.json();
    const authedLessons = authedCurriculumData.sections.flatMap((s) => s.lessons);
    assert(
      authedCurriculumRes.status === 200 &&
      authedCurriculumData.hasFullAccess === true &&
      authedLessons.every((l) => l.isLocked === false && l.videoUrl),
      `Enrolled student curriculum unlocked: All ${authedLessons.length} lessons unlocked with video URLs`
    );

    // 10. Test Lesson Completion and Progress Calculation
    const lessonToComplete = authedLessons[0];
    const completeLessonRes = await fetch(`${BASE_URL}/enrollments/${courseId}/lessons/${lessonToComplete._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ completed: true }),
    });
    const completeLessonData = await completeLessonRes.json();
    assert(
      completeLessonRes.status === 200 &&
      completeLessonData.completedCount >= 1 &&
      completeLessonData.progress > 0,
      `PATCH /api/enrollments/:courseId/lessons/:lessonId marks lesson complete (Progress: ${completeLessonData.progress}%)`
    );

    // 11. Complete all lessons to test 100% progress and completed = true
    for (const lesson of authedLessons) {
      await fetch(`${BASE_URL}/enrollments/${courseId}/lessons/${lesson._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: true }),
      });
    }

    const fullCompletionRes = await fetch(`${BASE_URL}/enrollments/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const fullCompletionData = await fullCompletionRes.json();
    assert(
      fullCompletionData.enrollment.progress === 100 && fullCompletionData.enrollment.completed === true,
      `Progress Calculation 100%: All ${authedLessons.length} lessons completed, progress=100%, completed=true`
    );

    // 12. Toggle one lesson back to incomplete and verify completed status turns false
    const toggleBackRes = await fetch(`${BASE_URL}/enrollments/${courseId}/lessons/${lessonToComplete._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ completed: false }),
    });
    const toggleBackData = await toggleBackRes.json();
    assert(
      toggleBackRes.status === 200 &&
      toggleBackData.completed === false &&
      toggleBackData.progress < 100,
      `Progress Reversal: Lesson unmarked, progress reverted to ${toggleBackData.progress}%, completed=false`
    );

    console.log(`\n=== PHASE 5 API TEST RESULTS: ${passed}/${total} PASSED ===`);
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runPhase5Tests();
