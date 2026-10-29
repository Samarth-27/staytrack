import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../api/config';

const categoryIcons = {
  plumber: '🔧',
  electrician: '⚡',
  carpenter: '🪚',
  ac_repair: '❄️',
  cleaning: '🧹',
  payment_reminder: '💳',
  general: '📢'
};

const categoryLabels = {
  plumber: 'Plumber Visit',
  electrician: 'Electrician Visit',
  carpenter: 'Carpenter Visit',
  ac_repair: 'AC Technician Visit',
  cleaning: 'Hostel Cleaning',
  payment_reminder: 'Payment Deadline',
  general: 'General Announcement'
};

function StudentPolls({ token }) {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [issueInputs, setIssueInputs] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchActivePolls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchActivePolls = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/polls/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPolls(response.data);
      
      // Initialize inputs with previous responses if available
      const initialInputs = {};
      response.data.forEach(poll => {
        if (poll.myResponse?.issueDetails) {
          initialInputs[poll._id] = poll.myResponse.issueDetails;
        }
      });
      setIssueInputs(initialInputs);
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId, option) => {
    setSubmittingId(pollId);
    setMessage({ text: '', type: '' });
    try {
      const issueDetails = issueInputs[pollId] || '';
      await axios.post(
        `${API_BASE_URL}/polls/${pollId}/vote`,
        { selectedOption: option, issueDetails },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ text: 'Your response has been submitted to the warden!', type: 'success' });
      await fetchActivePolls();
    } catch (error) {
      setMessage({ 
        text: 'Error: ' + (error.response?.data?.message || 'Failed to submit response'), 
        type: 'error' 
      });
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) return <div className="loading" style={{ color: 'var(--text-muted)' }}>Loading service updates & polls...</div>;

  return (
    <div className="student-polls-container" style={{ padding: '8px 0' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: '600', color: 'var(--text-main, #ededed)', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🗳️</span> Service Visits & Maintenance Polls
        </h2>
        <p style={{ margin: 0, color: 'var(--text-muted, #a1a1aa)', fontSize: '14px' }}>
          Respond to active service announcements (plumber, electrician, AC repair) so the warden can dispatch technicians to your room.
        </p>
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

      {polls.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-surface, #0a0a0a)', border: '1px solid var(--border-dim, #262626)', borderRadius: '10px' }}>
          <p style={{ fontSize: '16px', margin: 0, color: 'var(--text-main, #ededed)', fontWeight: '500' }}>🎉 No active service polls right now.</p>
          <p style={{ fontSize: '13px', margin: '8px 0 0 0', color: 'var(--text-muted, #a1a1aa)' }}>When a technician or warden announces an upcoming visit, you will be able to vote here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {polls.map(poll => {
            const isVoted = poll.hasResponded;
            const myChoice = poll.myResponse?.selectedOption;
            const icon = categoryIcons[poll.category] || '📢';
            const badgeLabel = categoryLabels[poll.category] || 'Announcement';

            return (
              <div 
                key={poll._id} 
                className="card" 
                style={{ 
                  background: 'var(--bg-surface, #0a0a0a)',
                  border: '1px solid var(--border-dim, #262626)',
                  borderLeft: `4px solid ${isVoted ? '#3b82f6' : '#f59e0b'}`, 
                  borderRadius: '10px',
                  padding: '24px',
                  transition: 'border-color 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: '600', 
                      backgroundColor: 'var(--bg-base, #000000)', 
                      color: 'var(--text-muted, #a1a1aa)', 
                      padding: '4px 10px', 
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      border: '1px solid var(--border-dim, #262626)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>{icon}</span> {badgeLabel}
                    </span>

                    <h3 style={{ margin: '12px 0 8px 0', color: 'var(--text-main, #ededed)', fontSize: '18px', fontWeight: '600', letterSpacing: '-0.3px' }}>
                      {poll.title}
                    </h3>

                    {poll.description && (
                      <p style={{ margin: '0 0 12px 0', color: 'var(--text-muted, #a1a1aa)', fontSize: '14px', lineHeight: '1.6' }}>
                        {poll.description}
                      </p>
                    )}
                  </div>

                  {poll.scheduledDate && (
                    <div style={{ 
                      background: 'rgba(59, 130, 246, 0.1)', 
                      border: '1px solid rgba(59, 130, 246, 0.25)', 
                      borderRadius: '8px', 
                      padding: '10px 14px', 
                      fontSize: '13px',
                      color: '#93c5fd',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>🗓️</span>
                      <span>
                        <strong style={{ color: '#bfdbfe' }}>Scheduled: </strong> 
                        {new Date(poll.scheduledDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Response Status Indicator */}
                {isVoted && (
                  <div style={{ 
                    margin: '14px 0', 
                    padding: '12px 16px', 
                    background: 'rgba(52, 211, 153, 0.1)', 
                    border: '1px solid rgba(52, 211, 153, 0.25)', 
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <span>
                      ✓ You selected: <strong style={{ color: '#6ee7b7' }}>{myChoice}</strong>
                      {poll.myResponse?.issueDetails && (
                        <span> — <em>"{poll.myResponse.issueDetails}"</em></span>
                      )}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted, #a1a1aa)' }}>
                      (You can click another option below to update your response)
                    </span>
                  </div>
                )}

                {/* Optional Issue Details Input if repair is needed */}
                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-muted, #a1a1aa)' }}>
                    Describe room issue (optional, for technician reference):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Bathroom tap leaking, tube light flickering, AC fan noise..."
                    value={issueInputs[poll._id] || ''}
                    onChange={(e) => setIssueInputs({ ...issueInputs, [poll._id]: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-dim, #262626)',
                      background: 'var(--bg-base, #000000)',
                      color: 'var(--text-main, #ededed)',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong, #404040)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-dim, #262626)'; }}
                  />
                </div>

                {/* Voting Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                  {(poll.options || ['Yes (Need repair)', 'No (All good)']).map(opt => {
                    const isSelected = myChoice === opt;
                    const isYesOption = opt.toLowerCase().includes('yes');
                    return (
                      <button
                        key={opt}
                        onClick={() => handleVote(poll._id, opt)}
                        disabled={submittingId === poll._id}
                        style={{
                          padding: '10px 20px',
                          borderRadius: '6px',
                          border: isSelected 
                            ? '1px solid #3b82f6' 
                            : (isYesOption ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid var(--border-dim, #262626)'),
                          backgroundColor: isSelected 
                            ? '#2563eb' 
                            : (isYesOption ? 'rgba(52, 211, 153, 0.08)' : 'var(--bg-base, #000000)'),
                          color: isSelected 
                            ? '#ffffff' 
                            : (isYesOption ? '#34d399' : 'var(--text-main, #ededed)'),
                          fontWeight: isSelected ? '600' : '500',
                          cursor: submittingId === poll._id ? 'not-allowed' : 'pointer',
                          fontSize: '13px',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected && submittingId !== poll._id) {
                            e.currentTarget.style.borderColor = isYesOption ? 'rgba(52, 211, 153, 0.6)' : 'var(--border-strong, #404040)';
                            e.currentTarget.style.background = isYesOption ? 'rgba(52, 211, 153, 0.15)' : 'var(--bg-hover, #171717)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = isYesOption ? 'rgba(52, 211, 153, 0.3)' : 'var(--border-dim, #262626)';
                            e.currentTarget.style.background = isYesOption ? 'rgba(52, 211, 153, 0.08)' : 'var(--bg-base, #000000)';
                          }
                        }}
                      >
                        {isSelected && '✓ '}
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {/* Summary counts bar */}
                <div style={{ 
                  marginTop: '18px', 
                  paddingTop: '14px', 
                  borderTop: '1px solid var(--border-dim, #262626)', 
                  display: 'flex', 
                  gap: '20px', 
                  fontSize: '13px', 
                  color: 'var(--text-muted, #a1a1aa)',
                  flexWrap: 'wrap'
                }}>
                  <span>Total Responses: <strong style={{ color: 'var(--text-main, #ededed)' }}>{poll.totalResponses || 0}</strong></span>
                  {Object.entries(poll.optionCounts || {}).map(([opt, count]) => (
                    <span key={opt}>{opt}: <strong style={{ color: 'var(--text-main, #ededed)' }}>{count}</strong></span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StudentPolls;
