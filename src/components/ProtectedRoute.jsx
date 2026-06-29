import { useSelector } from 'react-redux';
import { Navigate } from 'react-router';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

/**
 * Wraps a route and only renders children when the user is authenticated.
 * While auth status is resolving (status === 'loading' or 'idle'), shows a
 * centered spinner. Once resolved, unauthenticated users are redirected to "/".
 *
 * Usage in main.jsx:
 *   <Route path="/products" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, status } = useSelector((state) => state.user);

  if (status === 'idle' || status === 'loading') {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress sx={{ color: '#165d46' }} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
