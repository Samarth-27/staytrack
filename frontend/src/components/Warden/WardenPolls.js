import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../api/config';

const servicePresets = [
  {
    category: 'plumber',
    label: 'Plumber Visit',
    icon: '🔧',
    title: 'Plumber Visiting Campus Tomorrow',
    desc: 'The plumber will be available for room repairs. Vote Yes if your bathroom, tap, or shower needs fixing.'
  },
  {
    category: 'electrician',
    label: 'Electrician Visit',
    icon: '⚡',
    title: 'Electrician Maintenance Schedule',
    desc: 'Electrician is coming to inspect lights, fans, switchboards, and wiring. Please report any electrical issues.'
  },
  {
    category: 'carpenter',
    label: 'Carpenter Visit',
    icon: '🪚',
    title: 'Carpenter Visit for Furniture Repairs',
    desc: 'Carpenter will be inspecting beds, study tables, cupboards, door latches, and window panes.'
  },
  {
    category: 'ac_repair',
    label: 'AC Repair & Service',
    icon: '❄️',
    title: 'AC Servicing & Filter Cleaning',
    desc: 'AC technician visiting for cooling check, gas refill, and filter cleaning. Let us know if your room AC has issues.'
  },
  {
    category: 'payment_reminder',
    label: 'Payment Deadline',
    icon: '💳',
    title: 'Monthly Rent & Mess Fee Notice',
    desc: 'Reminder: Monthly hostel fees are due by the 5th. Have you completed your online payment or physical cash submission?'
  },
  {
    category: 'cleaning',
    label: 'Deep Cleaning / Pest Control',
    icon: '🧹',
    title: 'Room Deep Cleaning & Pest Control',
    desc: 'Sanitization and pest control scheduled. Vote Yes if you want your room treated during this cycle.'
  }
];

