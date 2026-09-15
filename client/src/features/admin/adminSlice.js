import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async Thunk: Fetch Admin Dashboard Stats
export const fetchAdminStats = createAsyncThunk(
  'admin/fetchAdminStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/stats');
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.message || error.data?.message || 'Failed to fetch admin stats'
      );
    }
  }
);

// Async Thunk: Fetch Admin Users List (Paginated, Filterable, Searchable)
export const fetchAdminUsers = createAsyncThunk(
  'admin/fetchAdminUsers',
  async ({ page = 1, limit = 10, search = '', role = 'all' } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page);
      if (limit) params.append('limit', limit);
      if (search) params.append('search', search);
      if (role && role !== 'all') params.append('role', role);

      const response = await api.get(`/admin/users?${params.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.message || error.data?.message || 'Failed to fetch users'
      );
    }
  }
);

// Async Thunk: Update User Role
export const updateUserRoleThunk = createAsyncThunk(
  'admin/updateUserRole',
  async ({ userId, role }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/admin/users/${userId}/role`, { role });
      return { userId, role, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.message || error.data?.message || 'Failed to update user role'
      );
    }
  }
);

// Async Thunk: Delete User
export const deleteUserThunk = createAsyncThunk(
  'admin/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      return { userId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.message || error.data?.message || 'Failed to delete user'
      );
    }
  }
);

// Async Thunk: Fetch Admin Courses (Paginated, Searchable, Filterable)
export const fetchAdminCourses = createAsyncThunk(
  'admin/fetchAdminCourses',
  async ({ page = 1, limit = 10, search = '', status = 'all' } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page);
      if (limit) params.append('limit', limit);
      if (search) params.append('search', search);
      if (status && status !== 'all') params.append('status', status);

      const response = await api.get(`/admin/courses?${params.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.message || error.data?.message || 'Failed to fetch courses'
      );
    }
  }
);

// Async Thunk: Toggle Course Status
export const toggleAdminCourseStatus = createAsyncThunk(
  'admin/toggleCourseStatus',
  async ({ courseId, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/admin/courses/${courseId}/status`, { status });
      return { courseId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.message || error.data?.message || 'Failed to change course status'
      );
    }
  }
);

// Async Thunk: Delete Course
export const deleteAdminCourseThunk = createAsyncThunk(
  'admin/deleteCourse',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/admin/courses/${courseId}`);
      return { courseId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.message || error.data?.message || 'Failed to delete course'
      );
    }
  }
);

// Async Thunk: Fetch Categories for Admin
export const fetchAdminCategories = createAsyncThunk(
  'admin/fetchAdminCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/categories');
      return response.data.categories;
    } catch (error) {
      return rejectWithValue(
        error.message || error.data?.message || 'Failed to fetch categories'
      );
    }
  }
);

// Async Thunk: Create Category
export const createCategoryThunk = createAsyncThunk(
  'admin/createCategory',
  async ({ name, description }, { rejectWithValue }) => {
    try {
      const response = await api.post('/categories', { name, description });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to create category'
      );
    }
  }
);

// Async Thunk: Update Category
export const updateCategoryThunk = createAsyncThunk(
  'admin/updateCategory',
  async ({ categoryId, name, description }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/categories/${categoryId}`, { name, description });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to update category'
      );
    }
  }
);

