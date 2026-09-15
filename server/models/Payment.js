import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Payment must belong to a user'],
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Payment must belong to a course'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment must specify an amount'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    orderId: {
      type: String,
      required: [true, 'Razorpay orderId is required'],
      index: true,
    },
    paymentId: {
      type: String,
      default: '',
    },
    signature: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed'],
      default: 'created',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
