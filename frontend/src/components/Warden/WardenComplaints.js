import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../api/config';

const API_URL = API_BASE_URL;

function WardenComplaints({ token }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ isOpen: false, complaintId: null, newStatus: '', promptText: '' });
  const [inputValue, setInputValue] = useState('');

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

  const handleUpdateClick = (complaintId, newStatus) => {
    let promptText = '';
    let defaultValue = '';
    if (newStatus === 'in-progress') {
      promptText = 'Enter your response to the student:';
      defaultValue = 'Working on it';
    } else if (newStatus === 'resolved') {
      promptText = 'Enter resolution note:';
      defaultValue = 'Issue has been resolved.';
    }
    setInputValue(defaultValue);
    setModalState({ isOpen: true, complaintId, newStatus, promptText });
  };

  const confirmUpdate = async () => {
    const { complaintId, newStatus } = modalState;
    setUpdatingId(complaintId);
    setModalState({ isOpen: false, complaintId: null, newStatus: '', promptText: '' });
    try {
      await axios.put(`${API_URL}/warden/complaint/${complaintId}`, { status: newStatus, wardenResponse: inputValue }, { headers: { Authorization: `Bearer ${token}` } });
      fetchComplaints();
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="loading">Loading complaints...</div>;

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
                  {complaint.status === 'open' && <button className="btn-small" onClick={() => handleUpdateClick(complaint._id, 'in-progress')}>Start</button>}
                  {complaint.status === 'in-progress' && <button className="btn-small success" onClick={() => handleUpdateClick(complaint._id, 'resolved')}>Resolve</button>}
                  {complaint.status === 'resolved' && <span>✓</span>}
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="5" className="no-data">No complaints</td></tr>
          )}
        </tbody>
      </table>

      {modalState.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-surface, #fff)', padding: '20px', borderRadius: '8px', minWidth: '300px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-primary, #000)' }}>Update Complaint</h3>
            <p style={{ color: 'var(--text-secondary, #666)' }}>{modalState.promptText}</p>
            <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} style={{ width: '90%', padding: '10px', marginBottom: '15px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setModalState({ ...modalState, isOpen: false })}>Cancel</button>
              <button className="btn-primary" onClick={confirmUpdate}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default WardenComplaints;
