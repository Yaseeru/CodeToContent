import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AuthCallback from './components/AuthCallback';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
     return (
          <ErrorBoundary>
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
          </ErrorBoundary>
     );
}

export default App;
