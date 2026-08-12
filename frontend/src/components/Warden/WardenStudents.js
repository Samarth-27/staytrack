import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../api/config';

const API_URL = API_BASE_URL;

function WardenStudents({ token }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [newStudent, setNewStudent] = useState({ name: '', username: '', password: '', roomNumber: '' });
  
  // New State variables for features
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  
  const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isAlert: false });
  const showConfirm = (title, message, onConfirm) => setModalState({ isOpen: true, title, message, onConfirm, isAlert: false });
  const showAlert = (title, message) => setModalState({ isOpen: true, title, message, onConfirm: null, isAlert: true });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API_URL}/warden/students`, { headers: { Authorization: `Bearer ${token}` } });
      setStudents(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/auth/register`, { ...newStudent, role: 'student' });
      showMessage('✓ Student created successfully!', 'success');
      setNewStudent({ name: '', username: '', password: '', roomNumber: '' });
      setShowForm(false);
      fetchStudents();
    } catch (error) {
      showMessage('✗ Error: ' + (error.response?.data?.message || 'Failed'), 'error');
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 5000);
  };

  // Archive Student
  const handleArchive = (studentId) => {
    showConfirm("Archive Student", "Are you sure you want to archive this student? Room will be freed.", async () => {
      try {
        await axios.post(`${API_URL}/warden/archive-student/${studentId}`, { reason: 'Checkout' }, { headers: { Authorization: `Bearer ${token}` } });
        showMessage('✓ Student archived successfully.', 'success');
        fetchStudents();
      } catch (error) {
        showMessage('✗ Cannot archive: ' + (error.response?.data?.message || 'Error occurred.'), 'error');
      }
    });
  };

  // Reactivate Student
  const handleReactivate = async (studentId) => {
    try {
      await axios.put(`${API_URL}/warden/reactivate-student/${studentId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      showMessage('✓ Student reactivated successfully.', 'success');
      fetchStudents();
    } catch (error) {
      showMessage('✗ Cannot reactivate: ' + (error.response?.data?.message || 'Error occurred.'), 'error');
    }
  };

  // Reset Individual Password
  const handleResetPassword = (studentId) => {
    showConfirm("Reset Password", "Are you sure you want to reset this student's password?", async () => {
      try {
        const res = await axios.put(`${API_URL}/warden/reset-password/${studentId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
        showAlert("Password Reset Successful", `Username: ${res.data.credentials.username}\nNew Password: ${res.data.credentials.newPassword}\n\nPlease share this with the student safely.`);
      } catch (error) {
        showMessage('✗ Password reset failed.', 'error');
      }
    });
  };

  // Bulk Reset Passwords
  const handleBulkReset = () => {
    if (selectedStudents.length === 0) {
      return showMessage('Please select students first.', 'error');
    }
    showConfirm("Bulk Reset", `Reset passwords for ${selectedStudents.length} students?`, async () => {
      try {
        const res = await axios.post(`${API_URL}/warden/bulk-reset-passwords`, 
          { studentIds: selectedStudents }, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const creds = res.data.credentials.map(c => `${c.name} (${c.username}) - ${c.newPassword}`).join('\n');
        
        // Download as txt
        const element = document.createElement("a");
        const file = new Blob([creds], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = "new_credentials.txt";
        document.body.appendChild(element);
        element.click();
        
        showMessage('✓ Bulk reset successful. Credentials downloaded.', 'success');
        setSelectedStudents([]);
      } catch (error) {
        showMessage('✗ Bulk reset failed.', 'error');
      }
    });
  };

  const toggleSelection = (id) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const filteredStudents = students.filter(s => showArchived ? s.status === 'archived' : s.status !== 'archived');

  if (loading) return <div className="loading">Loading students...</div>;

  return (
    <div className="students-container">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Student Management</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? '👁️ Show Active' : '📦 Show Archived'}
          </button>
          {!showArchived && (
            <>
              <button className="btn-warning" onClick={handleBulkReset} disabled={selectedStudents.length === 0}>
                🔄 Reset Passwords ({selectedStudents.length})
              </button>
              <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                {showForm ? '✕ Cancel' : '➕ Add New Student'}
              </button>
            </>
          )}
        </div>
      </div>
      
      {showForm && !showArchived && (
        <form className="form-card" onSubmit={handleCreateStudent} style={{ marginBottom: '20px', padding: '20px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
          <h3>Create Student Account</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={newStudent.name} onChange={(e) => setNewStudent({...newStudent, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input type="text" value={newStudent.username} onChange={(e) => setNewStudent({...newStudent, username: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={newStudent.password} onChange={(e) => setNewStudent({...newStudent, password: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Room Number</label>
              <input type="number" value={newStudent.roomNumber} onChange={(e) => setNewStudent({...newStudent, roomNumber: parseInt(e.target.value)})} required />
            </div>
          </div>
          <button type="submit" className="btn-success" style={{ marginTop: '15px' }}>Create Student</button>
        </form>
      )}
      
      {message && <div className={`message ${message.includes('✓') ? 'success' : 'error'}`}>{message}</div>}
      
      <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--bg-surface)', textAlign: 'left' }}>
            {!showArchived && <th><input type="checkbox" onChange={(e) => setSelectedStudents(e.target.checked ? filteredStudents.map(s => s._id) : [])} checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0} /></th>}
            <th>Name</th>
            <th>Username</th>
            <th>Room</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.length > 0 ? (
            filteredStudents.map(student => (
              <tr key={student._id} style={{ borderBottom: '1px solid #ddd' }}>
                {!showArchived && <td><input type="checkbox" checked={selectedStudents.includes(student._id)} onChange={() => toggleSelection(student._id)} /></td>}
                <td>{student.name}</td>
                <td>{student.username}</td>
                <td>{student.roomNumber ? `Room ${student.roomNumber}` : 'Unassigned'}</td>
                <td><span className={`badge ${student.status === 'archived' ? 'archived' : 'active'}`}>{student.status === 'archived' ? 'Archived' : 'Active'}</span></td>
                <td>
                  {student.status !== 'archived' ? (
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button className="btn-small" onClick={() => handleResetPassword(student._id)}>Reset</button>
                      <button className="btn-small btn-danger" onClick={() => handleArchive(student._id)}>📦 Archive</button>
                    </div>
                  ) : (
                    <button className="btn-small btn-success" onClick={() => handleReactivate(student._id)}>✓ Reactivate</button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={showArchived ? "5" : "6"} className="no-data" style={{ textAlign: 'center', padding: '20px' }}>No {showArchived ? 'archived' : 'active'} students found</td></tr>
          )}
        </tbody>
      </table>
      
      {modalState.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-surface, #fff)', padding: '20px', borderRadius: '8px', minWidth: '300px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-primary, #000)' }}>{modalState.title}</h3>
            <p style={{ color: 'var(--text-secondary, #666)', whiteSpace: 'pre-line' }}>{modalState.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
              {!modalState.isAlert && <button className="btn-secondary" onClick={() => setModalState({ ...modalState, isOpen: false })}>Cancel</button>}
              <button className="btn-primary" onClick={() => {
                if (modalState.onConfirm) modalState.onConfirm();
                setModalState({ ...modalState, isOpen: false });
              }}>{modalState.isAlert ? 'OK' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default WardenStudents;
