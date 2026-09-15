import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import Section from '../models/Section.js';
import Lesson from '../models/Lesson.js';
import {
  sendEnrollmentConfirmationEmail,
  sendCourseCompletionEmail,
} from '../services/emailService.js';

/**
 * @route   POST /api/enrollments
 * @desc    Enroll authenticated student in a course
 * @access  Private (Student, Instructor, Admin)
 */
export const enrollCourse = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const studentId = req.user._id;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid courseId',
      });
    }

    // Verify course exists and is published
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
        message: 'Cannot enroll in an unpublished course',
      });
    }

    // Check duplicate enrollment
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course',
        enrollment: existingEnrollment,
      });
    }

    // Find first lesson to initialize lastAccessedLesson if available
    const firstSection = await Section.findOne({ course: courseId }).sort({ order: 1 });
    let initialLessonId = null;
    if (firstSection) {
      const firstLesson = await Lesson.findOne({ section: firstSection._id }).sort({ order: 1 });
      if (firstLesson) {
        initialLessonId = firstLesson._id;
      }
    }

    // Create new enrollment
    const enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
      progress: 0,
      completedLessons: [],
      completed: false,
      enrolledAt: new Date(),
      lastAccessedLesson: initialLessonId,
      lastAccessedAt: new Date(),
    });

    // Increment enrolledStudents count on Course
    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrolledStudents: 1 },
    });

    // Send Enrollment Confirmation Email asynchronously
    if (req.user?.email) {
      sendEnrollmentConfirmationEmail(
        req.user.email,
        req.user.name,
        course.title,
        course.price
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

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      enrollment: populatedEnrollment,
    });
  } catch (error) {
    // Handle MongoDB duplicate key error code 11000 gracefully
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course',
      });
    }
    next(error);
  }
};

/**
 * @route   GET /api/enrollments/my-courses
 * @desc    Get all enrolled courses for authenticated student
 * @access  Private
 */
export const getMyEnrollments = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    const enrollments = await Enrollment.find({ student: studentId })
      .populate({
        path: 'course',
        select: 'title subtitle description thumbnail price level category instructor rating totalReviews enrolledStudents status',
        populate: [
          { path: 'instructor', select: 'name avatar bio' },
          { path: 'category', select: 'name' },
        ],
      })
      .populate('lastAccessedLesson', 'title duration isPreview')
      .sort({ lastAccessedAt: -1, enrolledAt: -1 });

    // Filter out any enrollments where the course may have been deleted
    const validEnrollments = enrollments.filter((e) => e.course != null);

    // Attach totalLessons count to each enrollment for rich client cards
    const enrichedEnrollments = await Promise.all(
      validEnrollments.map(async (enrollment) => {
        const sections = await Section.find({ course: enrollment.course._id });
        const sectionIds = sections.map((s) => s._id);
        const totalLessons = await Lesson.countDocuments({ section: { $in: sectionIds } });

        return {
          ...enrollment.toObject(),
          totalLessons,
          completedCount: enrollment.completedLessons?.length || 0,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedEnrollments.length,
      enrollments: enrichedEnrollments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/enrollments/:courseId
 * @desc    Get enrollment status and progress for a specific course
 * @access  Private
 */
export const getCourseEnrollment = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
    })
      .populate('lastAccessedLesson', 'title duration order isPreview')
      .populate('completedLessons', '_id title');

    // Fetch total lessons for accurate progress reference
    const sections = await Section.find({ course: courseId });
    const sectionIds = sections.map((s) => s._id);
    const totalLessons = await Lesson.countDocuments({ section: { $in: sectionIds } });

    if (!enrollment) {
      return res.status(200).json({
        success: true,
        enrolled: false,
        totalLessons,
        enrollment: null,
      });
    }

    res.status(200).json({
      success: true,
      enrolled: true,
      totalLessons,
      enrollment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/enrollments/:courseId/lessons/:lessonId
 * @desc    Mark lesson as complete or incomplete, calculate progress and completed status
 * @access  Private
 */
export const toggleLessonCompletion = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.params;
    const studentId = req.user._id;
    const { completed: targetState } = req.body;

    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment record not found for this course',
      });
    }

    // Verify lesson belongs to the course
    const lesson = await Lesson.findById(lessonId).populate('section');
    if (!lesson || !lesson.section || lesson.section.course.toString() !== courseId) {
      return res.status(400).json({
        success: false,
        message: 'Lesson does not belong to the specified course',
      });
    }

    // Determine current completion state
    const completedSet = new Set(
      enrollment.completedLessons.map((id) => id.toString())
    );

    let isMarked = completedSet.has(lessonId.toString());

    if (targetState !== undefined) {
      if (targetState) {
        completedSet.add(lessonId.toString());
      } else {
        completedSet.delete(lessonId.toString());
      }
    } else {
      // Toggle
      if (isMarked) {
        completedSet.delete(lessonId.toString());
      } else {
        completedSet.add(lessonId.toString());
      }
    }

    enrollment.completedLessons = Array.from(completedSet);

    // Calculate total lessons in course
    const sections = await Section.find({ course: courseId });
    const sectionIds = sections.map((s) => s._id);
    const totalLessons = await Lesson.countDocuments({ section: { $in: sectionIds } });

    // Progress Calculation: Completed Lessons / Total Lessons * 100
    const completedCount = enrollment.completedLessons.length;
    const progress =
      totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    // When all lessons are completed: completed = true
    const isCompleted = totalLessons > 0 && completedCount >= totalLessons;
    const previouslyCompleted = enrollment.completed;

    enrollment.progress = Math.min(100, Math.max(0, progress));
    enrollment.completed = isCompleted;
    enrollment.lastAccessedLesson = lessonId;
    enrollment.lastAccessedAt = new Date();

    await enrollment.save();

    // If student just achieved 100% completion, send congratulatory email
    if (isCompleted && !previouslyCompleted && req.user?.email) {
      Course.findById(courseId)
        .then((c) => {
          if (c) {
            sendCourseCompletionEmail(req.user.email, req.user.name, c.title).catch((err) =>
              console.error('[Email] Failed to send completion email:', err.message)
            );
          }
        })
        .catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: completedSet.has(lessonId.toString())
        ? 'Lesson marked as completed'
        : 'Lesson marked as incomplete',
      progress: enrollment.progress,
      completed: enrollment.completed,
      totalLessons,
      completedCount,
      completedLessons: enrollment.completedLessons,
      enrollment,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  enrollCourse,
  getMyEnrollments,
  getCourseEnrollment,
  toggleLessonCompletion,
};
