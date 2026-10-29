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

const categoryIcons = {
  plumber: '🔧',
  electrician: '⚡',
  carpenter: '🪚',
  ac_repair: '❄️',
  cleaning: '🧹',
  payment_reminder: '💳',
  general: '📢'
};

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setMessage({ text: 'Service poll created & broadcasted successfully!', type: 'success' });
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
      setMessage({ text: 'Error: ' + (error.response?.data?.message || 'Failed to create poll'), type: 'error' });
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
    alert('Room visit list copied to clipboard! You can share this directly with the technician.');
  };

  const totalPolls = polls.length;
  const activePollsCount = polls.filter(p => p.status === 'active').length;
  const totalRoomsNeedingRepair = polls.reduce((sum, p) => sum + (p.roomsNeedingService?.length || 0), 0);

  if (loading) return <div className="loading" style={{ color: 'var(--text-muted)' }}>Loading service polls...</div>;

  return (
    <div className="warden-polls-container" style={{ padding: '8px 0' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: '600', color: 'var(--text-main, #ededed)', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🛠️</span> Service Polls & Maintenance Dispatch
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted, #a1a1aa)', fontSize: '14px' }}>
            Poll students before plumber, electrician, carpenter, or AC technicians visit to collect the exact list of rooms needing repair.
          </p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '10px 20px', 
            borderRadius: '8px', 
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            boxShadow: '0 2px 10px rgba(255,255,255,0.08)'
          }}
        >
          <span>＋</span> Create Service Poll
        </button>
      </div>

      {/* KPI Overview Metrics */}
      <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ background: 'var(--bg-surface, #0a0a0a)', border: '1px solid var(--border-dim, #262626)', borderRadius: '10px', padding: '18px' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: 'var(--text-muted, #a1a1aa)', fontWeight: '500' }}>📢 Total Polls</h4>
          <p className="amount" style={{ margin: 0, fontSize: '26px', fontWeight: '700', color: 'var(--text-main, #ededed)' }}>{totalPolls}</p>
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #a1a1aa)' }}>Maintenance & dispatch logs</span>
        </div>

        <div className="card" style={{ background: 'var(--bg-surface, #0a0a0a)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '10px', padding: '18px' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: 'var(--text-muted, #a1a1aa)', fontWeight: '500' }}>⚡ Active Dispatches</h4>
          <p className="amount" style={{ margin: 0, fontSize: '26px', fontWeight: '700', color: '#34d399' }}>{activePollsCount}</p>
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #a1a1aa)' }}>Open for student voting</span>
        </div>

        <div className="card" style={{ background: 'var(--bg-surface, #0a0a0a)', border: '1px solid rgba(96, 165, 250, 0.3)', borderRadius: '10px', padding: '18px' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: 'var(--text-muted, #a1a1aa)', fontWeight: '500' }}>🔧 Rooms Requesting Repair</h4>
          <p className="amount" style={{ margin: 0, fontSize: '26px', fontWeight: '700', color: '#60a5fa' }}>{totalRoomsNeedingRepair}</p>
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #a1a1aa)' }}>Requiring technician attention</span>
        </div>
      </div>

      {/* Notifications */}
      {message.text && (
        <div style={{
          padding: '12px 18px',
          marginBottom: '20px',
          borderRadius: '8px',
          backgroundColor: message.type === 'success' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(248, 113, 113, 0.12)',
          color: message.type === 'success' ? '#34d399' : '#f87171',
          border: `1px solid ${message.type === 'success' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          <span>{message.type === 'success' ? '✓ ' : '✗ '}{message.text}</span>
          <button 
            onClick={() => setMessage({ text: '', type: '' })}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* CREATE POLL MODAL */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div 
            className="card" 
            style={{ 
              maxWidth: '620px', 
              width: '100%', 
              maxHeight: '90vh', 
              overflowY: 'auto', 
              padding: '28px', 
              borderRadius: '12px',
              background: 'var(--bg-surface, #0a0a0a)',
              border: '1px solid var(--border-strong, #404040)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.8)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-dim, #262626)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text-main, #ededed)' }}>
                Create Service Visit Announcement / Poll
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)} 
                style={{ background: 'none', border: 'none', fontSize: '20px', color: 'var(--text-muted, #a1a1aa)', cursor: 'pointer', padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            {/* Quick 1-Click Presets */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', color: 'var(--text-muted, #a1a1aa)' }}>
                ⚡ Quick Presets (Click to autofill):
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {servicePresets.map(preset => {
                  const isSelected = formData.category === preset.category;
                  return (
                    <button
                      type="button"
                      key={preset.category}
                      onClick={() => handleApplyPreset(preset)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: isSelected ? '1px solid #6366f1' : '1px solid var(--border-dim, #262626)',
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-base, #000000)',
                        color: isSelected ? '#a5b4fc' : 'var(--text-muted, #a1a1aa)',
                        fontSize: '12px',
                        fontWeight: isSelected ? '600' : '400',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span>{preset.icon}</span> {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleCreatePoll} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-muted, #a1a1aa)' }}>
                  Announcement Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Plumber Visiting Tomorrow 10 AM"
                  style={{ 
                    width: '100%', 
                    padding: '10px 14px', 
                    borderRadius: '6px', 
                    border: '1px solid var(--border-dim, #262626)', 
                    background: 'var(--bg-base, #000000)',
                    color: 'var(--text-main, #ededed)',
                    fontSize: '14px',
                    boxSizing: 'border-box' 
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-muted, #a1a1aa)' }}>
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ 
                      width: '100%', 
                      padding: '10px 14px', 
                      borderRadius: '6px', 
                      border: '1px solid var(--border-dim, #262626)', 
                      background: 'var(--bg-base, #000000)',
                      color: 'var(--text-main, #ededed)',
                      fontSize: '14px',
                      boxSizing: 'border-box' 
                    }}
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-muted, #a1a1aa)' }}>
                    Scheduled Visit Date / Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    style={{ 
                      width: '100%', 
                      padding: '10px 14px', 
                      borderRadius: '6px', 
                      border: '1px solid var(--border-dim, #262626)', 
                      background: 'var(--bg-base, #000000)',
                      color: 'var(--text-main, #ededed)',
                      fontSize: '14px',
                      boxSizing: 'border-box' 
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-muted, #a1a1aa)' }}>
                  Description / Message to Students
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe details of the visit or deadline instructions..."
                  style={{ 
                    width: '100%', 
                    padding: '10px 14px', 
                    borderRadius: '6px', 
                    border: '1px solid var(--border-dim, #262626)', 
                    background: 'var(--bg-base, #000000)',
                    color: 'var(--text-main, #ededed)',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box' 
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)} 
                  className="btn-secondary"
                  style={{ padding: '10px 18px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ padding: '10px 22px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Launch Poll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POLLS LIST */}
      {polls.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-surface, #0a0a0a)', border: '1px solid var(--border-dim, #262626)', borderRadius: '10px' }}>
          <p style={{ fontSize: '16px', margin: 0, color: 'var(--text-main, #ededed)', fontWeight: '500' }}>No service polls created yet.</p>
          <p style={{ fontSize: '13px', margin: '8px 0 0 0', color: 'var(--text-muted, #a1a1aa)' }}>Click "+ Create Service Poll" above to announce a visit from a plumber, electrician, carpenter, or AC tech.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {polls.map(poll => {
            const isActive = poll.status === 'active';
            const yesCount = poll.roomsNeedingService?.length || 0;
            const icon = categoryIcons[poll.category] || '📢';

            return (
              <div 
                key={poll._id} 
                className="card" 
                style={{ 
                  background: 'var(--bg-surface, #0a0a0a)',
                  border: '1px solid var(--border-dim, #262626)',
                  borderLeft: `4px solid ${isActive ? '#34d399' : '#52525b'}`,
                  borderRadius: '10px',
                  padding: '24px',
                  transition: 'border-color 0.2s ease'
                }}
              >
                {/* Poll Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        letterSpacing: '0.5px',
                        backgroundColor: isActive ? 'rgba(52, 211, 153, 0.14)' : 'rgba(161, 161, 170, 0.12)',
                        color: isActive ? '#34d399' : '#a1a1aa',
                        border: `1px solid ${isActive ? 'rgba(52, 211, 153, 0.3)' : 'var(--border-dim, #262626)'}`,
                        textTransform: 'uppercase'
                      }}>
                        {poll.status}
                      </span>

                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500',
                        backgroundColor: 'var(--bg-base, #000000)',
                        color: 'var(--text-muted, #a1a1aa)',
                        border: '1px solid var(--border-dim, #262626)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>{icon}</span> {poll.category}
                      </span>

                      <span style={{ fontSize: '13px', color: 'var(--text-muted, #a1a1aa)' }}>
                        Created: {new Date(poll.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-main, #ededed)', fontSize: '18px', fontWeight: '600', letterSpacing: '-0.3px' }}>
                      {poll.title}
                    </h3>

                    {poll.description && (
                      <p style={{ margin: 0, color: 'var(--text-muted, #a1a1aa)', fontSize: '14px', lineHeight: '1.6' }}>
                        {poll.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      onClick={() => handleToggleStatus(poll._id, poll.status)}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        background: 'var(--bg-base, #000000)',
                        color: 'var(--text-main, #ededed)',
                        border: '1px solid var(--border-dim, #262626)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong, #404040)'; e.currentTarget.style.background = 'var(--bg-hover, #171717)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-dim, #262626)'; e.currentTarget.style.background = 'var(--bg-base, #000000)'; }}
                    >
                      {isActive ? 'Mark Closed' : 'Reopen Poll'}
                    </button>
                    <button
                      onClick={() => handleDeletePoll(poll._id)}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        background: 'rgba(248, 113, 113, 0.1)',
                        color: '#f87171',
                        border: '1px solid rgba(248, 113, 113, 0.25)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(248, 113, 113, 0.2)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)'; }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Vote stats breakdown container (Clean Elevated Dark Surface) */}
                <div style={{ 
                  display: 'flex', 
                  gap: '24px', 
                  marginTop: '18px', 
                  alignItems: 'center', 
                  flexWrap: 'wrap', 
                  background: 'var(--bg-base, #000000)', 
                  border: '1px solid var(--border-dim, #262626)',
                  padding: '16px 20px', 
                  borderRadius: '8px' 
                }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted, #a1a1aa)', display: 'block', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Total Responses
                    </span>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main, #ededed)' }}>
                      {poll.totalResponses || 0}
                    </div>
                  </div>

                  <div style={{ width: '1px', height: '32px', background: 'var(--border-dim, #262626)' }} />

                  <div>
                    <span style={{ fontSize: '11px', color: '#34d399', display: 'block', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                      Rooms Requesting Service
                    </span>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#34d399' }}>
                      {yesCount} {yesCount === 1 ? 'room' : 'rooms'}
                    </div>
                  </div>

                  {poll.scheduledDate && (
                    <>
                      <div style={{ width: '1px', height: '32px', background: 'var(--border-dim, #262626)' }} />
                      <div>
                        <span style={{ fontSize: '11px', color: '#60a5fa', display: 'block', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                          Scheduled Visit
                        </span>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#93c5fd' }}>
                          {new Date(poll.scheduledDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </>
                  )}

                  <div style={{ marginLeft: 'auto' }}>
                    <button
                      onClick={() => setSelectedPollForRooms(selectedPollForRooms?._id === poll._id ? null : poll)}
                      style={{
                        background: selectedPollForRooms?._id === poll._id ? 'var(--bg-hover, #171717)' : '#2563eb',
                        color: '#ffffff',
                        border: selectedPollForRooms?._id === poll._id ? '1px solid var(--border-strong, #404040)' : '1px solid rgba(255, 255, 255, 0.15)',
                        padding: '9px 18px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: selectedPollForRooms?._id === poll._id ? 'none' : '0 2px 10px rgba(37, 99, 235, 0.3)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedPollForRooms?._id !== poll._id) e.currentTarget.style.background = '#1d4ed8';
                      }}
                      onMouseLeave={(e) => {
                        if (selectedPollForRooms?._id !== poll._id) e.currentTarget.style.background = '#2563eb';
                      }}
                    >
                      <span>📋</span> {selectedPollForRooms?._id === poll._id ? 'Hide Room List' : `View ${yesCount} Rooms to Visit`}
                    </button>
                  </div>
                </div>

                {/* EXPANDABLE ROOM VISIT TABLE */}
                {selectedPollForRooms?._id === poll._id && (
                  <div style={{ 
                    marginTop: '16px', 
                    border: '1px solid var(--border-dim, #262626)', 
                    borderRadius: '8px', 
                    padding: '18px', 
                    background: 'var(--bg-base, #000000)' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                      <h4 style={{ margin: 0, color: 'var(--text-main, #ededed)', fontSize: '15px', fontWeight: '600' }}>
                        📋 Rooms Needing Inspection for "{poll.title}"
                      </h4>
                      <button
                        onClick={() => copyRoomList(poll.roomsNeedingService, poll.title)}
                        style={{
                          background: 'rgba(52, 211, 153, 0.15)',
                          color: '#34d399',
                          border: '1px solid rgba(52, 211, 153, 0.3)',
                          padding: '7px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(52, 211, 153, 0.25)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(52, 211, 153, 0.15)'; }}
                      >
                        <span>📄</span> Copy Room List for Technician
                      </button>
                    </div>

                    {(!poll.roomsNeedingService || poll.roomsNeedingService.length === 0) ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted, #a1a1aa)', fontSize: '13px' }}>
                        No students have requested repairs for this service yet.
                      </div>
                    ) : (
                      <div className="table-responsive" style={{ margin: 0 }}>
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
                                <td>
                                  <span style={{
                                    padding: '3px 10px',
                                    borderRadius: '4px',
                                    background: 'rgba(59, 130, 246, 0.15)',
                                    color: '#60a5fa',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    border: '1px solid rgba(59, 130, 246, 0.3)'
                                  }}>
                                    Room {item.roomNumber}
                                  </span>
                                </td>
                                <td style={{ fontWeight: '500', color: 'var(--text-main, #ededed)' }}>{item.studentName}</td>
                                <td style={{ color: 'var(--text-muted, #a1a1aa)' }}>{item.issueDetails || 'Needs inspection'}</td>
                                <td style={{ color: 'var(--text-muted, #a1a1aa)', fontSize: '13px' }}>
                                  {new Date(item.respondedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
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
