import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE_URL } from '../../api/config';

const API_URL = API_BASE_URL;

function WardenPayments({ token }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    try {
      const response = await axios.get(`${API_URL}/warden/payments`, { headers: { Authorization: `Bearer ${token}` } });
      setPayments(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (paymentId) => {
    try {
      await axios.put(`${API_URL}/warden/payment/${paymentId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchPayments();
    } catch (error) {
      console.error('Error marking paid:', error);
    }
  };

  const handleRejectPayment = async (paymentId) => {
    if (!window.confirm("Are you sure you want to reject this payment? The screenshot will be deleted and the student must submit it again.")) return;
    try {
      await axios.put(`${API_URL}/warden/payment/${paymentId}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchPayments();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      alert('Failed to reject payment: ' + (error.response?.data?.message || error.message));
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Warden Payment Report", 14, 15);
    
    const tableData = payments.map(p => [
      p.student?.name || 'Unknown',
      p.month,
      `Rs ${p.onlineAmount || 0}`,
      `Rs ${p.cashAmount || 0}`,
      `Rs ${p.amount}`,
      p.status
    ]);

    autoTable(doc, {
      head: [['Student', 'Month', 'Online', 'Cash', 'Total', 'Status']],
      body: tableData,
      startY: 20
    });

    doc.save('warden-payments.pdf');
  };

  const [sendingReminders, setSendingReminders] = useState(false);

  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      const response = await axios.post(`${API_URL}/ai/notifications/remind-fees`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert(response.data.message);
    } catch (error) {
      console.error('Error sending reminders:', error);
      alert('Failed to send reminders.');
    } finally {
      setSendingReminders(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="payments-container">
      <div className="summary-cards">
        <div className="card"><h4>Total</h4><p className="amount">₹{totalAmount}</p></div>
        <div className="card paid"><h4>Received</h4><p className="amount">₹{paidAmount}</p></div>
        <div className="card pending"><h4>Pending</h4><p className="amount">₹{pendingAmount}</p></div>
      </div>
      <div style={{ margin: '15px 0', display: 'flex', gap: '10px' }}>
        <button className="btn-primary" onClick={downloadPDF}>⬇️ Download PDF Report</button>
        <button 
          onClick={handleSendReminders} 
          disabled={sendingReminders}
          style={{ backgroundColor: '#4361ee', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          {sendingReminders ? 'Sending...' : '🤖 AI Smart Reminders'}
        </button>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Month</th>
            <th>Online</th>
            <th>Cash</th>
            <th>Total</th>
            <th>Proof</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {payments.length > 0 ? (
            payments.map(payment => (
              <tr key={payment._id}>
                <td>{payment.student?.name || 'Unknown/Deleted Student'}</td>
                <td>{payment.month}</td>
                <td className="amount">₹{payment.onlineAmount || 0}</td>
                <td className="amount">₹{payment.cashAmount || 0}</td>
                <td className="amount"><strong>₹{payment.amount}</strong></td>
                <td>
                  {payment.hasScreenshot ? (
                    <a href={`${API_URL}/payment/${payment._id}/screenshot`} target="_blank" rel="noreferrer" style={{ fontSize: '12px' }}>View</a>
                  ) : '-'}
                </td>
                <td><span className={`status ${payment.status}`}>{payment.status === 'pending_verification' ? 'Reviewing' : payment.status}</span></td>
                <td>
                  {(payment.status === 'pending' || payment.status === 'pending_verification') ? (
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button className="btn-small success" onClick={() => handleMarkPaid(payment._id)}>
                        {payment.status === 'pending_verification' ? 'Approve' : 'Mark Paid'}
                      </button>
                      {payment.status === 'pending_verification' && (
                        <button className="btn-small danger" onClick={() => handleRejectPayment(payment._id)}>
                          Reject
                        </button>
                      )}
                    </div>
                  ) : (
                    <span>✓</span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="8" className="no-data">No payments</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
export default WardenPayments;
