import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../api/config';

const API_URL = API_BASE_URL;

function StudentPayments({ token }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    messTransactionId: '',
    messScreenshotUrl: '',
    rentTransactionId: '',
    rentScreenshotUrl: ''
  });
  const [messMode, setMessMode] = useState('');
  const [rentMode, setRentMode] = useState('');

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

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 70% quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedDataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleMessFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setForm({ ...form, messScreenshotUrl: compressedBase64 });
      } catch (err) {
        console.error("Error compressing image", err);
      }
    }
  };

  const handleRentFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setForm({ ...form, rentScreenshotUrl: compressedBase64 });
      } catch (err) {
        console.error("Error compressing image", err);
      }
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    const onlineAmount = (messMode === 'online' ? 5000 : 0) + (rentMode === 'online' ? 3500 : 0);
    const cashAmount = (messMode === 'cash' ? 5000 : 0) + (rentMode === 'cash' ? 3500 : 0);
    
    try {
      await axios.post(`${API_URL}/student/payment`, { 
        ...form, 
        onlineAmount, 
        cashAmount, 
        messMode, 
        rentMode 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForm({ month: new Date().toISOString().slice(0, 7), messTransactionId: '', messScreenshotUrl: '', rentTransactionId: '', rentScreenshotUrl: '' });
      setMessMode('');
      setRentMode('');
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
          {showForm ? '✕ Cancel Payment' : '➕ Make New Payment'}
        </button>
      </div>

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit} style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>Submit Payment Details</h3>
          
          <div className="form-group">
            <label>Payment Month</label>
            <input
              type="month"
              value={form.month}
              onChange={(e) => setForm({ ...form, month: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '24px' }}>
            <div className="form-group">
              <label>Mess Fee (₹5000)</label>
              <select value={messMode} onChange={(e) => setMessMode(e.target.value)} required>
                <option value="" disabled>Select payment method</option>
                <option value="online">Pay Online</option>
                <option value="cash">Pay Cash (To Warden)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Room Rent (₹3500)</label>
              <select value={rentMode} onChange={(e) => setRentMode(e.target.value)} required>
                <option value="" disabled>Select payment method</option>
                <option value="online">Pay Online</option>
                <option value="cash">Pay Cash (To Warden)</option>
              </select>
            </div>
          </div>
          
          {messMode === 'online' && (
            <div style={{ padding: '20px', background: 'var(--bg-base)', borderRadius: '8px', border: '1px solid var(--border-strong)', marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '16px', color: 'var(--warning)' }}>Mess Fee - Online Proof</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Transaction ID</label>
                  <input
                    type="text"
                    value={form.messTransactionId}
                    onChange={(e) => setForm({ ...form, messTransactionId: e.target.value })}
                    placeholder="E.g., TXN123456789"
                    required={true}
                  />
                </div>

                <div className="form-group">
                  <label>Upload Screenshot</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMessFileChange}
                    required={!form.messScreenshotUrl}
                  />
                  {form.messScreenshotUrl && (
                    <div style={{ marginTop: '10px' }}>
                      <img src={form.messScreenshotUrl} alt="Screenshot Preview" style={{ maxWidth: '200px', borderRadius: '8px', border: '1px solid var(--border-dim)' }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {rentMode === 'online' && (
            <div style={{ padding: '20px', background: 'var(--bg-base)', borderRadius: '8px', border: '1px solid var(--border-strong)', marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '16px', color: 'var(--info)' }}>Room Rent - Online Proof</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Transaction ID</label>
                  <input
                    type="text"
                    value={form.rentTransactionId}
                    onChange={(e) => setForm({ ...form, rentTransactionId: e.target.value })}
                    placeholder="E.g., TXN123456789"
                    required={true}
                  />
                </div>

                <div className="form-group">
                  <label>Upload Screenshot</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleRentFileChange}
                    required={!form.rentScreenshotUrl}
                  />
                  {form.rentScreenshotUrl && (
                    <div style={{ marginTop: '10px' }}>
                      <img src={form.rentScreenshotUrl} alt="Screenshot Preview" style={{ maxWidth: '200px', borderRadius: '8px', border: '1px solid var(--border-dim)' }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            <button type="submit" className="btn-success" disabled={!messMode || !rentMode}>
              Confirm Payment
            </button>
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
                      <div style={{display:'flex', flexDirection:'column', gap:'4px', fontSize: '12px'}}>
                        {payment.messScreenshotUrl && <a href={`${API_URL}/payment/${payment._id}/screenshot?type=mess`} target="_blank" rel="noreferrer" style={{ color: '#3498db', textDecoration: 'underline' }}>Mess Proof</a>}
                        {payment.rentScreenshotUrl && <a href={`${API_URL}/payment/${payment._id}/screenshot?type=rent`} target="_blank" rel="noreferrer" style={{ color: '#3498db', textDecoration: 'underline' }}>Rent Proof</a>}
                        {(!payment.messScreenshotUrl && !payment.rentScreenshotUrl && payment.screenshotUrl) && <a href={`${API_URL}/payment/${payment._id}/screenshot`} target="_blank" rel="noreferrer" style={{ color: '#3498db', textDecoration: 'underline' }}>View Proof</a>}
                      </div>
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
