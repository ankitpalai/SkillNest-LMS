import Course from '../models/Course.js';
import Section from '../models/Section.js';
import Lesson from '../models/Lesson.js';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';

/**
 * @route   GET /api/instructor/stats
 * @desc    Get aggregated telemetry metrics for the instructor dashboard
 * @access  Private (Instructor / Admin)
 */
export const getInstructorStats = async (req, res, next) => {
  try {
    const instructorId = req.user._id;

    // Retrieve all courses authored by this instructor
    const courses = await Course.find({ instructor: instructorId });

    const totalCourses = courses.length;
    const publishedCourses = courses.filter((c) => c.status === 'published').length;
    const draftCourses = courses.filter((c) => c.status === 'draft').length;

    const totalStudents = courses.reduce(
      (sum, c) => sum + (c.enrolledStudents || 0),
      0
    );
    const totalEnrollments = totalStudents;

    const avgRating =
      courses.length > 0
        ? (
            courses.reduce((sum, c) => sum + (c.rating || 0), 0) / courses.length
          ).toFixed(1)
        : '5.0';

    // Query recent real enrollments across instructor courses
    const instructorCourseIds = courses.map((c) => c._id);
    const realEnrollments = await Enrollment.find({ course: { $in: instructorCourseIds } })
      .populate('student', 'name email avatar')
      .populate('course', 'title price')
      .sort({ enrolledAt: -1 })
      .limit(5);

    const recentEnrollments = realEnrollments.map((enr, idx) => ({
      id: enr._id.toString(),
      studentName: enr.student?.name || 'Student',
      studentEmail: enr.student?.email || '',
      courseTitle: enr.course?.title || 'Course',
      courseId: enr.course?._id || enr.course,
      price: enr.course?.price || 0,
      enrolledAt: enr.enrolledAt || enr.createdAt,
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalCourses,
        publishedCourses,
        draftCourses,
        totalStudents,
        totalEnrollments,
        avgRating,
        recentEnrollments,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/instructor/courses
 * @desc    Get all courses authored by the logged-in instructor
 * @access  Private (Instructor / Admin)
 */
export const getInstructorCourses = async (req, res, next) => {
  try {
    const instructorId = req.user._id;

    const courses = await Course.find({ instructor: instructorId })
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    // Aggregate sections and lessons counts for each course
    const coursesWithMetrics = await Promise.all(
      courses.map(async (course) => {
        const sections = await Section.find({ course: course._id });
        const sectionIds = sections.map((s) => s._id);
        const lessonCount = await Lesson.countDocuments({
          section: { $in: sectionIds },
        });

        return {
          ...course.toObject(),
          sectionCount: sections.length,
          lessonCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: coursesWithMetrics.length,
      courses: coursesWithMetrics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/instructor/courses/:id/status
 * @desc    Toggle course status between draft and published
 * @access  Private (Instructor / Admin)
 */
export const toggleCourseStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Ownership check
    const isOwner = course.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this course status',
      });
    }

    course.status = course.status === 'published' ? 'draft' : 'published';
    await course.save();

    res.status(200).json({
      success: true,
      message: `Course status changed to ${course.status}`,
      status: course.status,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getInstructorStats,
  getInstructorCourses,
  toggleCourseStatus,
};
