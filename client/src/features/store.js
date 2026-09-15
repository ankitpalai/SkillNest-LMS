import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/authSlice.js';
import courseReducer from './courses/courseSlice.js';
import instructorReducer from './instructor/instructorSlice.js';
import enrollmentReducer from './enrollment/enrollmentSlice.js';
import reviewReducer from './reviews/reviewSlice.js';
import wishlistReducer from './wishlist/wishlistSlice.js';
import adminReducer from './admin/adminSlice.js';
import paymentReducer from './payment/paymentSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: courseReducer,
    instructor: instructorReducer,
    enrollment: enrollmentReducer,
    reviews: reviewReducer,
    wishlist: wishlistReducer,
    admin: adminReducer,
    payment: paymentReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
