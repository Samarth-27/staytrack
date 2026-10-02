import React, { useState } from 'react';
import StudentProfile from './StudentProfile';
import StudentComplaints from './StudentComplaints';
import StudentPayments from './StudentPayments';
import StudentNotices from './StudentNotices';
import StudentPolls from './StudentPolls';
import AIChatWidget from '../AIChatWidget';

/**
 * STUDENT DASHBOARD MAIN COMPONENT
 * Manages: Profile, Complaints, Payments, Service Polls, Notices
 */
function StudentDashboard({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="dashboard student-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h1>Student Dashboard</h1>
        <div className="header-right">
          <span>Welcome, <strong>{user.name}</strong></span>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="tabs">
        <button 
          className={activeTab === 'profile' ? 'active' : ''} 
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button 
          className={activeTab === 'complaints' ? 'active' : ''} 
          onClick={() => setActiveTab('complaints')}
        >
          Complaints
        </button>
        <button 
          className={activeTab === 'payments' ? 'active' : ''} 
          onClick={() => setActiveTab('payments')}
        >
          Payments
        </button>
        <button 
          className={activeTab === 'polls' ? 'active' : ''} 
          onClick={() => setActiveTab('polls')}
        >
          🗳️ Service Polls
        </button>
        <button 
          className={activeTab === 'notices' ? 'active' : ''} 
          onClick={() => setActiveTab('notices')}
        >
          Notices
        </button>
      </div>

      {/* Content Area */}
      <div className="content">
        {activeTab === 'profile' && <StudentProfile token={token} />}
        {activeTab === 'complaints' && <StudentComplaints token={token} />}
        {activeTab === 'payments' && <StudentPayments token={token} />}
        {activeTab === 'polls' && <StudentPolls token={token} />}
        {activeTab === 'notices' && <StudentNotices token={token} />}
      </div>
      
      <AIChatWidget token={token} role="student" />
    </div>
  );
}

export default StudentDashboard;
