import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../api/config';
import StudentDossierModal from '../StudentDossierModal';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingDossierStudent, setViewingDossierStudent] = useState(null);
  const [checkoutModal, setCheckoutModal] = useState({ isOpen: false, student: null, reason: 'Course Completed / Left Hostel', depositAmount: 5000 });
  
  const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isAlert: false });
  const showConfirm = (title, message, onConfirm) => setModalState({ isOpen: true, title, message, onConfirm, isAlert: false });
  const showAlert = (title, message) => setModalState({ isOpen: true, title, message, onConfirm: null, isAlert: true });

  const [vacantRooms, setVacantRooms] = useState([]);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editName, setEditName] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchStudents(); fetchRooms(); }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API_URL}/warden/rooms`, { headers: { Authorization: `Bearer ${token}` } });
      setVacantRooms(response.data.filter(r => r.status === 'vacant'));
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

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
      await axios.post(
        `${API_URL}/auth/register`, 
        { ...newStudent, role: 'student' }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
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

  // Vacate / Checkout Student -> Free Room & Pass to Security Deposit Exchange
  const handleOpenCheckout = (student) => {
    setCheckoutModal({
      isOpen: true,
      student,
      reason: 'Course Completed / Left Hostel',
      depositAmount: 5000
    });
  };

  const handleConfirmCheckout = async () => {
    if (!checkoutModal.student) return;
    try {
      await axios.post(`${API_URL}/security-deposits/checkout-student`, {
        studentId: checkoutModal.student._id,
        leaveReason: checkoutModal.reason,
        originalDepositAmount: Number(checkoutModal.depositAmount) || 5000
      }, { headers: { Authorization: `Bearer ${token}` } });

      showMessage(`✓ ${checkoutModal.student.name} checked out: Room freed & passed to Security Deposit Exchange list!`, 'success');
      setCheckoutModal({ isOpen: false, student: null, reason: '', depositAmount: 5000 });
      fetchStudents();
      fetchRooms();
    } catch (error) {
      showMessage('✗ Error checking out: ' + (error.response?.data?.message || error.message), 'error');
    }
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

  const handleEditClick = (student) => {
    setEditingStudentId(student._id);
    setEditName(student.name);
  };

  const handleSaveName = async (studentId) => {
    try {
      await axios.put(`${API_URL}/warden/student/${studentId}`, { name: editName }, { headers: { Authorization: `Bearer ${token}` } });
      setEditingStudentId(null);
      fetchStudents();
      showMessage('✓ Student name updated', 'success');
    } catch (error) {
      showMessage('✗ Error updating name', 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingStudentId(null);
  };

  const filteredStudents = students.filter(s => {
    const matchesArchive = showArchived ? s.status === 'archived' : s.status !== 'archived';
    if (!matchesArchive) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(term)) ||
      (s.username && s.username.toLowerCase().includes(term)) ||
      (s.roomNumber && String(s.roomNumber).includes(term)) ||
      (s.collegeName && s.collegeName.toLowerCase().includes(term)) ||
      (s.studyStatus && s.studyStatus.toLowerCase().includes(term)) ||
      (s.aadharNumber && s.aadharNumber.includes(term))
    );
  });

  if (loading) return <div className="loading">Loading students...</div>;

  const activeStudents = students.filter(s => s.status !== 'archived');
  const inMessCount = activeStudents.filter(s => s.presenceStatus !== 'on_leave').length;

  return (
    <div className="students-container">
      {!showArchived && (
        <div className="summary-cards" style={{ marginBottom: '24px' }}>
          <div className="card">
            <h4>Total Active Students</h4>
            <p className="amount">{activeStudents.length}</p>
          </div>
          <div className="card" style={{ background: 'var(--bg-hover)', borderColor: 'var(--success)' }}>
            <h4>🍔 Students in Mess</h4>
            <p className="amount" style={{ color: 'var(--success)' }}>{inMessCount}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Currently marked as "In Hostel"</p>
          </div>
          <div className="card" style={{ borderColor: 'var(--warning)' }}>
            <h4>🔴 Students on Leave</h4>
            <p className="amount" style={{ color: 'var(--warning)' }}>{activeStudents.length - inMessCount}</p>
          </div>
        </div>
      )}

      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Student Management & KYC</h2>
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

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', margin: '16px 0' }}>
        <input 
          type="text" 
          placeholder="🔍 Search students by name, room, college, study status, aadhaar..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border-dim, #333)',
            background: 'var(--bg-surface, #121212)',
            color: '#fff',
            fontSize: '13px'
          }}
        />
        {searchTerm && (
          <button 
            className="btn-secondary" 
            onClick={() => setSearchTerm('')}
            style={{ padding: '8px 14px' }}
          >
            Clear
          </button>
        )}
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
              <select value={newStudent.roomNumber} onChange={(e) => setNewStudent({...newStudent, roomNumber: e.target.value ? parseInt(e.target.value) : ''})} required>
                <option value="" disabled>Select a vacant room</option>
                {vacantRooms.map(r => (
                  <option key={r._id} value={r.roomNumber}>Room {r.roomNumber} (Capacity: {r.capacity})</option>
                ))}
              </select>
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
            <th>Student Details</th>
            <th>Room</th>
            <th>Study Status & College</th>
            <th>KYC Verification</th>
            <th>Presence</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.length > 0 ? (
            filteredStudents.map(student => {
              const completion = student.profileCompletionPercentage !== undefined 
                ? student.profileCompletionPercentage 
                : (student.profileCompleted ? 100 : 35);

              return (
                <tr key={student._id} style={{ borderBottom: '1px solid #262626' }}>
                  {!showArchived && (
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedStudents.includes(student._id)} 
                        onChange={() => toggleSelection(student._id)} 
                      />
                    </td>
                  )}
                  <td>
                    {editingStudentId === student._id ? (
                      <div style={{display:'flex', gap:'5px', alignItems:'center'}}>
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{padding:'4px', width:'120px'}} />
                        <button className="btn-small success" onClick={() => handleSaveName(student._id)} title="Save Name">💾</button>
                        <button className="btn-small danger" onClick={handleCancelEdit} title="Cancel">✕</button>
                      </div>
                    ) : (
                      <div>
                        <div style={{display:'flex', gap:'6px', alignItems:'center'}}>
                          <strong style={{ color: 'var(--text-main, #fff)', fontSize: '14px' }}>{student.name}</strong>
                          {student.status !== 'archived' && (
                            <button style={{background:'none', border:'none', cursor:'pointer', fontSize:'13px'}} onClick={() => handleEditClick(student)} title="Edit Name">✏️</button>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted, #888)', marginTop: '2px' }}>
                          @{student.username} {student.phone ? `• 📞 ${student.phone}` : ''}
                        </div>
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: '600', color: '#60a5fa' }}>
                      {student.roomNumber ? `Room ${student.roomNumber}` : 'Unassigned'}
                    </span>
                  </td>
                  <td>
                    <div>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#60a5fa'
                      }}>
                        {student.studyStatus || 'Not Specified'}
                      </span>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted, #888)', marginTop: '3px' }}>
                        {student.collegeName || 'College Not Added'}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: completion >= 80 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                      color: completion >= 80 ? '#34d399' : '#fbbf24',
                      border: `1px solid ${completion >= 80 ? 'rgba(52, 211, 153, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`
                    }}>
                      {completion >= 80 ? `✓ KYC ${completion}%` : `⚠️ ${completion}%`}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: student.presenceStatus === 'on_leave' ? 'var(--warning, #fbbf24)' : 'var(--success, #34d399)'
                    }}>
                      {student.presenceStatus === 'on_leave' ? '🔴 On Leave' : '🟢 In Hostel'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button 
                        className="btn-small" 
                        onClick={() => setViewingDossierStudent(student)}
                        style={{
                          background: 'rgba(59, 130, 246, 0.2)',
                          color: '#60a5fa',
                          border: '1px solid rgba(59, 130, 246, 0.4)',
                          fontWeight: '600',
                          padding: '4px 8px'
                        }}
                        title="View Full Profile Dossier"
                      >
                        📋 Dossier
                      </button>

                      {student.status === 'active' ? (
                        <>
                          <button 
                            className="btn-small btn-danger" 
                            onClick={() => handleOpenCheckout(student)}
                            style={{ whiteSpace: 'nowrap' }}
                            title="Vacate room & pass to Security Deposit Exchange"
                          >
                            🚪 Checkout Room
                          </button>
                          <button className="btn-small" onClick={() => handleResetPassword(student._id)}>Reset</button>
                        </>
                      ) : student.status === 'pending_security_refund' ? (
                        <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: '600', padding: '3px 6px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                          ⏳ In Security Clearance
                        </span>
                      ) : (
                        <button className="btn-small btn-success" onClick={() => handleReactivate(student._id)}>✓ Reactivate</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr><td colSpan={showArchived ? "6" : "7"} className="no-data" style={{ textAlign: 'center', padding: '20px' }}>No {showArchived ? 'archived' : 'active'} students found</td></tr>
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

      {/* Checkout & Vacate Room Modal */}
      {checkoutModal.isOpen && checkoutModal.student && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div style={{
            background: 'var(--bg-surface, #141414)',
            padding: '24px',
            borderRadius: '10px',
            border: '1px solid var(--border-strong, #333)',
            maxWidth: '460px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-main, #fff)', fontSize: '17px' }}>
              🚪 Vacate Room & Initiate Deposit Exchange
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted, #aaa)', marginBottom: '16px', lineHeight: '1.5' }}>
              Checking out <strong>{checkoutModal.student.name}</strong> will remove them from <strong>{checkoutModal.student.roomNumber ? `Room ${checkoutModal.student.roomNumber}` : 'Room Unassigned'}</strong> immediately, free the room, and transfer them to the <strong>Security Deposit Exchange</strong> list awaiting refund settlement.
            </p>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>Reason for Leaving Hostel</label>
              <input 
                type="text" 
                value={checkoutModal.reason} 
                onChange={(e) => setCheckoutModal({ ...checkoutModal, reason: e.target.value })} 
                placeholder="e.g. Course completed, Relocating"
                style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>Security Deposit Amount (₹)</label>
              <input 
                type="number" 
                value={checkoutModal.depositAmount} 
                onChange={(e) => setCheckoutModal({ ...checkoutModal, depositAmount: e.target.value })} 
                style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                className="btn-secondary" 
                onClick={() => setCheckoutModal({ isOpen: false, student: null, reason: '', depositAmount: 5000 })}
                style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                className="btn-danger" 
                onClick={handleConfirmCheckout}
                style={{ padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
              >
                Vacate & Pass to Security List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Dossier Modal */}
      {viewingDossierStudent && (
        <StudentDossierModal 
          student={viewingDossierStudent} 
          onClose={() => setViewingDossierStudent(null)} 
        />
      )}
    </div>
  );
}
export default WardenStudents;
