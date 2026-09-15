import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async Thunk: Fetch Wishlist
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/wishlist');
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.message || error.data?.message || 'Failed to load wishlist'
      );
    }
  }
);

// Async Thunk: Add to Wishlist
export const addToWishlist = createAsyncThunk(
  'wishlist/addToWishlist',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/wishlist/${courseId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.message || error.data?.message || 'Failed to add to wishlist'
      );
    }
  }
);

// Async Thunk: Remove from Wishlist
export const removeFromWishlist = createAsyncThunk(
  'wishlist/removeFromWishlist',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/wishlist/${courseId}`);
      return { courseId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.message || error.data?.message || 'Failed to remove from wishlist'
      );
    }
  }
);

const initialState = {
  wishlist: [],
  wishlistIds: [],
  isLoading: false,
  error: null,
};

export const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearWishlistState: (state) => {
      state.wishlist = [];
      state.wishlistIds = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Wishlist
      .addCase(fetchWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.wishlist = action.payload.wishlist || [];
        state.wishlistIds = (action.payload.wishlist || []).map((item) =>
          typeof item === 'object' ? item._id : item
        );
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Add to Wishlist
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.wishlist = action.payload.wishlist || [];
        state.wishlistIds = (action.payload.wishlist || []).map((item) =>
          typeof item === 'object' ? item._id : item
        );
      })

      // Remove from Wishlist
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.wishlist = state.wishlist.filter((c) => (c._id || c) !== action.payload.courseId);
        state.wishlistIds = state.wishlistIds.filter((id) => id !== action.payload.courseId);
      });
  },
});

export const { clearWishlistState } = wishlistSlice.actions;
export default wishlistSlice.reducer;
