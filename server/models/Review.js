import mongoose from 'mongoose';
import Course from './Course.js';

const reviewSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a student'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Review must belong to a course'],
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating between 1 and 5'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      required: [true, 'Please provide a review comment'],
      trim: true,
      maxlength: [1000, 'Review comment cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent a student from submitting multiple reviews for the same course
reviewSchema.index({ student: 1, course: 1 }, { unique: true });

/**
 * Static method to calculate average rating & total reviews for a course
 */
reviewSchema.statics.calculateCourseRating = async function (courseId) {
  const stats = await this.aggregate([
    {
      $match: { course: new mongoose.Types.ObjectId(courseId) },
    },
    {
      $group: {
        _id: '$course',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Course.findByIdAndUpdate(courseId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
    });
  } else {
    await Course.findByIdAndUpdate(courseId, {
      rating: 0,
      totalReviews: 0,
    });
  }
};

const Review = mongoose.model('Review', reviewSchema);

export default Review;
