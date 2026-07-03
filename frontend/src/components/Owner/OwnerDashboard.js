import React, { useState } from 'react';
import OwnerOverview from './OwnerOverview';
import OwnerComplaints from './OwnerComplaints';
import OwnerPayments from './OwnerPayments';
import OwnerPendingStudents from './OwnerPendingStudents';
import OwnerReports from './OwnerReports';
import WardenRooms from '../Warden/WardenRooms';

/**
 * OWNER DASHBOARD MAIN COMPONENT
 * Manages all tabs: Overview, Complaints, Payments, Pending Students
 */
function OwnerDashboard({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="dashboard owner-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h1>👑 Owner Dashboard</h1>
        <div className="header-right">
          <span>Welcome, <strong>{user.name}</strong></span>
          <button onClick={onLogout} className="logout-btn">🚪 Logout</button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={activeTab === 'complaints' ? 'active' : ''} 
          onClick={() => setActiveTab('complaints')}
        >
          🔴 Complaints
        </button>
        <button 
          className={activeTab === 'payments' ? 'active' : ''} 
          onClick={() => setActiveTab('payments')}
        >
          💰 Payments
        </button>
        <button 
          className={activeTab === 'pending' ? 'active' : ''} 
          onClick={() => setActiveTab('pending')}
        >
          ⏳ Pending Students
        </button>
        <button 
          className={activeTab === 'reports' ? 'active' : ''} 
          onClick={() => setActiveTab('reports')}
        >
          📈 Reports
        </button>
        <button 
          className={activeTab === 'rooms' ? 'active' : ''} 
          onClick={() => setActiveTab('rooms')}
        >
          🚪 Rooms
        </button>
      </div>

      {/* Content Area */}
      <div className="content">
        {activeTab === 'overview' && <OwnerOverview token={token} />}
        {activeTab === 'complaints' && <OwnerComplaints token={token} />}
        {activeTab === 'payments' && <OwnerPayments token={token} />}
        {activeTab === 'pending' && <OwnerPendingStudents token={token} />}
        {activeTab === 'reports' && <OwnerReports token={token} />}
        {activeTab === 'rooms' && <WardenRooms token={token} />}
      </div>
    </div>
  );
}

export default OwnerDashboard;
