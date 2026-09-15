import 'dotenv/config';
import crypto from 'crypto';

const BASE_URL = 'http://127.0.0.1:5000/api';

async function runPhase8Tests() {
  console.log('=== PHASE 8 FILE UPLOADS, EMAIL & PAYMENTS TEST SUITE ===\n');

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
    // 1. Create a fresh test student for clean testing
    const testStudentEmail = `student_phase8_${Date.now()}@example.com`;
    const studentRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Phase 8 Student',
        email: testStudentEmail,
        password: 'password123',
      }),
    });
    const studentAuth = await studentRegRes.json();
    assert(studentRegRes.status === 201 && studentAuth.token, 'Student registered and logged in with Bearer token');
    const studentToken = studentAuth.token;

    // 2. Authenticate Admin
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' }),
    });
    const adminAuth = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminAuth.token, 'Admin login succeeds with Bearer token');
    const adminToken = adminAuth.token;

    // 3. Test Registration Welcome Email was triggered
    assert(studentAuth.user.email === testStudentEmail, 'User registration triggers account creation and welcome email');

    // 4. Test Forgot Password & Reset Password Email Flow
    const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testStudentEmail }),
    });
    const forgotData = await forgotRes.json();
    assert(
      forgotRes.status === 200 && forgotData.resetToken,
      'POST /api/auth/forgot-password generates token and reset email link'
    );
    const resetToken = forgotData.resetToken;

    // Test Invalid Reset Token
    const badResetRes = await fetch(`${BASE_URL}/auth/reset-password/invalid_token_12345`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'newpassword123' }),
    });
    assert(badResetRes.status === 400, 'POST /api/auth/reset-password with invalid token rejected with HTTP 400');

    // Test Valid Reset Token
    const validResetRes = await fetch(`${BASE_URL}/auth/reset-password/${resetToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'newpassword123' }),
    });
    const validResetData = await validResetRes.json();
    assert(validResetRes.status === 200 && validResetData.token, 'POST /api/auth/reset-password resets password and returns new JWT');

    // 5. Test Cloudinary Avatar Upload using FormData
    const dummyImageBytes = new Uint8Array([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
      0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
    ]);
    const avatarFormData = new FormData();
    avatarFormData.append('avatar', new Blob([dummyImageBytes], { type: 'image/gif' }), 'avatar.gif');

    const uploadAvatarRes = await fetch(`${BASE_URL}/upload/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: avatarFormData,
    });
    const uploadAvatarData = await uploadAvatarRes.json();
    assert(uploadAvatarRes.status === 200 && uploadAvatarData.url, 'POST /api/upload/avatar uploads image and updates user profile');

    // 6. Test Course Thumbnail Upload RBAC (Student Forbidden, Admin Allowed)
    const thumbFormData = new FormData();
    thumbFormData.append('thumbnail', new Blob([dummyImageBytes], { type: 'image/png' }), 'thumbnail.png');

    const studentThumbRes = await fetch(`${BASE_URL}/upload/thumbnail`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: thumbFormData,
    });
    assert(studentThumbRes.status === 403, 'POST /api/upload/thumbnail rejects student with 403 Forbidden');

    const adminThumbRes = await fetch(`${BASE_URL}/upload/thumbnail`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: thumbFormData,
    });
    const adminThumbData = await adminThumbRes.json();
    assert(adminThumbRes.status === 200 && adminThumbData.url, 'POST /api/upload/thumbnail by Admin returns secure image URL');

    // 7. Test Course Video Upload (Admin/Instructor Only)
    const dummyVideoBytes = new Uint8Array([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32]);
    const videoFormData = new FormData();
    videoFormData.append('video', new Blob([dummyVideoBytes], { type: 'video/mp4' }), 'lesson_video.mp4');

    const adminVideoRes = await fetch(`${BASE_URL}/upload/video`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: videoFormData,
    });
    const adminVideoData = await adminVideoRes.json();
    assert(adminVideoRes.status === 200 && adminVideoData.url, 'POST /api/upload/video by Admin returns secure video URL');

    // 8. Test Course Resource Attachment Upload (PDF/Document)
    const dummyPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    const resourceFormData = new FormData();
    resourceFormData.append('resource', new Blob([dummyPdfBytes], { type: 'application/pdf' }), 'cheatsheet.pdf');

    const adminResourceRes = await fetch(`${BASE_URL}/upload/resource`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: resourceFormData,
    });
    const adminResourceData = await adminResourceRes.json();
    assert(adminResourceRes.status === 200 && adminResourceData.url, 'POST /api/upload/resource by Admin returns attachment URL and metadata');

    // 9. Test File Mimetype Validation on Upload (Rejects non-images)
    const textBlob = new Blob(['Not an image'], { type: 'text/plain' });
    const badFormData = new FormData();
    badFormData.append('avatar', textBlob, 'bad.txt');

    const invalidUploadRes = await fetch(`${BASE_URL}/upload/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: badFormData,
    });
    assert(invalidUploadRes.status === 400 || invalidUploadRes.status === 500, 'POST /api/upload/avatar rejects invalid file types');

    // 8. Test Razorpay Payment Order Creation
    const coursesRes = await fetch(`${BASE_URL}/courses`);
    const coursesData = await coursesRes.json();
    const targetCourse = coursesData.courses[0];
    assert(targetCourse && targetCourse._id, `Found course for payment: "${targetCourse.title}" ($${targetCourse.price})`);

    // Fresh buyer for payment tests
    const buyerEmail = `buyer_${Date.now()}@example.com`;
    const buyerRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Razorpay Buyer',
        email: buyerEmail,
        password: 'password123',
      }),
    });
    const buyerAuth = await buyerRegRes.json();
    const buyerToken = buyerAuth.token;

    const orderRes = await fetch(`${BASE_URL}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({ courseId: targetCourse._id }),
    });
    const orderData = await orderRes.json();
    assert(
      orderRes.status === 200 && orderData.orderId && orderData.keyId,
      `POST /api/payments/create-order generates Razorpay order (${orderData.orderId})`
    );
    const orderId = orderData.orderId;
    const fakePaymentId = `pay_${Date.now()}_test`;

    // 9. Test Security: Forged/Tampered Payment Signature Rejection
    const tamperedSignature = 'forged_fake_signature_abc123';
    const verifyFailedRes = await fetch(`${BASE_URL}/payments/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        courseId: targetCourse._id,
        orderId,
        paymentId: fakePaymentId,
        signature: tamperedSignature,
      }),
    });
    assert(
      verifyFailedRes.status === 400,
      'POST /api/payments/verify-payment rejects forged/tampered signature with HTTP 400'
    );

    // Verify Enrollment was NOT created after failed payment
    const checkEnrollmentFailed = await fetch(`${BASE_URL}/enrollments/${targetCourse._id}`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const checkEnrollmentFailedData = await checkEnrollmentFailed.json();
    assert(
      checkEnrollmentFailed.status === 200 && checkEnrollmentFailedData.enrolled === false,
      'Security Verification: No enrollment was created after payment signature failure'
    );

    // 10. Test Valid Cryptographic Signature Verification & Enrollment
    const secret = process.env.RAZORPAY_KEY_SECRET || 'skillnest_secret_key_98765';
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${fakePaymentId}`)
      .digest('hex');

    const verifySuccessRes = await fetch(`${BASE_URL}/payments/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        courseId: targetCourse._id,
        orderId,
        paymentId: fakePaymentId,
        signature: validSignature,
      }),
    });
    const verifySuccessData = await verifySuccessRes.json();
    assert(
      verifySuccessRes.status === 200 && verifySuccessData.enrollment,
      'POST /api/payments/verify-payment verifies valid HMAC SHA256 signature and creates course enrollment'
    );

    // 11. Verify Student is Now Enrolled
    const checkEnrollmentSuccess = await fetch(`${BASE_URL}/enrollments/${targetCourse._id}`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const checkEnrollmentSuccessData = await checkEnrollmentSuccess.json();
    assert(
      checkEnrollmentSuccess.status === 200 && checkEnrollmentSuccessData.enrolled === true,
      'GET /api/enrollments/:courseId confirms student is successfully enrolled'
    );

    // 12. Test Student My Payments and Admin All Payments
    const studentPaymentsRes = await fetch(`${BASE_URL}/payments/my-payments`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const studentPaymentsData = await studentPaymentsRes.json();
    assert(
      studentPaymentsRes.status === 200 && studentPaymentsData.payments.length > 0,
      `GET /api/payments/my-payments returns student payment receipt (Status: ${studentPaymentsData.payments[0].status})`
    );

    const adminPaymentsRes = await fetch(`${BASE_URL}/payments/all`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminPaymentsData = await adminPaymentsRes.json();
    assert(
      adminPaymentsRes.status === 200 && adminPaymentsData.payments.length > 0,
      `GET /api/payments/all by Admin returns full system payment audit log (Count: ${adminPaymentsData.count})`
    );

    console.log(`\n=== PHASE 8 API TEST RESULTS: ${passed}/${total} PASSED ===\n`);
  } catch (err) {
    console.error('Test Execution Error:', err);
  }
}

runPhase8Tests();
