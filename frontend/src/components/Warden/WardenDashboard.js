import React, { useState } from 'react';
import WardenStudents from './WardenStudents';
import WardenRooms from './WardenRooms';
import WardenComplaints from './WardenComplaints';
import WardenPayments from './WardenPayments';
import WardenAIOverview from './WardenAIOverview';
import WardenPolls from './WardenPolls';
import AIChatWidget from '../AIChatWidget';

function WardenDashboard({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('ai-overview');

  return (
    <div className="dashboard warden-dashboard">
      <header className="dashboard-header">
        <h1>Warden Dashboard</h1>
        <div className="header-right">
          <span>Welcome, <strong>{user.name}</strong></span>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="tabs">
        <button className={activeTab === 'ai-overview' ? 'active' : ''} onClick={() => setActiveTab('ai-overview')}>
          <span style={{display:'flex', alignItems:'center', gap:'6px'}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M12 11v4h4"/><path d="M12 11h-4v4"/></svg>
            AI Copilot
          </span>
        </button>
        <button className={activeTab === 'polls' ? 'active' : ''} onClick={() => setActiveTab('polls')}>
          🛠️ Service Polls
        </button>
        <button className={activeTab === 'students' ? 'active' : ''} onClick={() => setActiveTab('students')}>Students</button>
        <button className={activeTab === 'rooms' ? 'active' : ''} onClick={() => setActiveTab('rooms')}>Rooms</button>
        <button className={activeTab === 'complaints' ? 'active' : ''} onClick={() => setActiveTab('complaints')}>Complaints</button>
        <button className={activeTab === 'payments' ? 'active' : ''} onClick={() => setActiveTab('payments')}>Payments</button>
      </div>

      <div className="content">
        {activeTab === 'ai-overview' && <WardenAIOverview token={token} />}
        {activeTab === 'polls' && <WardenPolls token={token} />}
        {activeTab === 'students' && <WardenStudents token={token} />}
        {activeTab === 'rooms' && <WardenRooms token={token} />}
        {activeTab === 'complaints' && <WardenComplaints token={token} />}
        {activeTab === 'payments' && <WardenPayments token={token} />}
      </div>
      <AIChatWidget token={token} />
    </div>
  );
}

export default WardenDashboard;
