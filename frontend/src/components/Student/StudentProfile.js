import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../api/config';

const API_URL = API_BASE_URL;

function StudentProfile({ token }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/student/profile?t=${new Date().getTime()}`, {
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
        <div className="form-card" style={{ marginTop: '20px' }}>
          <h3>Room Details</h3>
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

      <div className="form-card" style={{ marginTop: '20px', background: 'var(--bg-hover)' }}>
        <h3>🍔 Mess & Hostel Presence</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Let the Warden know if you are currently eating at the mess or if you have gone home.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '15px', fontWeight: '500' }}>Current Status:</span>
          <button 
            onClick={async () => {
              const newStatus = student.presenceStatus === 'on_leave' ? 'in_hostel' : 'on_leave';
              
              // Optimistic UI update
              setProfile({ ...profile, student: { ...student, presenceStatus: newStatus } });
              
              try {
                await axios.put(`${API_URL}/student/presence`, { presenceStatus: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
              } catch (error) {
                // Revert on failure
                setProfile({ ...profile, student: { ...student, presenceStatus: student.presenceStatus } });
                alert('Failed to update status: ' + (error.response?.data?.message || error.message));
              }
            }}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
              background: student.presenceStatus === 'on_leave' ? 'var(--warning)' : 'var(--success)',
              color: '#000'
            }}
          >
            {student.presenceStatus === 'on_leave' ? '🔴 On Leave (At Home)' : '🟢 In Hostel'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentProfile;
