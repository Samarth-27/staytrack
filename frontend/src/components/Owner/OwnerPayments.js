import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../api/config';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = API_BASE_URL;

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

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Owner Room Rent Report", 14, 15);
    
    const tableData = filteredPayments.map(p => [
      p.student?.name || 'Unknown',
      `Room ${p.room?.roomNumber || 'Unassigned'}`,
      p.month,
      `Rs 3500`,
      p.status,
      p.paidDate ? new Date(p.paidDate).toLocaleDateString() : '-'
    ]);

    autoTable(doc, {
      head: [['Student', 'Room', 'Month', 'Rent Amount', 'Status', 'Paid Date']],
      body: tableData,
      startY: 20
    });

    doc.save('owner-rent-payments.pdf');
  };

  const filteredPayments = filterStatus === 'all'
    ? payments
    : payments.filter(p => p.status === filterStatus);

  const totalAmount = filteredPayments.length * 3500;
  const paidAmount = filteredPayments.filter(p => p.status === 'paid').length * 3500;
  const pendingAmount = filteredPayments.filter(p => p.status === 'pending' || p.status === 'pending_verification').length * 3500;

  if (loading) return <div className="loading">Loading payments...</div>;

  return (
    <div className="payments-container">
      <div className="summary-cards">
        <div className="card"><h4>Total Rent Expected</h4><p className="amount">₹{totalAmount}</p></div>
        <div className="card paid"><h4>Rent Received</h4><p className="amount">₹{paidAmount}</p></div>
        <div className="card pending"><h4>Rent Pending</h4><p className="amount">₹{pendingAmount}</p></div>
      </div>

      <div style={{ margin: '15px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn-primary" onClick={downloadPDF}>⬇️ Download PDF Report</button>
        <div className="filter-section" style={{ marginBottom: 0 }}>
          <label style={{ marginRight: '10px' }}>Filter by Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="pending_verification">Reviewing</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Room</th>
            <th>Month</th>
            <th>Rent</th>
            <th>Status</th>
            <th>Paid Date</th>
            <th>Rent Proof</th>
          </tr>
        </thead>
        <tbody>
          {filteredPayments.length > 0 ? (
            filteredPayments.map(payment => (
              <tr key={payment._id}>
                <td>{payment.student?.name || 'Unknown Student'}</td>
                <td>Room {payment.room?.roomNumber || 'Unassigned'}</td>
                <td>{payment.month}</td>
                <td>₹3500</td>
                <td><span className={`status ${payment.status}`}>{payment.status === 'pending_verification' ? 'Reviewing' : payment.status}</span></td>
                <td>{payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : '-'}</td>
                <td>
                  {payment.hasScreenshot ? (
                    <div style={{display:'flex', flexDirection:'column', gap:'4px', fontSize: '12px'}}>
                      {payment.rentScreenshotUrl && (
                        <a href={`${API_URL}/payment/${payment._id}/screenshot?type=rent`} target="_blank" rel="noreferrer" download="Rent_Proof.jpg" style={{ color: '#3498db', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          📄 View / Download
                        </a>
                      )}
                      {(!payment.messScreenshotUrl && !payment.rentScreenshotUrl && payment.screenshotUrl) && (
                        <a href={`${API_URL}/payment/${payment._id}/screenshot`} target="_blank" rel="noreferrer" download="Payment_Proof.jpg" style={{ color: '#3498db', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          📄 View / Download
                        </a>
                      )}
                      {!payment.rentScreenshotUrl && payment.messScreenshotUrl && !payment.screenshotUrl && (
                         <span style={{ color: '#888' }}>No rent proof</span>
                      )}
                    </div>
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
