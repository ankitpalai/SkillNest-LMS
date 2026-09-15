import crypto from 'crypto';
import Razorpay from 'razorpay';
import Payment from '../models/Payment.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Section from '../models/Section.js';
import Lesson from '../models/Lesson.js';
import { sendEnrollmentConfirmationEmail } from '../services/emailService.js';

/**
 * Helper to get or mock Razorpay instance
 */
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_skillnest123';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'skillnest_secret_key_98765';

  return new Razorpay({
    key_id,
    key_secret,
  });
};

/**
 * @route   POST /api/payments/create-order
 * @desc    Initiate Razorpay checkout order for a course
 * @access  Private (Authenticated student)
 */
export const createPaymentOrder = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const userId = req.user._id;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid courseId',
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (course.status !== 'published' && req.user.role === 'student') {
      return res.status(400).json({
        success: false,
        message: 'Cannot purchase an unpublished course',
      });
    }

    // Check if user is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: userId,
      course: courseId,
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course',
      });
    }

    // If course is free ($0), return flag so client can direct-enroll without payment gateway
    if (course.price === 0) {
      return res.status(200).json({
        success: true,
        isFree: true,
        message: 'This course is free. You can enroll directly.',
        course: {
          _id: course._id,
          title: course.title,
          price: 0,
        },
      });
    }

    const amountInPaise = Math.max(100, Math.round(course.price * 100));
    const currency = 'INR';
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_skillnest123';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'skillnest_secret_key_98765';

    let orderId;
    const isPlaceholder = !keyId || keyId === 'rzp_test_skillnest123' || keyId.includes('placeholder');

    if (isPlaceholder) {
      // Mock sandbox order for default dummy key
      orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    } else {
      try {
        const razorpay = getRazorpayInstance();
        const options = {
          amount: amountInPaise,
          currency,
          receipt: `rcpt_${Date.now()}_${userId.toString().slice(-4)}`,
          notes: {
            courseId: course._id.toString(),
            courseTitle: course.title.substring(0, 40),
            userId: userId.toString(),
          },
        };
        const order = await razorpay.orders.create(options);
        orderId = order.id;
      } catch (err) {
        console.error('[Razorpay Order Error]:', err.message || err);
        return res.status(500).json({
          success: false,
          message: `Failed to create Razorpay payment order: ${err.error?.description || err.message}`,
        });
      }
    }

    // Record created payment in DB
    const payment = await Payment.create({
      user: userId,
      course: courseId,
      amount: course.price,
      currency,
      orderId,
      status: 'created',
    });

    res.status(200).json({
      success: true,
      orderId,
      amount: course.price,
      amountInPaise,
      currency,
      keyId,
      paymentId: payment._id,
      course: {
        _id: course._id,
        title: course.title,
        price: course.price,
        thumbnail: course.thumbnail,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/payments/verify-payment
 * @desc    Cryptographically verify Razorpay signature and activate course enrollment
 * @access  Private
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const { courseId, orderId, paymentId, signature } = req.body;
    const userId = req.user._id;

    if (!courseId || !orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification parameters (courseId, orderId, paymentId, signature)',
      });
    }

    // Find the payment record
    const payment = await Payment.findOne({ orderId, user: userId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment order record not found',
      });
    }

    // Cryptographic signature check
    const secret = process.env.RAZORPAY_KEY_SECRET || 'skillnest_secret_key_98765';
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    const isValidSignature = signature === expectedSignature;

    if (!isValidSignature) {
      payment.status = 'failed';
      payment.paymentId = paymentId;
      payment.signature = signature;
      await payment.save();

      return res.status(400).json({
        success: false,
        message: 'Payment signature verification failed. Forged or invalid transaction.',
      });
    }

    // Mark payment as paid
    payment.status = 'paid';
    payment.paymentId = paymentId;
    payment.signature = signature;
    await payment.save();

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course associated with payment not found',
      });
    }

    // Check if enrollment already exists
    let enrollment = await Enrollment.findOne({ student: userId, course: courseId });

    if (!enrollment) {
      // Find initial lesson for student
      const firstSection = await Section.findOne({ course: courseId }).sort({ order: 1 });
      let initialLessonId = null;
      if (firstSection) {
        const firstLesson = await Lesson.findOne({ section: firstSection._id }).sort({ order: 1 });
        if (firstLesson) initialLessonId = firstLesson._id;
      }

      // Create enrollment record
      enrollment = await Enrollment.create({
        student: userId,
        course: courseId,
        progress: 0,
        completedLessons: [],
        completed: false,
        enrolledAt: new Date(),
        lastAccessedLesson: initialLessonId,
        lastAccessedAt: new Date(),
      });

      // Increment course enrolled count
      await Course.findByIdAndUpdate(courseId, { $inc: { enrolledStudents: 1 } });
    }

    // Send Enrollment Confirmation Email asynchronously
    if (req.user?.email) {
      sendEnrollmentConfirmationEmail(
        req.user.email,
        req.user.name,
        course.title,
        payment.amount
      ).catch((err) => console.error('[Email] Failed to send enrollment email:', err.message));
    }

    const populatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate({
        path: 'course',
        populate: [
          { path: 'instructor', select: 'name avatar bio' },
          { path: 'category', select: 'name' },
        ],
      })
      .populate('lastAccessedLesson');

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully. You are now enrolled!',
      payment,
      enrollment: populatedEnrollment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/payments/my-payments
 * @desc    Fetch payment history for authenticated student
 * @access  Private
 */
export const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate('course', 'title thumbnail price')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/payments/all
 * @desc    Fetch all payments telemetry (Admin only)
 * @access  Private (Admin)
 */
export const getAllPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'name email avatar')
      .populate('course', 'title price')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createPaymentOrder,
  verifyPayment,
  getMyPayments,
  getAllPayments,
};
