import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Enrollment must belong to a student'],
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Enrollment must belong to a course'],
      index: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedLessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
      },
    ],
    completed: {
      type: Boolean,
      default: false,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    lastAccessedLesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to guarantee a student cannot enroll in the same course multiple times
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

export default Enrollment;
