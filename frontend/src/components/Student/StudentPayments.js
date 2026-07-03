import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://staytrack-backend-ijng.onrender.com/api';

function StudentPayments({ token }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    transactionId: '',
    onlineAmount: 3500,
    cashAmount: 5000,
    screenshotUrl: ''
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await axios.get(`${API_URL}/student/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, screenshotUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/student/payment`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForm({ month: new Date().toISOString().slice(0, 7), transactionId: '', onlineAmount: 3500, cashAmount: 5000, screenshotUrl: '' });
      setShowForm(false);
      fetchPayments();
    } catch (error) {
      console.error('Error:', error);
      alert('Payment failed: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) return <div className="loading">Loading payments...</div>;

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="payments-container">
      <div className="summary-cards">
        <div className="card"><h4>Standard Rent</h4><p className="amount">₹8500</p></div>
        <div className="card pending"><h4>Pending Months</h4><p className="amount">{payments.filter(p => p.status === 'pending').length}</p></div>
        <div className="card paid"><h4>Total Paid</h4><p className="amount">₹{totalPaid}</p></div>
      </div>

      <div style={{ margin: '20px 0' }}>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel Payment' : '➕ Make New Payment / Split Payment'}
        </button>
      </div>

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit} style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>Submit Payment Details</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Payment Month</label>
              <input
                type="month"
                value={form.month}
                onChange={(e) => setForm({ ...form, month: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Online Amount (₹)</label>
              <input
                type="number"
                value={form.onlineAmount}
                onChange={(e) => setForm({ ...form, onlineAmount: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="form-group">
              <label>Cash to Warden (₹)</label>
              <input
                type="number"
                value={form.cashAmount}
                onChange={(e) => setForm({ ...form, cashAmount: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="form-group">
              <label>Transaction ID (For Online)</label>
              <input
                type="text"
                value={form.transactionId}
                onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
                placeholder="E.g., TXN123456789"
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Upload Screenshot of Online Payment</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              {form.screenshotUrl && (
                <div style={{ marginTop: '10px' }}>
                  <img src={form.screenshotUrl} alt="Screenshot Preview" style={{ maxWidth: '200px', borderRadius: '8px', border: '1px solid #ccc' }} />
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button type="submit" className="btn-success">Confirm Payment</button>
          </div>
        </form>
      )}

      <div className="payment-history">
        <h3>Payment History</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Online (₹)</th>
              <th>Cash (₹)</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th>Proof</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {payments.length > 0 ? (
              payments.map(payment => (
                <tr key={payment._id}>
                  <td>{payment.month}</td>
                  <td>₹{payment.onlineAmount || 0}</td>
                  <td>₹{payment.cashAmount || 0}</td>
                  <td className="amount"><strong>₹{payment.amount}</strong></td>
                  <td><span className={`status ${payment.status}`}>{payment.status === 'pending' ? 'Pending' : payment.status === 'pending_verification' ? '🔍 Under Review' : '✓ Paid'}</span></td>
                  <td>{payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : '-'}</td>
                  <td>
                    {payment.hasScreenshot ? (
                      <a href={`${API_URL}/payment/${payment._id}/screenshot`} target="_blank" rel="noreferrer" style={{ color: '#3498db', textDecoration: 'underline' }}>View Screenshot</a>
                    ) : 'No Proof'}
                  </td>
                  <td>
                    {payment.status === 'pending' ? (
                      <button className="btn-small" onClick={() => setShowForm(true)}>Pay Now</button>
                    ) : payment.status === 'pending_verification' ? (
                      <span className="pending">Under Review</span>
                    ) : (
                      <span className="completed">✓ Paid</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="8" className="no-data">No payment records yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StudentPayments;
