import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

function StudentComplaints({ token }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'maintenance',
    priority: 'medium'
  });

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await axios.get(`${API_URL}/student/complaints`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/student/complaint`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('✓ Complaint submitted!');
      setForm({ title: '', description: '', category: 'maintenance', priority: 'medium' });
      setShowForm(false);
      fetchComplaints();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('✗ Error: ' + (error.response?.data?.message || 'Failed'));
    }
  };

  if (loading) return <div className="loading">Loading complaints...</div>;

  return (
    <div className="complaints-container">
      <div className="section-header">
        <h2>My Complaints</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '➕ New Complaint'}
        </button>
      </div>

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <h3>Submit Complaint</h3>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows="4"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="maintenance">Maintenance</option>
                <option value="cleanliness">Cleanliness</option>
                <option value="utilities">Utilities</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-success">Submit Complaint</button>
        </form>
      )}

      {message && <div className={`message ${message.includes('✓') ? 'success' : 'error'}`}>{message}</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {complaints.length > 0 ? (
            complaints.map(complaint => (
              <tr key={complaint._id}>
                <td>{complaint.title}</td>
                <td><span className={`tag ${complaint.category}`}>{complaint.category}</span></td>
                <td><span className={`priority ${complaint.priority}`}>{complaint.priority}</span></td>
                <td><span className={`status ${complaint.status}`}>{complaint.status}</span></td>
                <td>{new Date(complaint.createdAt).toLocaleDateString()}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="5" className="no-data">No complaints submitted</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default StudentComplaints;
