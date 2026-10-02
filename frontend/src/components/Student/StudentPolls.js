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
      setMessage({ text: '✓ Your response has been submitted to the warden!', type: 'success' });
      await fetchActivePolls();
    } catch (error) {
      setMessage({ 
        text: '✗ Error: ' + (error.response?.data?.message || 'Failed to submit response'), 
        type: 'error' 
      });
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) return <div className="loading">Loading service updates & polls...</div>;

  return (
    <div className="student-polls-container" style={{ padding: '10px 0' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🗳️</span> Service Visits & Maintenance Polls
        </h2>
        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
          Respond to active service announcements (plumber, electrician, AC repair) so the warden can dispatch technicians to your room.
        </p>
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

      {polls.length === 0 ? (
        <div className="card" style={{ padding: '30px', textAlign: 'center', color: '#7f8c8d' }}>
          <p style={{ fontSize: '16px', margin: 0 }}>🎉 No active service polls right now.</p>
          <p style={{ fontSize: '13px', margin: '5px 0 0 0' }}>When a technician or warden announces an upcoming visit, you will be able to vote here.</p>
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
                  borderLeft: `5px solid ${isVoted ? '#4361ee' : '#e67e22'}`, 
                  padding: '20px' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{ 
                      fontSize: '12px', 
                      fontWeight: '600', 
                      backgroundColor: '#edf2f7', 
                      color: '#4a5568', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      textTransform: 'uppercase'
                    }}>
                      {icon} {badgeLabel}
                    </span>
                    <h3 style={{ margin: '10px 0 6px 0', color: '#2d3748' }}>{poll.title}</h3>
                    {poll.description && (
                      <p style={{ margin: '0 0 10px 0', color: '#4a5568', fontSize: '14px', lineHeight: '1.5' }}>
                        {poll.description}
                      </p>
                    )}
                  </div>
                  {poll.scheduledDate && (
                    <div style={{ 
                      background: '#ebf8ff', 
                      border: '1px solid #bee3f8', 
                      borderRadius: '6px', 
                      padding: '8px 12px', 
                      fontSize: '13px',
                      color: '#2b6cb0'
                    }}>
                      <strong>🗓️ Scheduled:</strong> {new Date(poll.scheduledDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>

                {/* Response Status Indicator */}
                {isVoted && (
                  <div style={{ 
                    margin: '12px 0', 
                    padding: '10px 14px', 
                    background: '#f0fdf4', 
                    border: '1px solid #bbf7d0', 
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#166534',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span>
                      ✓ You selected: <strong>{myChoice}</strong>
                      {poll.myResponse?.issueDetails && (
                        <span> — <em>"{poll.myResponse.issueDetails}"</em></span>
                      )}
                    </span>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>
                      (You can click another option below to change your response)
                    </span>
                  </div>
                )}

                {/* Optional Issue Details Input if repair is needed */}
                <div style={{ marginTop: '15px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#4a5568' }}>
                    Describe room issue (optional, for technician reference):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Bathroom tap leaking, tube light flickering, AC fan noise..."
                    value={issueInputs[poll._id] || ''}
                    onChange={(e) => setIssueInputs({ ...issueInputs, [poll._id]: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e0',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Voting Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
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
                          border: isSelected ? '2px solid #4361ee' : '1px solid #cbd5e0',
                          backgroundColor: isSelected 
                            ? '#4361ee' 
                            : (isYesOption ? '#ecfdf5' : '#f8fafc'),
                          color: isSelected 
                            ? '#fff' 
                            : (isYesOption ? '#065f46' : '#334155'),
                          fontWeight: isSelected ? '600' : '500',
                          cursor: 'pointer',
                          fontSize: '14px',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {isSelected && '✓ '}
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {/* Summary counts bar */}
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #edf2f7', display: 'flex', gap: '20px', fontSize: '13px', color: '#718096' }}>
                  <span>Total Responses: <strong>{poll.totalResponses || 0}</strong></span>
                  {Object.entries(poll.optionCounts || {}).map(([opt, count]) => (
                    <span key={opt}>{opt}: <strong>{count}</strong></span>
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
