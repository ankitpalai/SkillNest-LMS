const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== PHASE 3 BACKEND API TEST SUITE ===\n');
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
    // 1. Categories
    const catRes = await fetch(`${BASE_URL}/categories`);
    const catData = await catRes.json();
    assert(catRes.status === 200 && catData.categories.length === 5, 'GET /api/categories returns 5 seeded categories');

    const firstCat = catData.categories[0];
    assert(firstCat.courseCount !== undefined, `Category includes aggregated courseCount (${firstCat.name}: ${firstCat.courseCount})`);

    // 2. Courses
    const coursesRes = await fetch(`${BASE_URL}/courses`);
    const coursesData = await coursesRes.json();
    assert(coursesRes.status === 200 && coursesData.courses.length === 8, 'GET /api/courses returns 8 published courses');

    // 3. Search
    const searchRes = await fetch(`${BASE_URL}/courses?search=React`);
    const searchData = await searchRes.json();
    assert(
      searchRes.status === 200 && searchData.courses.some(c => c.title.includes('React')),
      'Search by keyword "React" finds Full-Stack React course'
    );

    // 4. Filter by Level
    const levelRes = await fetch(`${BASE_URL}/courses?level=beginner`);
    const levelData = await levelRes.json();
    assert(
      levelRes.status === 200 && levelData.courses.every(c => c.level === 'beginner'),
      `Filter by level=beginner returns only beginner courses (count: ${levelData.courses.length})`
    );

    // 5. Filter by Price
    const freeRes = await fetch(`${BASE_URL}/courses?price=free`);
    const freeData = await freeRes.json();
    assert(
      freeRes.status === 200 && freeData.courses.every(c => c.price === 0),
      `Filter by price=free returns only free courses (count: ${freeData.courses.length})`
    );

    // 6. Pagination
    const pageRes = await fetch(`${BASE_URL}/courses?page=1&limit=3`);
    const pageData = await pageRes.json();
    assert(
      pageRes.status === 200 && pageData.courses.length === 3 && pageData.totalPages === 3,
      'Pagination with limit=3 returns 3 courses with 3 total pages'
    );

    // 7. Get Single Course Details
    const targetCourse = coursesData.courses[0];
    const detailsRes = await fetch(`${BASE_URL}/courses/${targetCourse._id}`);
    const detailsData = await detailsRes.json();
    assert(
      detailsRes.status === 200 && detailsData.course.title === targetCourse.title && detailsData.course.instructor.name,
      `GET /api/courses/:id returns populated instructor: ${detailsData.course?.instructor?.name}`
    );

    // 8. Auth logins for authorization tests
    const instructorLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'instructor@example.com', password: 'instructor123' }),
    });
    const instructorAuth = await instructorLoginRes.json();

    const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sarah.connor.final@example.com', password: 'password123' }),
    });
    const studentAuth = await studentLoginRes.json();

    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' }),
    });
    const adminAuth = await adminLoginRes.json();

    // 9. Course creation by Student (should FAIL 403)
    const studentCreateRes = await fetch(`${BASE_URL}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentAuth.token}`,
      },
      body: JSON.stringify({
        title: 'Student Attempt Course',
        description: 'Should not be allowed',
        category: firstCat._id,
      }),
    });
    assert(studentCreateRes.status === 403, 'POST /api/courses by Student is rejected with 403 Forbidden');

    // 10. Course creation by Instructor (should SUCCEED 201)
    const instructorCreateRes = await fetch(`${BASE_URL}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${instructorAuth.token}`,
      },
      body: JSON.stringify({
        title: 'Temporary Test Course by Dr. Vance',
        subtitle: 'For verifying CRUD lifecycle',
        description: 'Comprehensive test course covering edge-case verification.',
        category: firstCat._id,
        price: 49.99,
        level: 'intermediate',
        learningObjectives: ['Verify backend CRUD operations'],
        requirements: ['Basic testing knowledge'],
      }),
    });
    const createdCourseData = await instructorCreateRes.json();
    assert(instructorCreateRes.status === 201, 'POST /api/courses by Instructor succeeds with 201 Created');

    const testCourseId = createdCourseData.course._id;

    // 11. Student trying to edit instructor course (should FAIL 403)
    const studentEditRes = await fetch(`${BASE_URL}/courses/${testCourseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentAuth.token}`,
      },
      body: JSON.stringify({ title: 'Hacked Title by Student' }),
    });
    assert(studentEditRes.status === 403, 'PUT /api/courses/:id by non-owner Student is rejected with 403 Forbidden');

    // 12. Instructor editing own course (should SUCCEED 200)
    const instructorEditRes = await fetch(`${BASE_URL}/courses/${testCourseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${instructorAuth.token}`,
      },
      body: JSON.stringify({ title: 'Updated Test Course Title by Dr. Vance', price: 59.99 }),
    });
    const updatedCourseData = await instructorEditRes.json();
    assert(
      instructorEditRes.status === 200 && updatedCourseData.course.title === 'Updated Test Course Title by Dr. Vance',
      'PUT /api/courses/:id by Owner Instructor succeeds with 200 OK'
    );

    // 13. Instructor deleting own course (should SUCCEED 200)
    const instructorDeleteRes = await fetch(`${BASE_URL}/courses/${testCourseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${instructorAuth.token}` },
    });
    assert(instructorDeleteRes.status === 200, 'DELETE /api/courses/:id by Owner Instructor succeeds with 200 OK');

    // 14. Admin Category creation and deletion
    const adminCreateCatRes = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminAuth.token}`,
      },
      body: JSON.stringify({
        name: 'Temporary Admin Category',
        description: 'Category for verifying admin permissions',
      }),
    });
    const adminCatData = await adminCreateCatRes.json();
    assert(adminCreateCatRes.status === 201, 'POST /api/categories by Admin succeeds with 201 Created');

    const adminDeleteCatRes = await fetch(`${BASE_URL}/categories/${adminCatData.category._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });
    assert(adminDeleteCatRes.status === 200, 'DELETE /api/categories/:id by Admin succeeds with 200 OK');

    console.log(`\n=== TEST RESULTS: ${passed}/${total} PASSED ===`);
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runTests();
