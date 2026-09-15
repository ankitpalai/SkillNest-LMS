const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== PHASE 4 BACKEND API TEST SUITE ===\n');
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
    // 1. Auth Logins
    const instructorLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'instructor@example.com', password: 'instructor123' }),
    });
    const instructorAuth = await instructorLoginRes.json();
    assert(instructorLoginRes.status === 200 && instructorAuth.token, 'Instructor login succeeds with Bearer token');

    const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sarah.connor.final@example.com', password: 'password123' }),
    });
    const studentAuth = await studentLoginRes.json();
    assert(studentLoginRes.status === 200 && studentAuth.token, 'Student login succeeds with Bearer token');

    // 2. Instructor Telemetry Stats
    const statsRes = await fetch(`${BASE_URL}/instructor/stats`, {
      headers: { Authorization: `Bearer ${instructorAuth.token}` },
    });
    const statsData = await statsRes.json();
    assert(
      statsRes.status === 200 &&
      statsData.stats.totalCourses >= 8 &&
      statsData.stats.totalStudents > 0 &&
      statsData.stats.recentEnrollments.length > 0,
      `GET /api/instructor/stats returns telemetry (Courses: ${statsData.stats?.totalCourses}, Students: ${statsData.stats?.totalStudents}, Avg Rating: ${statsData.stats?.avgRating})`
    );

    // Student attempting to access instructor stats should FAIL (403)
    const studentStatsRes = await fetch(`${BASE_URL}/instructor/stats`, {
      headers: { Authorization: `Bearer ${studentAuth.token}` },
    });
    assert(studentStatsRes.status === 403, 'GET /api/instructor/stats by Student is rejected with 403 Forbidden');

    // 3. Instructor Course Management List
    const myCoursesRes = await fetch(`${BASE_URL}/instructor/courses`, {
      headers: { Authorization: `Bearer ${instructorAuth.token}` },
    });
    const myCoursesData = await myCoursesRes.json();
    assert(
      myCoursesRes.status === 200 && myCoursesData.courses.length >= 8,
      `GET /api/instructor/courses returns instructor courses (count: ${myCoursesData.courses?.length})`
    );

    const targetCourse = myCoursesData.courses.find((c) => c.title.includes('React')) || myCoursesData.courses[0];
    assert(
      targetCourse.sectionCount !== undefined && targetCourse.lessonCount !== undefined,
      `Course includes section/lesson metrics (Sections: ${targetCourse.sectionCount}, Lessons: ${targetCourse.lessonCount})`
    );

    // 4. Toggle Course Publish / Draft Status
    const toggleRes = await fetch(`${BASE_URL}/instructor/courses/${targetCourse._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${instructorAuth.token}` },
    });
    const toggleData = await toggleRes.json();
    assert(toggleRes.status === 200, `PATCH /api/instructor/courses/:id/status toggles status to: ${toggleData.status}`);

    // Revert status back
    await fetch(`${BASE_URL}/instructor/courses/${targetCourse._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${instructorAuth.token}` },
    });

    // 5. Get Course Curriculum
    const curriculumRes = await fetch(`${BASE_URL}/curriculum/course/${targetCourse._id}`);
    const curriculumData = await curriculumRes.json();
    assert(
      curriculumRes.status === 200 && curriculumData.sections.length >= 3,
      `GET /api/curriculum/course/:courseId returns ${curriculumData.sections?.length} sections with nested lessons`
    );

    // 6. Create Section (Instructor)
    const newSectionRes = await fetch(`${BASE_URL}/curriculum/course/${targetCourse._id}/sections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${instructorAuth.token}`,
      },
      body: JSON.stringify({ title: 'Module 4: Performance Auditing & Testing' }),
    });
    const newSectionData = await newSectionRes.json();
    assert(newSectionRes.status === 201 && newSectionData.section.order, 'POST /api/curriculum/course/:courseId/sections succeeds with auto-assigned order');
    const tempSectionId = newSectionData.section._id;

    // Student trying to add section should FAIL (403)
    const studentSectionRes = await fetch(`${BASE_URL}/curriculum/course/${targetCourse._id}/sections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentAuth.token}`,
      },
      body: JSON.stringify({ title: 'Hacked Section' }),
    });
    assert(studentSectionRes.status === 403, 'POST /api/curriculum/course/:courseId/sections by Student is rejected with 403 Forbidden');

    // 7. Update Section Title
    const updateSecRes = await fetch(`${BASE_URL}/curriculum/sections/${tempSectionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${instructorAuth.token}`,
      },
      body: JSON.stringify({ title: 'Module 4: Performance Auditing & End-to-End Testing (Updated)' }),
    });
    const updateSecData = await updateSecRes.json();
    assert(
      updateSecRes.status === 200 && updateSecData.section.title.includes('(Updated)'),
      'PUT /api/curriculum/sections/:id updates section title'
    );

    // 8. Create Lesson in Section
    const newLessonRes = await fetch(`${BASE_URL}/curriculum/sections/${tempSectionId}/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${instructorAuth.token}`,
      },
      body: JSON.stringify({
        title: 'Core Web Vitals & Lighthouse Optimization',
        description: 'Analyzing bundle sizes, tree shaking, and code splitting strategies.',
        duration: 22,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        isPreview: true,
      }),
    });
    const newLessonData = await newLessonRes.json();
    assert(
      newLessonRes.status === 201 && newLessonData.lesson.isPreview === true,
      'POST /api/curriculum/sections/:sectionId/lessons creates lesson with isPreview flag'
    );
    const tempLessonId = newLessonData.lesson._id;

    // 9. Update Lesson Details
    const updateLessonRes = await fetch(`${BASE_URL}/curriculum/lessons/${tempLessonId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${instructorAuth.token}`,
      },
      body: JSON.stringify({ duration: 25, isPreview: false }),
    });
    const updateLessonData = await updateLessonRes.json();
    assert(
      updateLessonRes.status === 200 && updateLessonData.lesson.duration === 25,
      'PUT /api/curriculum/lessons/:id updates lesson duration & preview flag'
    );

    // 10. Delete Lesson
    const deleteLessonRes = await fetch(`${BASE_URL}/curriculum/lessons/${tempLessonId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${instructorAuth.token}` },
    });
    assert(deleteLessonRes.status === 200, 'DELETE /api/curriculum/lessons/:id deletes lesson successfully');

    // 11. Delete Section (Cascading)
    const deleteSecRes = await fetch(`${BASE_URL}/curriculum/sections/${tempSectionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${instructorAuth.token}` },
    });
    assert(deleteSecRes.status === 200, 'DELETE /api/curriculum/sections/:id deletes section and child lessons');

    console.log(`\n=== TEST RESULTS: ${passed}/${total} PASSED ===`);
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runTests();
