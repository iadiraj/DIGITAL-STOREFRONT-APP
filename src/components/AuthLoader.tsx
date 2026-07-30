import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setUser, logout } from '../store/slices/authSlice';
import { api } from '../lib/api';

export default function AuthLoader({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated && !user) {
      api.get('/users/profile')
        .then(res => {
          if (res.data.success) {
            dispatch(setUser(res.data.data.user));
          } else {
            dispatch(logout());
          }
        })
        .catch(() => {
          dispatch(logout());
        });
    }
  }, [isAuthenticated, user, dispatch]);

  return <>{children}</>;
}
