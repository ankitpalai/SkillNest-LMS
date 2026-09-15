import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { fetchCourseEnrollment } from '../enrollment/enrollmentSlice';

/**
 * Initiate Razorpay Order
 */
export const createPaymentOrderThunk = createAsyncThunk(
  'payment/createOrder',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/create-order', { courseId });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to create payment order'
      );
    }
  }
);

/**
 * Verify Razorpay Signature and Activate Enrollment
 */
export const verifyPaymentThunk = createAsyncThunk(
  'payment/verifyPayment',
  async ({ courseId, orderId, paymentId, signature }, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post('/payments/verify-payment', {
        courseId,
        orderId,
        paymentId,
        signature,
      });

      // Refresh enrollment status
      if (response.data.enrollment) {
        dispatch(fetchCourseEnrollment(courseId));
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Payment verification failed'
      );
    }
  }
);

/**
 * Fetch My Payments History
 */
export const fetchMyPaymentsThunk = createAsyncThunk(
  'payment/fetchMyPayments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/payments/my-payments');
      return response.data.payments;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch payments history'
      );
    }
  }
);

const initialState = {
  currentOrder: null,
  isOrderLoading: false,
  isVerifying: false,
  payments: [],
  isPaymentsLoading: false,
  error: null,
  successMessage: null,
};

export const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearPaymentState: (state) => {
      state.currentOrder = null;
      state.isOrderLoading = false;
      state.isVerifying = false;
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Order
      .addCase(createPaymentOrderThunk.pending, (state) => {
        state.isOrderLoading = true;
        state.error = null;
      })
      .addCase(createPaymentOrderThunk.fulfilled, (state, action) => {
        state.isOrderLoading = false;
        state.currentOrder = action.payload;
      })
      .addCase(createPaymentOrderThunk.rejected, (state, action) => {
        state.isOrderLoading = false;
        state.error = action.payload;
      })

      // Verify Payment
      .addCase(verifyPaymentThunk.pending, (state) => {
        state.isVerifying = true;
        state.error = null;
      })
      .addCase(verifyPaymentThunk.fulfilled, (state, action) => {
        state.isVerifying = false;
        state.successMessage = action.payload.message || 'Payment verified successfully!';
      })
      .addCase(verifyPaymentThunk.rejected, (state, action) => {
        state.isVerifying = false;
        state.error = action.payload;
      })

      // My Payments
      .addCase(fetchMyPaymentsThunk.pending, (state) => {
        state.isPaymentsLoading = true;
      })
      .addCase(fetchMyPaymentsThunk.fulfilled, (state, action) => {
        state.isPaymentsLoading = false;
        state.payments = action.payload || [];
      })
      .addCase(fetchMyPaymentsThunk.rejected, (state, action) => {
        state.isPaymentsLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPaymentState } = paymentSlice.actions;
export default paymentSlice.reducer;