function WardenPolls({ token }) {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPollForRooms, setSelectedPollForRooms] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'plumber',
    description: '',
    scheduledDate: '',
    options: ['Yes (Need repair)', 'No (All good)']
  });

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/polls/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPolls(response.data);
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (preset) => {
    setFormData({
      ...formData,
      category: preset.category,
      title: preset.title,
      description: preset.desc
    });
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_BASE_URL}/polls`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ text: '✓ Service poll created & broadcasted successfully!', type: 'success' });
      setShowCreateModal(false);
      setFormData({
        title: '',
        category: 'plumber',
        description: '',
        scheduledDate: '',
        options: ['Yes (Need repair)', 'No (All good)']
      });
      fetchPolls();
    } catch (error) {
      setMessage({ text: '✗ Error: ' + (error.response?.data?.message || 'Failed to create poll'), type: 'error' });
    }
  };

  const handleToggleStatus = async (pollId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'closed' : 'active';
    try {
      await axios.put(
        `${API_BASE_URL}/polls/${pollId}/status`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPolls();
    } catch (error) {
      alert('Error updating status: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeletePoll = async (pollId) => {
    if (!window.confirm('Are you sure you want to delete this poll?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/polls/${pollId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPolls();
      if (selectedPollForRooms?._id === pollId) setSelectedPollForRooms(null);
    } catch (error) {
      alert('Error deleting poll');
    }
  };

  const copyRoomList = (rooms, title) => {
    if (!rooms || rooms.length === 0) return alert('No rooms currently need service.');
    const text = `${title} - ROOM VISIT LIST:\n` + rooms.map(r => `• Room ${r.roomNumber}: ${r.studentName} (${r.issueDetails})`).join('\n');
    navigator.clipboard.writeText(text);
    alert('✓ Room visit list copied to clipboard! You can share this directly with the technician.');
  };

  if (loading) return <div className="loading">Loading service polls...</div>;

  return (
    <div className="warden-polls-container" style={{ padding: '10px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0' }}>🛠️ Service Polls & Maintenance Dispatch</h2>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            Poll students before plumber, electrician, carpenter, or AC technicians visit to collect the exact list of rooms needing repair.
          </p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
        >
          ➕ Create Service Poll
        </button>
      </div>

      {message.text && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '20px',
          borderRadius: '8px',
          backgroundColor: message.type === 'success' ? '#e8f5e9' : '#ffebee',
          color: message.type === 'success' ? '#2e7d32' : '#c62828',
          border: `1px solid ${message.type === 'success' ? '#a5d6a7' : '#ef9a9a'}`
        }}>
          {message.text}
        </div>
      )}

      {/* CREATE POLL MODAL */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '25px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>Create Service Visit Announcement / Poll</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Quick 1-Click Presets */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
                ⚡ Quick Presets (Click to autofill):
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {servicePresets.map(preset => (
                  <button
                    type="button"
                    key={preset.category}
                    onClick={() => handleApplyPreset(preset)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: '1px solid #cbd5e0',
                      backgroundColor: formData.category === preset.category ? '#e0e7ff' : '#f8fafc',
                      color: formData.category === preset.category ? '#3730a3' : '#334155',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{preset.icon}</span> {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreatePoll} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Plumber Visiting Tomorrow 10 AM"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
                >
                  <option value="plumber">🔧 Plumber</option>
                  <option value="electrician">⚡ Electrician</option>
                  <option value="carpenter">🪚 Carpenter</option>
                  <option value="ac_repair">❄️ AC Technician</option>
                  <option value="cleaning">🧹 Cleaning / Pest Control</option>
                  <option value="payment_reminder">💳 Payment Deadline</option>
                  <option value="general">📢 General Announcement</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Scheduled Date / Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Description / Message</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe details of the visit or deadline instructions..."
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid #cbd5e0', background: '#fff', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 20px', borderRadius: '6px' }}>
                  Launch Poll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POLLS LIST */}
      {polls.length === 0 ? (
        <div className="card" style={{ padding: '30px', textAlign: 'center', color: '#7f8c8d' }}>
          <p style={{ fontSize: '16px', margin: 0 }}>No service polls created yet.</p>
          <p style={{ fontSize: '13px', margin: '5px 0 0 0' }}>Click "Create Service Poll" above to announce a visit from a plumber, electrician, or AC tech.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {polls.map(poll => {
            const isActive = poll.status === 'active';
            const yesCount = poll.roomsNeedingService?.length || 0;

            return (
              <div 
                key={poll._id} 
                className="card" 
                style={{ 
                  borderLeft: `5px solid ${isActive ? '#10b981' : '#94a3b8'}`,
                  padding: '20px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
                        backgroundColor: isActive ? '#d1fae5' : '#e2e8f0',
                        color: isActive ? '#065f46' : '#475569',
                        textTransform: 'uppercase'
                      }}>
                        {poll.status}
                      </span>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>
                        Created: {new Date(poll.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 style={{ margin: '0 0 6px 0', color: '#1e293b' }}>{poll.title}</h3>
                    {poll.description && (
                      <p style={{ margin: 0, color: '#475569', fontSize: '14px' }}>{poll.description}</p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={() => handleToggleStatus(poll._id, poll.status)}
                      style={{
                        padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                        border: '1px solid #cbd5e0', background: '#f8fafc'
                      }}
                    >
                      {isActive ? 'Mark Closed' : 'Reopen Poll'}
                    </button>
                    <button
                      onClick={() => handleDeletePoll(poll._id)}
                      style={{
                        padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                        border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Vote stats breakdown */}
                <div style={{ display: 'flex', gap: '20px', marginTop: '15px', alignItems: 'center', flexWrap: 'wrap', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Total Responses</span>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>{poll.totalResponses || 0}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#059669' }}>Rooms Requesting Service</span>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>{yesCount} rooms</div>
                  </div>
                  {poll.scheduledDate && (
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Visit Time</span>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#2563eb' }}>
                        {new Date(poll.scheduledDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )}
                  <div style={{ marginLeft: 'auto' }}>
                    <button
                      onClick={() => setSelectedPollForRooms(selectedPollForRooms?._id === poll._id ? null : poll)}
                      style={{
                        backgroundColor: '#4361ee', color: '#fff', border: 'none',
                        padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
                        display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <span>📋</span> {selectedPollForRooms?._id === poll._id ? 'Hide Room List' : `View ${yesCount} Rooms to Visit`}
                    </button>
                  </div>
                </div>

                {/* EXPANDABLE ROOM VISIT TABLE */}
                {selectedPollForRooms?._id === poll._id && (
                  <div style={{ marginTop: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                      <h4 style={{ margin: 0, color: '#1e293b' }}>
                        📋 Rooms Needing Inspection for "{poll.title}"
                      </h4>
                      <button
                        onClick={() => copyRoomList(poll.roomsNeedingService, poll.title)}
                        style={{
                          background: '#10b981', color: '#fff', border: 'none',
                          padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
                        }}
                      >
                        📄 Copy Room List for Technician
                      </button>
                    </div>

                    {(!poll.roomsNeedingService || poll.roomsNeedingService.length === 0) ? (
                      <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                        No students have requested repairs for this service yet.
                      </p>
                    ) : (
                      <table className="data-table" style={{ margin: 0 }}>
                        <thead>
                          <tr>
                            <th>Room #</th>
                            <th>Student</th>
                            <th>Issue Description</th>
                            <th>Response Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {poll.roomsNeedingService.map((item, idx) => (
                            <tr key={idx}>
                              <td><strong style={{ color: '#2563eb' }}>Room {item.roomNumber}</strong></td>
                              <td>{item.studentName}</td>
                              <td>{item.issueDetails || 'Needs inspection'}</td>
                              <td>{new Date(item.respondedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default WardenPolls;
