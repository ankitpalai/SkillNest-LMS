import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a course title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [150, 'Subtitle cannot exceed 150 characters'],
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Please provide a course description'],
    },
    thumbnail: {
      type: String,
      default: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Course must have an assigned instructor'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Course must belong to a category'],
    },
    price: {
      type: Number,
      required: [true, 'Please specify a course price (0 for free)'],
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
    level: {
      type: String,
      enum: {
        values: ['beginner', 'intermediate', 'advanced'],
        message: '{VALUE} is not a valid difficulty level',
      },
      default: 'beginner',
    },
    language: {
      type: String,
      default: 'English',
      trim: true,
    },
    requirements: {
      type: [String],
      default: [],
    },
    learningObjectives: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      min: [0, 'Rating cannot be lower than 0'],
      max: [5, 'Rating cannot exceed 5'],
      default: 4.8,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    enrolledStudents: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'published'],
        message: '{VALUE} is not a valid course status',
      },
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast searching and filtering
courseSchema.index({ title: 'text', subtitle: 'text' });
courseSchema.index({ category: 1, level: 1, price: 1, status: 1 });

const Course = mongoose.model('Course', courseSchema);

export default Course;
