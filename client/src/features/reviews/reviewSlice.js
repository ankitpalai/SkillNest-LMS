import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async Thunk: Fetch Reviews for a Course
export const fetchCourseReviews = createAsyncThunk(
  'reviews/fetchCourseReviews',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/reviews/course/${courseId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.message || error.data?.message || 'Failed to load course reviews'
      );
    }
  }
);

// Async Thunk: Submit Course Review
export const submitReview = createAsyncThunk(
  'reviews/submitReview',
  async ({ courseId, rating, comment }, { rejectWithValue }) => {
    try {
      const response = await api.post('/reviews', { courseId, rating, comment });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.message || error.data?.message || 'Failed to submit review'
      );
    }
  }
);

// Async Thunk: Update Review
export const updateReview = createAsyncThunk(
  'reviews/updateReview',
  async ({ reviewId, rating, comment }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/reviews/${reviewId}`, { rating, comment });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.message || error.data?.message || 'Failed to update review'
      );
    }
  }
);

// Async Thunk: Delete Review
export const deleteReview = createAsyncThunk(
  'reviews/deleteReview',
  async (reviewId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/reviews/${reviewId}`);
      return { reviewId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.message || error.data?.message || 'Failed to delete review'
      );
    }
  }
);

const initialState = {
  reviews: [],
  averageRating: 0,
  totalReviews: 0,
  distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  isLoading: false,
  isSubmitting: false,
  error: null,
  successMessage: null,
};

export const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearReviewStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    resetReviews: (state) => {
      state.reviews = [];
      state.averageRating = 0;
      state.totalReviews = 0;
      state.distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchCourseReviews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourseReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reviews = action.payload.reviews || [];
        state.averageRating = action.payload.averageRating || 0;
        state.totalReviews = action.payload.totalReviews || 0;
        state.distribution = action.payload.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      })
      .addCase(fetchCourseReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Submit
      .addCase(submitReview.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        state.isSubmitting = false;
        if (action.payload.review) {
          state.reviews.unshift(action.payload.review);
        }
        if (action.payload.courseRating !== undefined) {
          state.averageRating = action.payload.courseRating;
        }
        if (action.payload.totalReviews !== undefined) {
          state.totalReviews = action.payload.totalReviews;
        }
        state.successMessage = 'Review submitted successfully!';
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload;
      })

      // Update
      .addCase(updateReview.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.isSubmitting = false;
        const updated = action.payload.review;
        if (updated) {
          state.reviews = state.reviews.map((r) => (r._id === updated._id ? updated : r));
        }
        if (action.payload.courseRating !== undefined) {
          state.averageRating = action.payload.courseRating;
        }
        state.successMessage = 'Review updated successfully!';
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload;
      })

      // Delete
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.reviews = state.reviews.filter((r) => r._id !== action.payload.reviewId);
        if (action.payload.totalReviews !== undefined) {
          state.totalReviews = action.payload.totalReviews;
        }
        if (action.payload.courseRating !== undefined) {
          state.averageRating = action.payload.courseRating;
        }
        state.successMessage = 'Review deleted.';
      });
  },
});

export const { clearReviewStatus, resetReviews } = reviewSlice.actions;
export default reviewSlice.reducer;
