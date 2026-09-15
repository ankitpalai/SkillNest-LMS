import Review from '../models/Review.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';

/**
 * @route   POST /api/reviews
 * @desc    Submit a review for a course (Enrolled students only, 1 per course)
 * @access  Private (Student)
 */
export const createReview = async (req, res, next) => {
  try {
    const { courseId, rating, comment } = req.body;
    const studentId = req.user._id;

    if (!courseId || rating === undefined || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide courseId, rating (1-5), and a review comment',
      });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a numeric score between 1 and 5',
      });
    }

    // 1. Check course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // 2. Rule: Only enrolled students can review a course
    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'Only enrolled students are eligible to review this course',
      });
    }

    // 3. Rule: One review per student per course
    const existingReview = await Review.findOne({
      student: studentId,
      course: courseId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this course. You can edit your existing review.',
      });
    }

    // 4. Create review
    const review = await Review.create({
      student: studentId,
      course: courseId,
      rating: numericRating,
      comment: comment.trim(),
    });

    // 5. Update course rating statistics
    await Review.calculateCourseRating(courseId);

    const populatedReview = await Review.findById(review._id).populate(
      'student',
      'name avatar email role'
    );

    // Fetch updated course stats
    const updatedCourse = await Course.findById(courseId, 'rating totalReviews');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: populatedReview,
      courseRating: updatedCourse?.rating || numericRating,
      totalReviews: updatedCourse?.totalReviews || 1,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this course',
      });
    }
    next(error);
  }
};

/**
 * @route   GET /api/reviews/course/:courseId
 * @desc    Get all reviews and rating distribution for a course
 * @access  Public
 */
export const getCourseReviews = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const reviews = await Review.find({ course: courseId })
      .populate('student', 'name avatar email role')
      .sort({ createdAt: -1 });

    // Calculate rating distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalScore = 0;

    reviews.forEach((r) => {
      const rounded = Math.round(r.rating);
      if (distribution[rounded] !== undefined) {
        distribution[rounded]++;
      }
      totalScore += r.rating;
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0 ? Math.round((totalScore / totalReviews) * 10) / 10 : 0;

    res.status(200).json({
      success: true,
      count: totalReviews,
      averageRating,
      totalReviews,
      distribution,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/reviews/:id
 * @desc    Update a review (Author only)
 * @access  Private
 */
export const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const studentId = req.user._id;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Authorization: Author only
    if (review.student.toString() !== studentId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this review',
      });
    }

    if (rating !== undefined) {
      const numericRating = Number(rating);
      if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be a numeric score between 1 and 5',
        });
      }
      review.rating = numericRating;
    }

    if (comment !== undefined) {
      review.comment = comment.trim();
    }

    await review.save();

    // Recalculate course ratings
    await Review.calculateCourseRating(review.course);

    const populatedReview = await Review.findById(review._id).populate(
      'student',
      'name avatar email role'
    );

    const updatedCourse = await Course.findById(review.course, 'rating totalReviews');

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review: populatedReview,
      courseRating: updatedCourse?.rating,
      totalReviews: updatedCourse?.totalReviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete a review (Author or Admin)
 * @access  Private
 */
export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Authorization: Author or Admin
    if (review.student.toString() !== userId.toString() && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review',
      });
    }

    const courseId = review.course;
    await review.deleteOne();

    // Recalculate course ratings
    await Review.calculateCourseRating(courseId);

    const updatedCourse = await Course.findById(courseId, 'rating totalReviews');

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
      courseRating: updatedCourse?.rating,
      totalReviews: updatedCourse?.totalReviews,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createReview,
  getCourseReviews,
  updateReview,
  deleteReview,
};
