const BASE_URL = 'http://localhost:5000/api';

async function runPhase7Tests() {
  console.log('=== PHASE 7 ADMIN DASHBOARD & MANAGEMENT TEST SUITE ===\n');
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
    const studentToken = studentAuth.token;

    // 2. Authenticate Dr. Marcus Vance (Instructor)
    const instructorLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'instructor@example.com', password: 'instructor123' }),
    });
    const instructorAuth = await instructorLoginRes.json();
    assert(instructorLoginRes.status === 200 && instructorAuth.token, 'Instructor login succeeds with Bearer token');
    const instructorToken = instructorAuth.token;

    // 3. Authenticate System Administrator (Admin)
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' }),
    });
    const adminAuth = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminAuth.token, 'Admin login succeeds with Bearer token');
    const adminToken = adminAuth.token;

    // ---------------- 4. NON-ADMIN ACCESS PREVENTION (RBAC) ----------------
    const studentAccessRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentAccessRes.status === 403, 'GET /api/admin/stats by Student is rejected with 403 Forbidden');

    const instructorAccessRes = await fetch(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${instructorToken}` },
    });
    assert(instructorAccessRes.status === 403, 'GET /api/admin/users by Instructor is rejected with 403 Forbidden');

    const unauthAccessRes = await fetch(`${BASE_URL}/admin/courses`);
    assert(unauthAccessRes.status === 401, 'GET /api/admin/courses without Bearer token is rejected with 401 Unauthorized');

    // ---------------- 5. ADMIN DASHBOARD STATS ----------------
    const statsRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const statsData = await statsRes.json();
    assert(
      statsRes.status === 200 &&
      statsData.success &&
      statsData.stats.users.total >= 3 &&
      statsData.stats.users.students >= 1 &&
      statsData.stats.users.instructors >= 1 &&
      statsData.stats.users.admins >= 1 &&
      statsData.stats.courses.total >= 8 &&
      statsData.stats.enrollments.total >= 1 &&
      Array.isArray(statsData.stats.recentUsers) &&
      Array.isArray(statsData.stats.recentCourses),
      `GET /api/admin/stats returns telemetry (Users: ${statsData.stats?.users?.total}, Courses: ${statsData.stats?.courses?.total}, Enrollments: ${statsData.stats?.enrollments?.total}, Revenue: $${statsData.stats?.revenue?.total})`
    );

    // ---------------- 6. USER MANAGEMENT (PAGINATION, SEARCH, ROLE, DELETE) ----------------
    const usersRes = await fetch(`${BASE_URL}/admin/users?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const usersData = await usersRes.json();
    assert(
      usersRes.status === 200 &&
      usersData.success &&
      Array.isArray(usersData.users) &&
      usersData.totalUsers >= 3,
      `GET /api/admin/users returns paginated users directory (Total: ${usersData.totalUsers}, Page: ${usersData.currentPage}/${usersData.totalPages})`
    );

    // Search users
    const searchUserRes = await fetch(`${BASE_URL}/admin/users?search=Sarah`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const searchUserData = await searchUserRes.json();
    assert(
      searchUserRes.status === 200 &&
      searchUserData.users.some((u) => u.email.includes('sarah.connor')),
      'GET /api/admin/users?search=Sarah correctly filters user by keyword'
    );

    // Filter users by role
    const filterStudentRes = await fetch(`${BASE_URL}/admin/users?role=student`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const filterStudentData = await filterStudentRes.json();
    assert(
      filterStudentRes.status === 200 &&
      filterStudentData.users.every((u) => u.role === 'student'),
      `GET /api/admin/users?role=student returns only student accounts (Count: ${filterStudentData.users.length})`
    );

    // Safety guard: Admin self-demotion prevention
    const selfDemoteRes = await fetch(`${BASE_URL}/admin/users/${adminAuth.user._id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ role: 'student' }),
    });
    const selfDemoteData = await selfDemoteRes.json();
    assert(
      selfDemoteRes.status === 400 &&
      selfDemoteData.message.includes('Security Guard'),
      'Admin self-demotion prevention correctly blocks changing own role (HTTP 400)'
    );

    // Safety guard: Admin self-deletion prevention
    const selfDeleteRes = await fetch(`${BASE_URL}/admin/users/${adminAuth.user._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const selfDeleteData = await selfDeleteRes.json();
    assert(
      selfDeleteRes.status === 400 &&
      selfDeleteData.message.includes('Security Guard'),
      'Admin self-deletion prevention correctly blocks deleting own account (HTTP 400)'
    );

    // Create a temporary student to test role change and deletion
    const tempUserEmail = `temp.test.user.${Date.now()}@example.com`;
    const tempRegisterRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Temp Admin Test User',
        email: tempUserEmail,
        password: 'password123',
        role: 'student',
      }),
    });
    const tempUserData = await tempRegisterRes.json();
    const tempUserId = tempUserData.user._id;

    // Change role of temp user (promote to instructor)
    const updateRoleRes = await fetch(`${BASE_URL}/admin/users/${tempUserId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ role: 'instructor' }),
    });
    const updateRoleData = await updateRoleRes.json();
    assert(
      updateRoleRes.status === 200 &&
      updateRoleData.user.role === 'instructor',
      'PATCH /api/admin/users/:id/role successfully promotes user to instructor'
    );

    // Delete temp user
    const deleteUserRes = await fetch(`${BASE_URL}/admin/users/${tempUserId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteUserRes.status === 200, 'DELETE /api/admin/users/:id deletes user record successfully');

    // ---------------- 7. COURSE MANAGEMENT (PAGINATION, SEARCH, STATUS TOGGLE) ----------------
    const coursesRes = await fetch(`${BASE_URL}/admin/courses?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const coursesData = await coursesRes.json();
    assert(
      coursesRes.status === 200 &&
      Array.isArray(coursesData.courses) &&
      coursesData.courses.length > 0 &&
      coursesData.courses[0].sectionCount !== undefined,
      `GET /api/admin/courses returns populated courses list with section & enrollment metrics (Count: ${coursesData.courses.length})`
    );

    const targetCourse = coursesData.courses[0];

    // Toggle course status
    const toggleStatusRes = await fetch(`${BASE_URL}/admin/courses/${targetCourse._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const toggleStatusData = await toggleStatusRes.json();
    assert(
      toggleStatusRes.status === 200 &&
      toggleStatusData.status !== targetCourse.status,
      `PATCH /api/admin/courses/:id/status toggles status from ${targetCourse.status} to ${toggleStatusData.status}`
    );

    // Revert status back
    await fetch(`${BASE_URL}/admin/courses/${targetCourse._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // ---------------- 8. CATEGORY MANAGEMENT (CRUD) ----------------
    const createCatRes = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `Admin Category Test ${Date.now()}`,
        description: 'Temporary category for Phase 7 admin test suite',
      }),
    });
    const createCatData = await createCatRes.json();
    assert(
      createCatRes.status === 201 && createCatData.success,
      'POST /api/categories by Admin creates category (HTTP 201 Created)'
    );
    const catId = createCatData.category._id;

    const updateCatRes = await fetch(`${BASE_URL}/categories/${catId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        description: 'Updated category description by Admin',
      }),
    });
    const updateCatData = await updateCatRes.json();
    assert(
      updateCatRes.status === 200 && updateCatData.category.description.includes('Updated'),
      'PUT /api/categories/:id by Admin updates category'
    );

    const deleteCatRes = await fetch(`${BASE_URL}/categories/${catId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteCatRes.status === 200, 'DELETE /api/categories/:id by Admin deletes category successfully');

    console.log(`\n=== PHASE 7 API TEST RESULTS: ${passed}/${total} PASSED ===`);
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runPhase7Tests();
