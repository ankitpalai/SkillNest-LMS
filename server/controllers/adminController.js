import User from '../models/User.js';
import Course from '../models/Course.js';
import Category from '../models/Category.js';
import Enrollment from '../models/Enrollment.js';
import Section from '../models/Section.js';
import Lesson from '../models/Lesson.js';

/**
 * @route   GET /api/admin/stats
 * @desc    Get system telemetry and aggregated statistics
 * @access  Private (Admin only)
 */
export const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      totalAdmins,
      totalCourses,
      publishedCourses,
      draftCourses,
      totalEnrollments,
      recentUsers,
      recentCourses,
      recentEnrollments,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'instructor' }),
      User.countDocuments({ role: 'admin' }),
      Course.countDocuments(),
      Course.countDocuments({ status: 'published' }),
      Course.countDocuments({ status: 'draft' }),
      Enrollment.countDocuments(),
      User.find().select('name email role createdAt avatar').sort({ createdAt: -1 }).limit(5),
      Course.find()
        .select('title instructor category price status createdAt rating')
        .populate('instructor', 'name email')
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
      Enrollment.find()
        .populate('student', 'name email avatar')
        .populate('course', 'title price')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    // Calculate total revenue using MongoDB Aggregation Pipeline for maximum scalability
    const revenueAgg = await Enrollment.aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseDetails',
        },
      },
      { $unwind: '$courseDetails' },
      {
        $group: {
          _id: null,
          total: { $sum: '$courseDetails.price' },
        },
      },
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          students: totalStudents,
          instructors: totalInstructors,
          admins: totalAdmins,
        },
        courses: {
          total: totalCourses,
          published: publishedCourses,
          draft: draftCourses,
        },
        enrollments: {
          total: totalEnrollments,
        },
        revenue: {
          total: Math.round(totalRevenue * 100) / 100,
        },
        recentUsers,
        recentCourses,
        recentActivity: recentEnrollments,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/users
 * @desc    Get paginated, searchable, filterable users list
 * @access  Private (Admin only)
 */
export const getAdminUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // Search by name or email
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    // Filter by role
    if (req.query.role && req.query.role !== 'all') {
      query.role = req.query.role.toLowerCase();
    }

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit) || 1;

    const users = await User.find(query)
      .select('name email role avatar bio createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Enrich users with enrollment & created course counts
    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const [enrollmentCount, courseCount] = await Promise.all([
          Enrollment.countDocuments({ student: u._id }),
          Course.countDocuments({ instructor: u._id }),
        ]);
        return {
          ...u.toObject(),
          enrollmentCount,
          courseCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      users: enrichedUsers,
      totalUsers,
      totalPages,
      currentPage: page,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/admin/users/:id/role
 * @desc    Change user role (Student / Instructor / Admin)
 * @access  Private (Admin only)
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const adminId = req.user._id;

    if (!role || !['student', 'instructor', 'admin'].includes(role.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be student, instructor, or admin',
      });
    }

    // Safety guard: Admin cannot change their own role to prevent lockout
    if (id.toString() === adminId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Security Guard: You cannot alter your own admin privileges',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.role = role.toLowerCase();
    await user.save();

    res.status(200).json({
      success: true,
      message: `User role updated to ${user.role}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user account and clean up associations
 * @access  Private (Admin only)
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    // Safety guard: Admin cannot delete their own account
    if (id.toString() === adminId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Security Guard: You cannot delete your own admin account',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Clean up student enrollments
    await Enrollment.deleteMany({ student: id });

    // Clean up courses if instructor
    if (user.role === 'instructor') {
      const instructorCourses = await Course.find({ instructor: id });
      const courseIds = instructorCourses.map((c) => c._id);
      await Section.deleteMany({ course: { $in: courseIds } });
      await Lesson.deleteMany({ course: { $in: courseIds } });
      await Course.deleteMany({ instructor: id });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'User and associated records deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/courses
 * @desc    Get paginated courses list for admin moderation
 * @access  Private (Admin only)
 */
export const getAdminCourses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // Search by title
    if (req.query.search) {
      query.title = new RegExp(req.query.search.trim(), 'i');
    }

    // Filter by status (all, published, draft)
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status.toLowerCase();
    }

    const totalCourses = await Course.countDocuments(query);
    const totalPages = Math.ceil(totalCourses / limit) || 1;

    const courses = await Course.find(query)
      .populate('instructor', 'name email avatar')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Enrich courses with section & enrollment count
    const enrichedCourses = await Promise.all(
      courses.map(async (c) => {
        const [sectionCount, enrollmentCount] = await Promise.all([
          Section.countDocuments({ course: c._id }),
          Enrollment.countDocuments({ course: c._id }),
        ]);
        return {
          ...c.toObject(),
          sectionCount,
          enrollmentCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      courses: enrichedCourses,
      totalCourses,
      totalPages,
      currentPage: page,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/admin/courses/:id/status
 * @desc    Toggle or update course status (published / draft)
 * @access  Private (Admin only)
 */
export const toggleCourseStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (status && ['draft', 'published'].includes(status.toLowerCase())) {
      course.status = status.toLowerCase();
    } else {
      // Toggle
      course.status = course.status === 'published' ? 'draft' : 'published';
    }

    await course.save();

    res.status(200).json({
      success: true,
      message: `Course status changed to ${course.status}`,
      status: course.status,
      course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/admin/courses/:id
 * @desc    Admin delete course with cascading cleanup
 * @access  Private (Admin only)
 */
export const deleteAdminCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Cascade delete sections, lessons, enrollments
    await Section.deleteMany({ course: id });
    await Lesson.deleteMany({ course: id });
    await Enrollment.deleteMany({ course: id });
    await Course.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Course and related curriculum deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getAdminStats,
  getAdminUsers,
  updateUserRole,
  deleteUser,
  getAdminCourses,
  toggleCourseStatus,
  deleteAdminCourse,
};
