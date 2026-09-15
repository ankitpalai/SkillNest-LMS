import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

/**
 * Fetch courses with search, filtering, sorting, and pagination
 */
export const fetchCourses = createAsyncThunk(
  'courses/fetchCourses',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.category && params.category !== 'all') queryParams.append('category', params.category);
      if (params.level && params.level !== 'all') queryParams.append('level', params.level);
      if (params.price && params.price !== 'all') queryParams.append('price', params.price);
      if (params.sort) queryParams.append('sort', params.sort);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/courses?${queryString}` : '/courses';
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch courses';
      return rejectWithValue(message);
    }
  }
);

/**
 * Fetch single course details by ID
 */
export const fetchCourseDetails = createAsyncThunk(
  'courses/fetchCourseDetails',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      return response.data.course;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch course details';
      return rejectWithValue(message);
    }
  }
);

/**
 * Fetch all categories for filtering and tags
 */
export const fetchCategories = createAsyncThunk(
  'courses/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/categories');
      return response.data.categories;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch categories';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  courses: [],
  totalCourses: 0,
  totalPages: 1,
  currentPage: 1,
  selectedCourse: null,
  categories: [],
  isLoading: false,
  isDetailsLoading: false,
  error: null,
};

const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    clearSelectedCourse: (state) => {
      state.selectedCourse = null;
    },
    clearCourseError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Courses
      .addCase(fetchCourses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courses = action.payload.courses || [];
        state.totalCourses = action.payload.totalCourses || 0;
        state.totalPages = action.payload.totalPages || 1;
        state.currentPage = action.payload.currentPage || 1;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch Course Details
      .addCase(fetchCourseDetails.pending, (state) => {
        state.isDetailsLoading = true;
        state.error = null;
      })
      .addCase(fetchCourseDetails.fulfilled, (state, action) => {
        state.isDetailsLoading = false;
        state.selectedCourse = action.payload;
      })
      .addCase(fetchCourseDetails.rejected, (state, action) => {
        state.isDetailsLoading = false;
        state.error = action.payload;
      })

      // Fetch Categories
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload || [];
      });
  },
});

export const { clearSelectedCourse, clearCourseError } = courseSlice.actions;
export default courseSlice.reducer;
