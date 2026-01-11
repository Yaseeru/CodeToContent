import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
     children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
     const token = localStorage.getItem('jwt');

     // Check if JWT exists
     if (!token) {
          return <Navigate to="/" replace />;
     }

     // Basic JWT validation - check if it's not empty and has proper structure
     const isValidToken = token.split('.').length === 3;

     if (!isValidToken) {
          localStorage.removeItem('jwt');
          return <Navigate to="/" replace />;
     }

     return <>{children}</>;
};

export default ProtectedRoute;
