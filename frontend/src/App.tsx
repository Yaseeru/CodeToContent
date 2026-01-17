import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AuthCallback from './components/AuthCallback';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './contexts/ToastContext';

function App() {
     return (
          <ErrorBoundary>
               <ToastProvider>
                    <Router>
                         <Routes>
                              <Route path="/" element={<LandingPage />} />
                              <Route path="/auth/callback" element={<AuthCallback />} />
                              <Route
                                   path="/dashboard"
                                   element={
                                        <ProtectedRoute>
                                             <Dashboard />
                                        </ProtectedRoute>
                                   }
                              />
                         </Routes>
                    </Router>
               </ToastProvider>
          </ErrorBoundary>
     );
}

export default App;