// Async Thunk: Delete Category
export const deleteCategoryThunk = createAsyncThunk(
  'admin/deleteCategory',
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/categories/${categoryId}`);
      return { categoryId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to delete category'
      );
    }
  }
);

const initialState = {
  stats: null,
  isStatsLoading: false,
  users: [],
  totalUsers: 0,
  totalPages: 1,
  currentPage: 1,
  isUsersLoading: false,
  courses: [],
  totalCourses: 0,
  totalCoursePages: 1,
  currentCoursePage: 1,
  isCoursesLoading: false,
  categories: [],
  isCategoriesLoading: false,
  actionLoading: false,
  error: null,
  successMessage: null,
};

export const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Stats
      .addCase(fetchAdminStats.pending, (state) => {
        state.isStatsLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.isStatsLoading = false;
        state.stats = action.payload.stats;
      })
      .addCase(fetchAdminStats.rejected, (state, action) => {
        state.isStatsLoading = false;
        state.error = action.payload;
      })

      // Users
      .addCase(fetchAdminUsers.pending, (state) => {
        state.isUsersLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.isUsersLoading = false;
        state.users = action.payload.users || [];
        state.totalUsers = action.payload.totalUsers || 0;
        state.totalPages = action.payload.totalPages || 1;
        state.currentPage = action.payload.currentPage || 1;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.isUsersLoading = false;
        state.error = action.payload;
      })

      // Update Role
      .addCase(updateUserRoleThunk.fulfilled, (state, action) => {
        state.users = state.users.map((u) =>
          u._id === action.payload.userId ? { ...u, role: action.payload.role } : u
        );
        state.successMessage = action.payload.message || 'User role updated successfully';
      })
      .addCase(updateUserRoleThunk.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Delete User
      .addCase(deleteUserThunk.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u._id !== action.payload.userId);
        state.totalUsers = Math.max(0, state.totalUsers - 1);
        state.successMessage = 'User deleted successfully';
      })
      .addCase(deleteUserThunk.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Courses
      .addCase(fetchAdminCourses.pending, (state) => {
        state.isCoursesLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminCourses.fulfilled, (state, action) => {
        state.isCoursesLoading = false;
        state.courses = action.payload.courses || [];
        state.totalCourses = action.payload.totalCourses || 0;
        state.totalCoursePages = action.payload.totalPages || 1;
        state.currentCoursePage = action.payload.currentPage || 1;
      })
      .addCase(fetchAdminCourses.rejected, (state, action) => {
        state.isCoursesLoading = false;
        state.error = action.payload;
      })

      // Toggle Course Status
      .addCase(toggleAdminCourseStatus.fulfilled, (state, action) => {
        state.courses = state.courses.map((c) =>
          c._id === action.payload.courseId
            ? { ...c, status: action.payload.status || (c.status === 'published' ? 'draft' : 'published') }
            : c
        );
        state.successMessage = action.payload.message || 'Course status updated successfully';
      })
      .addCase(toggleAdminCourseStatus.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Delete Course
      .addCase(deleteAdminCourseThunk.fulfilled, (state, action) => {
        state.courses = state.courses.filter((c) => c._id !== action.payload.courseId);
        state.totalCourses = Math.max(0, state.totalCourses - 1);
        state.successMessage = 'Course deleted successfully';
      })
      .addCase(deleteAdminCourseThunk.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Categories
      .addCase(fetchAdminCategories.pending, (state) => {
        state.isCategoriesLoading = true;
      })
      .addCase(fetchAdminCategories.fulfilled, (state, action) => {
        state.isCategoriesLoading = false;
        state.categories = action.payload || [];
      })
      .addCase(fetchAdminCategories.rejected, (state, action) => {
        state.isCategoriesLoading = false;
        state.error = action.payload;
      })
      .addCase(createCategoryThunk.fulfilled, (state, action) => {
        if (action.payload.category) {
          state.categories.push({ ...action.payload.category, courseCount: 0 });
        }
        state.successMessage = 'Category created successfully';
      })
      .addCase(createCategoryThunk.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateCategoryThunk.fulfilled, (state, action) => {
        if (action.payload.category) {
          state.categories = state.categories.map((c) =>
            c._id === action.payload.category._id
              ? { ...c, ...action.payload.category }
              : c
          );
        }
        state.successMessage = 'Category updated successfully';
      })
      .addCase(updateCategoryThunk.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(deleteCategoryThunk.fulfilled, (state, action) => {
        state.categories = state.categories.filter((c) => c._id !== action.payload.categoryId);
        state.successMessage = 'Category deleted successfully';
      })
      .addCase(deleteCategoryThunk.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearAdminStatus } = adminSlice.actions;
export default adminSlice.reducer;
