import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a lesson title'],
      trim: true,
      maxlength: [150, 'Lesson title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    videoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    resources: {
      type: [String],
      default: [],
    },
    duration: {
      type: Number,
      default: 0, // Duration in minutes
      min: 0,
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: [true, 'Lesson must belong to a section'],
      index: true,
    },
    order: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPreview: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast ordered queries per section
lessonSchema.index({ section: 1, order: 1 });

const Lesson = mongoose.model('Lesson', lessonSchema);

export default Lesson;
