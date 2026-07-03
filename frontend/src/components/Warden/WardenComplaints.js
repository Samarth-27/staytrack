import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function WardenComplaints({ token }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => { fetchComplaints(); }, []);

  const fetchComplaints = async () => {
    try {
      const response = await axios.get(`${API_URL}/warden/complaints`, { headers: { Authorization: `Bearer ${token}` } });
      setComplaints(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateComplaint = async (complaintId, newStatus) => {
    let responseText = '';
    if (newStatus === 'in-progress') {
      responseText = window.prompt('Enter your response to the student (e.g., "Maintenance is on the way"):', 'Working on it');
      if (responseText === null) return; // User cancelled
    } else if (newStatus === 'resolved') {
      responseText = window.prompt('Enter resolution note:', 'Issue has been resolved.');
      if (responseText === null) return; // User cancelled
    }

    setUpdatingId(complaintId);
    try {
      await axios.put(`${API_URL}/warden/complaint/${complaintId}`, { status: newStatus, wardenResponse: responseText }, { headers: { Authorization: `Bearer ${token}` } });
      fetchComplaints();
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="loading">🔴 Loading complaints...</div>;

  return (
    <div className="complaints-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Title</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {complaints.length > 0 ? (
            complaints.map(complaint => (
              <tr key={complaint._id}>
                <td>{complaint.student?.name || 'Unknown Student'} (Room {complaint.room?.roomNumber || '?'})</td>
                <td>{complaint.title}</td>
                <td><span className={`priority ${complaint.priority}`}>{complaint.priority}</span></td>
                <td><span className={`status ${complaint.status}`}>{complaint.status}</span></td>
                <td>
                  {complaint.status === 'open' && <button className="btn-small" onClick={() => handleUpdateComplaint(complaint._id, 'in-progress')}>Start</button>}
                  {complaint.status === 'in-progress' && <button className="btn-small success" onClick={() => handleUpdateComplaint(complaint._id, 'resolved')}>Resolve</button>}
                  {complaint.status === 'resolved' && <span>✓</span>}
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="5" className="no-data">No complaints</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
export default WardenComplaints;
