import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function OwnerPayments({ token }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await axios.get(`${API_URL}/owner/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = filterStatus === 'all'
    ? payments
    : payments.filter(p => p.status === filterStatus);

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = filteredPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = filteredPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);

  if (loading) return <div className="loading">Loading payments...</div>;

  return (
    <div className="payments-container">
      <div className="summary-cards">
        <div className="card"><h4>Total Amount</h4><p className="amount">₹{totalAmount}</p></div>
        <div className="card paid"><h4>Paid</h4><p className="amount">₹{paidAmount}</p></div>
        <div className="card pending"><h4>Pending</h4><p className="amount">₹{pendingAmount}</p></div>
      </div>

      <div className="filter-section">
        <label>Filter by Status:</label>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Room</th>
            <th>Month</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Paid Date</th>
            <th>Proof</th>
          </tr>
        </thead>
        <tbody>
          {filteredPayments.length > 0 ? (
            filteredPayments.map(payment => (
              <tr key={payment._id}>
                <td>{payment.student?.name || 'Unknown Student'}</td>
                <td>Room {payment.room?.roomNumber || 'Unassigned'}</td>
                <td>{payment.month}</td>
                <td>₹{payment.amount}</td>
                <td><span className={`status ${payment.status}`}>{payment.status === 'pending_verification' ? 'Reviewing' : payment.status}</span></td>
                <td>{payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : '-'}</td>
                <td>
                  {payment.hasScreenshot ? (
                    <a href={`${API_URL}/payment/${payment._id}/screenshot`} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#3498db' }}>View</a>
                  ) : '-'}
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="7" className="no-data">No payments found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default OwnerPayments;
