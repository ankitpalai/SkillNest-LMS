import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

/**
 * Fetch all enrolled courses for the logged-in student
 */
export const fetchMyEnrollments = createAsyncThunk(
  'enrollment/fetchMyEnrollments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/enrollments/my-courses');
      return response.data.enrollments;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch enrolled courses';
      return rejectWithValue(message);
    }
  }
);

/**
 * Fetch enrollment record and progress for a single course
 */
export const fetchCourseEnrollment = createAsyncThunk(
  'enrollment/fetchCourseEnrollment',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/enrollments/${courseId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch course enrollment';
      return rejectWithValue(message);
    }
  }
);

/**
 * Enroll student in a course
 */
export const enrollInCourse = createAsyncThunk(
  'enrollment/enrollInCourse',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.post('/enrollments', { courseId });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Enrollment failed';
      return rejectWithValue(message);
    }
  }
);

/**
 * Toggle lesson completion and update progress
 */
export const toggleLessonCompletion = createAsyncThunk(
  'enrollment/toggleLessonCompletion',
  async ({ courseId, lessonId, completed }, { rejectWithValue }) => {
    try {
      const payload = completed !== undefined ? { completed } : {};
      const response = await api.patch(`/enrollments/${courseId}/lessons/${lessonId}`, payload);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update lesson completion';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  myEnrollments: [],
  currentEnrollment: null,
  isEnrolledInCurrent: false,
  totalCourseLessons: 0,
  isLoading: false,
  isEnrolling: false,
  error: null,
};

const enrollmentSlice = createSlice({
  name: 'enrollment',
  initialState,
  reducers: {
    clearEnrollmentError: (state) => {
      state.error = null;
    },
    clearCurrentEnrollment: (state) => {
      state.currentEnrollment = null;
      state.isEnrolledInCurrent = false;
      state.totalCourseLessons = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch My Enrollments
      .addCase(fetchMyEnrollments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyEnrollments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myEnrollments = action.payload || [];
      })
      .addCase(fetchMyEnrollments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch Course Enrollment
      .addCase(fetchCourseEnrollment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourseEnrollment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isEnrolledInCurrent = Boolean(action.payload.enrolled);
        state.currentEnrollment = action.payload.enrollment || null;
        state.totalCourseLessons = action.payload.totalLessons || 0;
      })
      .addCase(fetchCourseEnrollment.rejected, (state, action) => {
        state.isLoading = false;
        state.isEnrolledInCurrent = false;
        state.currentEnrollment = null;
        state.error = action.payload;
      })

      // Enroll in Course
      .addCase(enrollInCourse.pending, (state) => {
        state.isEnrolling = true;
        state.error = null;
      })
      .addCase(enrollInCourse.fulfilled, (state, action) => {
        state.isEnrolling = false;
        state.isEnrolledInCurrent = true;
        state.currentEnrollment = action.payload.enrollment;
        if (action.payload.enrollment) {
          state.myEnrollments.unshift(action.payload.enrollment);
        }
      })
      .addCase(enrollInCourse.rejected, (state, action) => {
        state.isEnrolling = false;
        state.error = action.payload;
      })

      // Toggle Lesson Completion
      .addCase(toggleLessonCompletion.fulfilled, (state, action) => {
        if (state.currentEnrollment) {
          state.currentEnrollment.progress = action.payload.progress;
          state.currentEnrollment.completed = action.payload.completed;
          state.currentEnrollment.completedLessons = action.payload.completedLessons;
          if (action.payload.enrollment?.lastAccessedLesson) {
            state.currentEnrollment.lastAccessedLesson = action.payload.enrollment.lastAccessedLesson;
          }
        }

        // Also update the course in myEnrollments if present
        const idx = state.myEnrollments.findIndex(
          (e) => e.course?._id === action.payload.enrollment?.course
        );
        if (idx !== -1) {
          state.myEnrollments[idx].progress = action.payload.progress;
          state.myEnrollments[idx].completed = action.payload.completed;
          state.myEnrollments[idx].completedLessons = action.payload.completedLessons;
        }
      });
  },
});

export const { clearEnrollmentError, clearCurrentEnrollment } = enrollmentSlice.actions;
export default enrollmentSlice.reducer;
