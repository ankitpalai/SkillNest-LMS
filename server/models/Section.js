import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a section title'],
      trim: true,
      maxlength: [120, 'Section title cannot exceed 120 characters'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Section must belong to a course'],
      index: true,
    },
    order: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast ordered queries per course
sectionSchema.index({ course: 1, order: 1 });

const Section = mongoose.model('Section', sectionSchema);

export default Section;
