import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/Auth/LoginPage';
import OwnerDashboard from './components/Owner/OwnerDashboard';
import WardenDashboard from './components/Warden/WardenDashboard';
import StudentDashboard from './components/Student/StudentDashboard';
import './App.css';

/**
 * MAIN APP COMPONENT
 * Handles routing and user authentication
 * Routes between different dashboards based on role
 */
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parsing saved user:', e);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Login Route */}
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" /> : <LoginPage onLogin={handleLogin} />} 
        />

        {/* Dashboard Route - Route to correct dashboard based on role */}
        <Route 
          path="/dashboard" 
          element={
            user ? (
              user.role === 'owner' ? (
                <OwnerDashboard user={user} token={localStorage.getItem('token')} onLogout={handleLogout} />
              ) : user.role === 'warden' ? (
                <WardenDashboard user={user} token={localStorage.getItem('token')} onLogout={handleLogout} />
              ) : (
                <StudentDashboard user={user} token={localStorage.getItem('token')} onLogout={handleLogout} />
              )
            ) : (
              <Navigate to="/" />
            )
          } 
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
