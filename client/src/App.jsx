import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchCurrentUser } from './features/auth/authSlice';
import AppRoutes from './routes/AppRoutes';

export function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch]);

  return <AppRoutes />;
}

export default App;
