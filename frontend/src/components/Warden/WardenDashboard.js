import React, { useState } from 'react';
import WardenStudents from './WardenStudents';
import WardenRooms from './WardenRooms';
import WardenComplaints from './WardenComplaints';
import WardenPayments from './WardenPayments';

function WardenDashboard({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('students');

  return (
    <div className="dashboard warden-dashboard">
      <header className="dashboard-header">
        <h1>🔑 Warden Dashboard</h1>
        <div className="header-right">
          <span>Welcome, <strong>{user.name}</strong></span>
          <button onClick={onLogout} className="logout-btn">🚪 Logout</button>
        </div>
      </header>

      <div className="tabs">
        <button className={activeTab === 'students' ? 'active' : ''} onClick={() => setActiveTab('students')}>👥 Students</button>
        <button className={activeTab === 'rooms' ? 'active' : ''} onClick={() => setActiveTab('rooms')}>🚪 Rooms</button>
        <button className={activeTab === 'complaints' ? 'active' : ''} onClick={() => setActiveTab('complaints')}>🔴 Complaints</button>
        <button className={activeTab === 'payments' ? 'active' : ''} onClick={() => setActiveTab('payments')}>💰 Payments</button>
      </div>

      <div className="content">
        {activeTab === 'students' && <WardenStudents token={token} />}
        {activeTab === 'rooms' && <WardenRooms token={token} />}
        {activeTab === 'complaints' && <WardenComplaints token={token} />}
        {activeTab === 'payments' && <WardenPayments token={token} />}
      </div>
    </div>
  );
}

export default WardenDashboard;
