import Section from '../models/Section.js';
import Lesson from '../models/Lesson.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import jwt from 'jsonwebtoken';

/**
 * Helper to check course ownership (Course Instructor or Admin)
 */
const checkCourseOwnership = (course, user) => {
  if (!course) return false;
  const isOwner = course.instructor.toString() === user._id.toString();
  const isAdmin = user.role === 'admin';
  return isOwner || isAdmin;
};

/**
 * @route   GET /api/curriculum/course/:courseId
 * @desc    Get full ordered curriculum (sections and lessons) for a course
 *          Enrolled students, instructors, and admins receive full access to all lessons.
 *          Unenrolled students and guests receive preview lessons with protected lessons locked.
 * @access  Public / Authenticated
 */
export const getCourseCurriculum = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId).select('title instructor status');
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Determine if requester has full access
    let hasFullAccess = false;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'dev_jwt_secret_key_12345'
        );
        const user = await User.findById(decoded.id);
        if (user) {
          if (user.role === 'admin' || course.instructor.toString() === user._id.toString()) {
            hasFullAccess = true;
          } else {
            const isEnrolled = await Enrollment.exists({
              student: user._id,
              course: courseId,
            });
            if (isEnrolled) {
              hasFullAccess = true;
            }
          }
        }
      } catch (err) {
        hasFullAccess = false;
      }
    }

    const sections = await Section.find({ course: courseId }).sort({ order: 1 });

    const curriculum = await Promise.all(
      sections.map(async (sec) => {
        const lessons = await Lesson.find({ section: sec._id }).sort({ order: 1 });
        const processedLessons = lessons.map((lesson) => {
          const isPreview = Boolean(lesson.isPreview);
          const isUnlocked = hasFullAccess || isPreview;
          return {
            ...lesson.toObject(),
            isLocked: !isUnlocked,
            videoUrl: isUnlocked ? lesson.videoUrl : null,
            resources: isUnlocked ? lesson.resources : [],
          };
        });

        return {
          ...sec.toObject(),
          lessons: processedLessons,
        };
      })
    );

    res.status(200).json({
      success: true,
      course,
      hasFullAccess,
      sections: curriculum,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/curriculum/course/:courseId/sections
 * @desc    Create a new section in a course
 * @access  Private (Course Owner / Admin)
 */
export const createSection = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a section title',
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (!checkCourseOwnership(course, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this course curriculum',
      });
    }

    // Auto-calculate next order
    const sectionCount = await Section.countDocuments({ course: courseId });

    const section = await Section.create({
      title: title.trim(),
      course: courseId,
      order: sectionCount + 1,
    });

    res.status(201).json({
      success: true,
      section: {
        ...section.toObject(),
        lessons: [],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/curriculum/sections/:id
 * @desc    Update section title
 * @access  Private (Course Owner / Admin)
 */
export const updateSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a section title',
      });
    }

    const section = await Section.findById(id).populate('course');
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    if (!checkCourseOwnership(section.course, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this section',
      });
    }

    section.title = title.trim();
    await section.save();

    res.status(200).json({
      success: true,
      section,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/curriculum/sections/:id
 * @desc    Delete section and all its lessons (cascading)
 * @access  Private (Course Owner / Admin)
 */
export const deleteSection = async (req, res, next) => {
  try {
    const { id } = req.params;

    const section = await Section.findById(id).populate('course');
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    if (!checkCourseOwnership(section.course, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this section',
      });
    }

    // Cascade delete lessons in this section
    await Lesson.deleteMany({ section: id });
    await Section.findByIdAndDelete(id);

    // Re-adjust order of remaining sections in course
    const remainingSections = await Section.find({ course: section.course._id }).sort({ order: 1 });
    await Promise.all(
      remainingSections.map((sec, idx) => {
        sec.order = idx + 1;
        return sec.save();
      })
    );

    res.status(200).json({
      success: true,
      message: 'Section and associated lessons deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/curriculum/course/:courseId/sections/reorder
 * @desc    Reorder sections inside a course
 * @access  Private (Course Owner / Admin)
 */
export const reorderSections = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { sectionIds } = req.body; // Array of section IDs in desired order

    if (!Array.isArray(sectionIds)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of sectionIds',
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (!checkCourseOwnership(course, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to reorder this curriculum',
      });
    }

    await Promise.all(
      sectionIds.map((id, index) =>
        Section.findByIdAndUpdate(id, { order: index + 1 })
      )
    );

    const updatedSections = await Section.find({ course: courseId }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      message: 'Sections reordered successfully',
      sections: updatedSections,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/curriculum/sections/:sectionId/lessons
 * @desc    Create a new lesson inside a section
 * @access  Private (Course Owner / Admin)
 */
export const createLesson = async (req, res, next) => {
  try {
    const { sectionId } = req.params;
    const { title, description, videoUrl, resources, duration, isPreview } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a lesson title',
      });
    }

    const section = await Section.findById(sectionId).populate('course');
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    if (!checkCourseOwnership(section.course, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to add lessons to this course',
      });
    }

    // Auto-calculate next order
    const lessonCount = await Lesson.countDocuments({ section: sectionId });

    const lesson = await Lesson.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      videoUrl: videoUrl ? videoUrl.trim() : '',
      resources: Array.isArray(resources) ? resources : (resources ? [resources] : []),
      duration: Number(duration) || 0,
      section: sectionId,
      order: lessonCount + 1,
      isPreview: Boolean(isPreview),
    });

    res.status(201).json({
      success: true,
      lesson,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/curriculum/lessons/:id
 * @desc    Update lesson details
 * @access  Private (Course Owner / Admin)
 */
export const updateLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findById(id).populate({
      path: 'section',
      populate: { path: 'course' },
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }

    if (!checkCourseOwnership(lesson.section.course, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this lesson',
      });
    }

    const updatableFields = ['title', 'description', 'videoUrl', 'resources', 'duration', 'isPreview'];
    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        lesson[field] = req.body[field];
      }
    });

    await lesson.save();

    res.status(200).json({
      success: true,
      lesson,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/curriculum/lessons/:id
 * @desc    Delete a lesson
 * @access  Private (Course Owner / Admin)
 */
export const deleteLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findById(id).populate({
      path: 'section',
      populate: { path: 'course' },
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }

    if (!checkCourseOwnership(lesson.section.course, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this lesson',
      });
    }

    const sectionId = lesson.section._id;
    await Lesson.findByIdAndDelete(id);

    // Re-adjust order of remaining lessons in section
    const remainingLessons = await Lesson.find({ section: sectionId }).sort({ order: 1 });
    await Promise.all(
      remainingLessons.map((l, idx) => {
        l.order = idx + 1;
        return l.save();
      })
    );

    res.status(200).json({
      success: true,
      message: 'Lesson deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/curriculum/sections/:sectionId/lessons/reorder
 * @desc    Reorder lessons inside a section
 * @access  Private (Course Owner / Admin)
 */
export const reorderLessons = async (req, res, next) => {
  try {
    const { sectionId } = req.params;
    const { lessonIds } = req.body;

    if (!Array.isArray(lessonIds)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of lessonIds',
      });
    }

    const section = await Section.findById(sectionId).populate('course');
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    if (!checkCourseOwnership(section.course, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to reorder lessons in this course',
      });
    }

    await Promise.all(
      lessonIds.map((id, index) =>
        Lesson.findByIdAndUpdate(id, { order: index + 1 })
      )
    );

    const updatedLessons = await Lesson.find({ section: sectionId }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      message: 'Lessons reordered successfully',
      lessons: updatedLessons,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getCourseCurriculum,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
};
