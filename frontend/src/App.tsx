import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AuthCallback from './components/AuthCallback';
import ProtectedRoute from './components/ProtectedRoute';

// Placeholder Dashboard component
const Dashboard: React.FC = () => {
     return (
          <div className="min-h-screen bg-dark-bg text-dark-text">
               <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="mt-4 text-dark-text-secondary">
                         Welcome to CodeToContent
                    </p>
               </div>
          </div>
     );
};

function App() {
     return (
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
     );
}

export default App;
