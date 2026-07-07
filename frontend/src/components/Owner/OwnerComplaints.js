import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

function OwnerComplaints({ token }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await axios.get(`${API_URL}/owner/complaints`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(response.data);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredComplaints = filterStatus === 'all' 
    ? complaints 
    : complaints.filter(c => c.status === filterStatus);

  if (loading) return <div className="loading">Loading complaints...</div>;

  return (
    <div className="complaints-container">
      <div className="filter-section">
        <label>Filter by Status:</label>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Room</th>
            <th>Title</th>
            <th>Category</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {filteredComplaints.length > 0 ? (
            filteredComplaints.map(complaint => (
              <tr key={complaint._id}>
                <td>{complaint.student?.name || 'Unknown Student'}</td>
                <td>Room {complaint.room?.roomNumber || 'Unassigned'}</td>
                <td>{complaint.title}</td>
                <td><span className={`tag ${complaint.category}`}>{complaint.category}</span></td>
                <td><span className={`status ${complaint.status}`}>{complaint.status}</span></td>
                <td><span className={`priority ${complaint.priority}`}>{complaint.priority}</span></td>
                <td>{new Date(complaint.createdAt).toLocaleDateString()}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="7" className="no-data">No complaints found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default OwnerComplaints;
