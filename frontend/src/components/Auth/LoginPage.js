import React, { useState } from 'react';
import api from '../../api/config';

/**
 * LOGIN PAGE COMPONENT
 * Handles user authentication
 * Takes username & password, returns JWT token
 */
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await api.post('/auth/login', { 
        username, 
        password 
      });
      
      // Support both old backend (response.data.token) and new backend (response.data.data.token)
      const token = response.data.token || response.data.data?.token;
      let user = response.data.user || response.data.data;

      if (!token || !user) {
        throw new Error('Invalid response format from server');
      }

      // Ensure role is normalized to lowercase for consistent frontend routing
      if (user.role) {
        user = { ...user, role: user.role.toLowerCase() };
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to backend server. Please ensure backend is running and REACT_APP_API_URL is configured.');
      } else {
        setError(err.response.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🏢 StayTrack</h1>
        <h2>Hostel Management System</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">❌ {error}</div>}

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? '🔄 Logging in...' : '🔓 Login'}
          </button>
        </form>

        <div className="demo-credentials">
          <strong>📝 Demo Credentials:</strong>
          <p><strong>Owner:</strong> owner / owner@123</p>
          <p><strong>Warden:</strong> warden / warden@123</p>
          <p style={{marginTop: '10px', fontSize: '11px', fontStyle: 'italic'}}>
            💡 Create student accounts via Warden dashboard
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
