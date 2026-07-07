import React, { useState, useEffect } from 'react';
import axios from 'axios';
import OwnerAIInsights from './OwnerAIInsights';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

function OwnerOverview({ token }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`${API_URL}/owner/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboard(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (!dashboard) return <div className="error">Failed to load dashboard</div>;

  return (
    <div className="overview-container">
      <OwnerAIInsights token={token} />
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"></div>
          <h3>Total Students</h3>
          <p className="stat-value">{dashboard.totalStudents}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <h3>Total Rooms</h3>
          <p className="stat-value">{dashboard.totalRooms}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <h3>Occupied Rooms</h3>
          <p className="stat-value">{dashboard.occupiedRooms}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <h3>Vacant Rooms</h3>
          <p className="stat-value">{dashboard.vacantRooms}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <h3>Pending Payments</h3>
          <p className="stat-value">{dashboard.pendingPayments}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <h3>Paid Payments</h3>
          <p className="stat-value">{dashboard.paidPayments}</p>
        </div>
        <div className="stat-card highlight">
          <div className="stat-icon"></div>
          <h3>Pending Amount</h3>
          <p className="stat-value">₹{dashboard.totalPendingAmount}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <h3>Open Complaints</h3>
          <p className="stat-value">{dashboard.openComplaints}</p>
        </div>
      </div>
    </div>
  );
}

export default OwnerOverview;
