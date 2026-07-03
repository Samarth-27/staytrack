import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://staytrack-backend-ijng.onrender.com/api';

function StudentProfile({ token }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/student/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">📋 Loading profile...</div>;
  if (!profile) return <div className="error">Failed to load profile</div>;

  const { student, room } = profile;

  return (
    <div className="profile-container">
      <div className="form-card">
        <h3>📋 My Profile</h3>
        <div className="form-group">
          <label>Full Name</label>
          <input type="text" value={student.name} disabled />
        </div>
        <div className="form-group">
          <label>Username</label>
          <input type="text" value={student.username} disabled />
        </div>
      </div>

      {room && (
        <div className="form-card">
          <h3>🚪 Room Details</h3>
          <div className="form-group">
            <label>Room Number</label>
            <input type="text" value={`Room ${room.roomNumber}`} disabled />
          </div>
          <div className="form-group">
            <label>Monthly Rent</label>
            <input type="text" value={`₹${room.rentAmount}`} disabled />
          </div>
          {room.students && room.students.length > 0 && (
            <div className="form-group">
              <label>Roommates</label>
              <input type="text" value={room.students.map(s => s.name).join(', ')} disabled />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StudentProfile;
