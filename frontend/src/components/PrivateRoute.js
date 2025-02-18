import React from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user } = React.useContext(AuthContext);

  console.log('PrivateRoute - User:', user);

  if (!user) {
    console.log('User not authenticated, redirecting to /login');
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;