import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../api/config';
import StudentDossierModal from '../StudentDossierModal';

const API_URL = API_BASE_URL;

function OwnerStudents({ token }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewingDossierStudent, setViewingDossierStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_URL}/owner/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data);
    } catch (err) {
      console.error('Error fetching students for owner:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => {
    // Status filter
    if (filterStatus === 'active' && s.status === 'archived') return false;
    if (filterStatus === 'archived' && s.status !== 'archived') return false;
    if (filterStatus === 'kyc_complete') {
      const comp = s.profileCompletionPercentage !== undefined ? s.profileCompletionPercentage : (s.profileCompleted ? 100 : 0);
      if (comp < 80) return false;
    }
    if (filterStatus === 'kyc_pending') {
      const comp = s.profileCompletionPercentage !== undefined ? s.profileCompletionPercentage : (s.profileCompleted ? 100 : 0);
      if (comp >= 80) return false;
    }
    if (filterStatus === 'in_hostel' && s.presenceStatus === 'on_leave') return false;
    if (filterStatus === 'on_leave' && s.presenceStatus !== 'on_leave') return false;

    // Search term
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(term)) ||
      (s.username && s.username.toLowerCase().includes(term)) ||
      (s.roomNumber && String(s.roomNumber).includes(term)) ||
      (s.collegeName && s.collegeName.toLowerCase().includes(term)) ||
      (s.course && s.course.toLowerCase().includes(term)) ||
      (s.studyStatus && s.studyStatus.toLowerCase().includes(term)) ||
      (s.aadharNumber && s.aadharNumber.includes(term)) ||
      (s.phone && s.phone.includes(term))
    );
  });

  const totalActive = students.filter(s => s.status !== 'archived').length;
  const kycCompleteCount = students.filter(s => {
    const comp = s.profileCompletionPercentage !== undefined ? s.profileCompletionPercentage : (s.profileCompleted ? 100 : 0);
    return comp >= 80;
  }).length;
  const inMessCount = students.filter(s => s.status !== 'archived' && s.presenceStatus !== 'on_leave').length;

  return (
    <div className="owner-students-container" style={{ paddingBottom: '30px' }}>
      
      {/* Header */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2>👥 Student Directory & Comprehensive KYC</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted, #888)' }}>
            Exhaustive profiles of all students including Aadhaar, academic study status, guardians, and emergency records.
          </p>
        </div>
        <button 
          className="btn-secondary" 
          onClick={fetchStudents}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ background: 'var(--bg-surface, #121212)', border: '1px solid var(--border-dim, #262626)', borderRadius: '10px', padding: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--text-muted, #888)' }}>Total Active Students</h4>
          <p className="amount" style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-main, #fff)' }}>{totalActive}</p>
        </div>

        <div className="card" style={{ background: 'var(--bg-surface, #121212)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '10px', padding: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--text-muted, #888)' }}>KYC Verified Students</h4>
          <p className="amount" style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#34d399' }}>{kycCompleteCount}</p>
          <span style={{ fontSize: '11px', color: 'var(--text-muted, #888)' }}>{totalActive ? Math.round((kycCompleteCount / totalActive) * 100) : 0}% of active residents</span>
        </div>

        <div className="card" style={{ background: 'var(--bg-surface, #121212)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '10px', padding: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--text-muted, #888)' }}>Pending Profile Details</h4>
          <p className="amount" style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#fbbf24' }}>{totalActive - kycCompleteCount}</p>
          <span style={{ fontSize: '11px', color: 'var(--text-muted, #888)' }}>Aadhaar or details missing</span>
        </div>

        <div className="card" style={{ background: 'var(--bg-surface, #121212)', border: '1px solid var(--border-dim, #262626)', borderRadius: '10px', padding: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--text-muted, #888)' }}>Active in Hostel Mess</h4>
          <p className="amount" style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#60a5fa' }}>{inMessCount}</p>
          <span style={{ fontSize: '11px', color: 'var(--text-muted, #888)' }}>Eating at mess currently</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="🔍 Search students by name, room, college, course, Aadhaar..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          style={{
            flex: '1 1 300px',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border-dim, #333)',
            background: 'var(--bg-surface, #121212)',
            color: '#fff',
            fontSize: '13px'
          }}
        />

        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border-dim, #333)',
            background: 'var(--bg-surface, #121212)',
            color: '#fff',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Students</option>
          <option value="active">Active Residents Only</option>
          <option value="kyc_complete">KYC Complete (100%)</option>
          <option value="kyc_pending">KYC Pending Action</option>
          <option value="in_hostel">Currently In Hostel</option>
          <option value="on_leave">Currently On Leave</option>
          <option value="archived">Archived Alumni</option>
        </select>

        {searchTerm && (
          <button 
            className="btn-secondary" 
            onClick={() => setSearchTerm('')}
            style={{ padding: '8px 14px' }}
          >
            Clear Search
          </button>
        )}
      </div>

      {error && <div className="message error" style={{ marginBottom: '16px' }}>{error}</div>}

      {/* Table */}
      {loading ? (
        <div className="loading" style={{ textAlign: 'center', padding: '40px' }}>Loading student records...</div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'var(--bg-surface, #121212)', borderRadius: '10px', border: '1px solid var(--border-dim, #262626)' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-base, #0a0a0a)', textAlign: 'left', borderBottom: '1px solid var(--border-dim, #262626)' }}>
                <th style={{ padding: '12px 16px' }}>Student Details</th>
                <th style={{ padding: '12px 16px' }}>Room</th>
                <th style={{ padding: '12px 16px' }}>Academic & Study Status</th>
                <th style={{ padding: '12px 16px' }}>Aadhaar (KYC)</th>
                <th style={{ padding: '12px 16px' }}>KYC Status</th>
                <th style={{ padding: '12px 16px' }}>Presence</th>
                <th style={{ padding: '12px 16px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => {
                  const completion = student.profileCompletionPercentage !== undefined 
                    ? student.profileCompletionPercentage 
                    : (student.profileCompleted ? 100 : 35);

                  const aadharMasked = student.aadharNumber 
                    ? `XXXX-XXXX-${String(student.aadharNumber).replace(/[\s-]/g, '').slice(-4)}`
                    : 'Pending';

                  return (
                    <tr key={student._id} style={{ borderBottom: '1px solid var(--border-dim, #222)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div>
                          <strong style={{ color: 'var(--text-main, #fff)', fontSize: '14px' }}>{student.name}</strong>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted, #888)', marginTop: '2px' }}>
                            @{student.username} {student.phone ? `• 📞 ${student.phone}` : ''}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontWeight: '600', color: '#60a5fa' }}>
                          {student.roomNumber ? `Room ${student.roomNumber}` : 'Unassigned'}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
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
                          <div style={{ fontSize: '12px', color: 'var(--text-main, #eee)', marginTop: '3px' }}>
                            {student.collegeName || 'College Not Added'}
                          </div>
                          {student.course && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted, #888)' }}>
                              {student.course} {student.currentYear ? `(${student.currentYear})` : ''}
                            </div>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          color: student.aadharNumber ? '#34d399' : 'var(--text-muted, #888)',
                          fontWeight: student.aadharNumber ? '600' : 'normal'
                        }}>
                          {aadharMasked}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block',
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

                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '500',
                          color: student.presenceStatus === 'on_leave' ? 'var(--warning, #fbbf24)' : 'var(--success, #34d399)'
                        }}>
                          {student.presenceStatus === 'on_leave' ? '🔴 On Leave' : '🟢 In Hostel'}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <button 
                          className="btn-small" 
                          onClick={() => setViewingDossierStudent(student)}
                          style={{
                            background: 'rgba(59, 130, 246, 0.2)',
                            color: '#60a5fa',
                            border: '1px solid rgba(59, 130, 246, 0.4)',
                            fontWeight: '600',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            borderRadius: '6px'
                          }}
                        >
                          📋 View Full Dossier
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted, #888)' }}>
                    No student records matching current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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

export default OwnerStudents;
