import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async Thunk: Register User
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.message || error.data?.message || 'Registration failed. Please try again.'
      );
    }
  }
);

// Async Thunk: Login User
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.message || error.data?.message || 'Invalid email or password.'
      );
    }
  }
);

// Async Thunk: Fetch Current User Profile
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      return response.data.user;
    } catch (error) {
      localStorage.removeItem('token');
      return rejectWithValue(
        error.message || 'Session expired. Please log in again.'
      );
    }
  }
);

// Async Thunk: Update User Profile
export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.message || error.data?.message || 'Failed to update profile'
      );
    }
  }
);

// Async Thunk: Change Password
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const response = await api.put('/users/change-password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.message || error.data?.message || 'Failed to update password'
      );
    }
  }
);

// Async Thunk: Logout
export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/auth/logout');
  } catch (err) {
    // Ignore server error on logout
  } finally {
    localStorage.removeItem('token');
  }
});

const initialToken = localStorage.getItem('token');

const initialState = {
  user: null,
  token: initialToken || null,
  isAuthenticated: !!initialToken,
  isLoading: !!initialToken, // Initial loading true if token needs verification
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      })

      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      })

      // Fetch Current User
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })

      // Update Profile
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        if (action.payload.user) {
          state.user = { ...state.user, ...action.payload.user };
        }
      })

      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
