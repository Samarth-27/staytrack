import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

const API_URL = API_BASE_URL;

function SecurityDepositList({ token, role = 'warden' }) {
  const [deposits, setDeposits] = useState([]);
  const [stats, setStats] = useState({
    totalDeposits: 0,
    pendingCount: 0,
    refundedCount: 0,
    totalPendingRefundAmount: 0,
    totalRefundedAmount: 0,
    totalDeductionsAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending_clearance'); // 'pending_clearance', 'refunded', 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Refund Settlement Modal State
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [refundForm, setRefundForm] = useState({
    deductionAmount: 0,
    deductionReason: '',
    refundMode: 'UPI',
    transactionId: '',
    notes: '',
    roomKeyReturned: true,
    roomInspectionPassed: true
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDeposits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/security-deposits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeposits(response.data.deposits || []);
      if (response.data.stats) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching security deposits:', error);
      showNotification('Failed to load security deposit records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const openRefundModal = (deposit) => {
    setSelectedDeposit(deposit);
    setRefundForm({
      deductionAmount: deposit.deductionAmount || 0,
      deductionReason: deposit.deductionReason || '',
      refundMode: 'UPI',
      transactionId: '',
      notes: '',
      roomKeyReturned: deposit.checklist?.roomKeyReturned !== false,
      roomInspectionPassed: deposit.checklist?.roomInspectionPassed !== false
    });
  };

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDeposit) return;

    if (['UPI', 'Bank Transfer'].includes(refundForm.refundMode) && !refundForm.transactionId.trim()) {
      showNotification('You have encountered an error: Transaction Reference / UTR ID is required for online refunds. Please correct your details and try again.', 'error');
      return;
    }

    setProcessing(true);
    try {
      const response = await axios.put(
        `${API_URL}/security-deposits/${selectedDeposit._id}/refund`,
        refundForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showNotification(response.data.message || '✓ Security deposit refund processed successfully!', 'success');
      setSelectedDeposit(null);
      fetchDeposits();
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message;
      showNotification(errMsg, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const filteredDeposits = deposits.filter(d => {
    if (activeTab !== 'all' && d.refundStatus !== activeTab) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (d.studentName && d.studentName.toLowerCase().includes(term)) ||
      (d.studentUsername && d.studentUsername.toLowerCase().includes(term)) ||
      (d.vacatedRoomNumber && String(d.vacatedRoomNumber).includes(term)) ||
      (d.refundDetails?.transactionId && d.refundDetails.transactionId.toLowerCase().includes(term)) ||
      (d.studentBankDetails?.upiId && d.studentBankDetails.upiId.toLowerCase().includes(term))
    );
  });

  return (
    <div className="security-deposit-container" style={{ paddingBottom: '30px' }}>
      
      {/* Title & Description */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2>💰 Security Deposit Exchange & Clearance</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted, #888)' }}>
            Students vacating the hostel are removed from rooms and passed here. The record is cleared once the security deposit is refunded back by the warden.
          </p>
        </div>
        <button 
          className="btn-secondary" 
          onClick={fetchDeposits}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          🔄 Refresh List
        </button>
      </div>

      {/* Notifications */}
      {message.text && (
        <div 
          className={`message ${message.type}`} 
          style={{
            marginBottom: '20px',
            padding: '12px 18px',
            borderRadius: '8px',
            background: message.type === 'success' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${message.type === 'success' ? '#34d399' : '#f87171'}`,
            color: message.type === 'success' ? '#34d399' : '#f87171',
            fontWeight: '500'
          }}
        >
          {message.text}
        </div>
      )}

      {/* KPI Cards */}
      <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ background: 'var(--bg-surface, #121212)', border: '1px solid rgba(251, 191, 36, 0.4)', borderRadius: '10px', padding: '16px' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: 'var(--text-muted, #888)' }}>⏳ Pending Clearance</h4>
          <p className="amount" style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#fbbf24' }}>
            {stats.pendingCount}
          </p>
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)' }}>
            Liability: ₹{stats.totalPendingRefundAmount.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="card" style={{ background: 'var(--bg-surface, #121212)', border: '1px solid rgba(52, 211, 153, 0.4)', borderRadius: '10px', padding: '16px' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: 'var(--text-muted, #888)' }}>✅ Refunded & Cleared</h4>
          <p className="amount" style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#34d399' }}>
            {stats.refundedCount}
          </p>
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)' }}>
            Returned: ₹{stats.totalRefundedAmount.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="card" style={{ background: 'var(--bg-surface, #121212)', border: '1px solid var(--border-dim, #262626)', borderRadius: '10px', padding: '16px' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: 'var(--text-muted, #888)' }}>✂️ Total Deductions Retained</h4>
          <p className="amount" style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#f87171' }}>
            ₹{stats.totalDeductionsAmount.toLocaleString('en-IN')}
          </p>
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)' }}>Damage & repair charges</span>
        </div>

        <div className="card" style={{ background: 'var(--bg-surface, #121212)', border: '1px solid var(--border-dim, #262626)', borderRadius: '10px', padding: '16px' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: 'var(--text-muted, #888)' }}>Total Vacated Students</h4>
          <p className="amount" style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#60a5fa' }}>
            {stats.totalDeposits}
          </p>
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)' }}>Rooms freed & vacated</span>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div className="tabs" style={{ padding: 0, border: 'none', display: 'flex', gap: '10px' }}>
          <button 
            className={activeTab === 'pending_clearance' ? 'active' : ''} 
            onClick={() => setActiveTab('pending_clearance')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: activeTab === 'pending_clearance' ? 'rgba(251, 191, 36, 0.2)' : 'var(--bg-surface, #141414)',
              border: `1px solid ${activeTab === 'pending_clearance' ? '#fbbf24' : 'var(--border-dim, #333)'}`,
              color: activeTab === 'pending_clearance' ? '#fbbf24' : 'var(--text-muted, #888)',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ⏳ Pending Refund ({stats.pendingCount})
          </button>
          
          <button 
            className={activeTab === 'refunded' ? 'active' : ''} 
            onClick={() => setActiveTab('refunded')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: activeTab === 'refunded' ? 'rgba(52, 211, 153, 0.2)' : 'var(--bg-surface, #141414)',
              border: `1px solid ${activeTab === 'refunded' ? '#34d399' : 'var(--border-dim, #333)'}`,
              color: activeTab === 'refunded' ? '#34d399' : 'var(--text-muted, #888)',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ✅ Cleared & Refunded ({stats.refundedCount})
          </button>

          <button 
            className={activeTab === 'all' ? 'active' : ''} 
            onClick={() => setActiveTab('all')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: activeTab === 'all' ? 'rgba(255, 255, 255, 0.1)' : 'var(--bg-surface, #141414)',
              border: `1px solid ${activeTab === 'all' ? '#fff' : 'var(--border-dim, #333)'}`,
              color: activeTab === 'all' ? '#fff' : 'var(--text-muted, #888)',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            All ({stats.totalDeposits})
          </button>
        </div>

        <input 
          type="text" 
          placeholder="🔍 Search student, vacated room, UPI, or txn ID..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          style={{
            flex: '1 1 260px',
            maxWidth: '350px',
            padding: '9px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border-dim, #333)',
            background: 'var(--bg-surface, #121212)',
            color: '#fff',
            fontSize: '13px'
          }}
        />
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="loading" style={{ textAlign: 'center', padding: '40px' }}>Loading security deposit records...</div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'var(--bg-surface, #121212)', borderRadius: '10px', border: '1px solid var(--border-dim, #262626)' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-base, #0a0a0a)', textAlign: 'left', borderBottom: '1px solid var(--border-dim, #262626)' }}>
                <th style={{ padding: '12px 16px' }}>Student</th>
                <th style={{ padding: '12px 16px' }}>Vacated Room</th>
                <th style={{ padding: '12px 16px' }}>Exit Reason</th>
                <th style={{ padding: '12px 16px' }}>Original Deposit</th>
                <th style={{ padding: '12px 16px' }}>Deductions</th>
                <th style={{ padding: '12px 16px' }}>Net Refund</th>
                <th style={{ padding: '12px 16px' }}>Bank / UPI Info</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeposits.length > 0 ? (
                filteredDeposits.map(deposit => {
                  const isPending = deposit.refundStatus === 'pending_clearance';

                  return (
                    <tr key={deposit._id} style={{ borderBottom: '1px solid var(--border-dim, #222)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div>
                          <strong style={{ color: 'var(--text-main, #fff)', fontSize: '14px' }}>
                            {deposit.studentName}
                          </strong>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted, #888)', marginTop: '2px' }}>
                            @{deposit.studentUsername} {deposit.studentPhone ? `• 📞 ${deposit.studentPhone}` : ''}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#f87171'
                        }}>
                          {deposit.vacatedRoomNumber ? `Room ${deposit.vacatedRoomNumber} (Freed)` : 'No Room'}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-main, #eee)' }}>
                        <div>{deposit.leaveReason || 'Hostel Exit'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted, #888)', marginTop: '2px' }}>
                          {new Date(deposit.vacatedAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-main, #fff)' }}>
                        ₹{(deposit.originalDepositAmount || 5000).toLocaleString('en-IN')}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        {deposit.deductionAmount > 0 ? (
                          <div style={{ color: '#f87171', fontWeight: '600' }}>
                            -₹{deposit.deductionAmount.toLocaleString('en-IN')}
                            <div style={{ fontSize: '11px', color: 'var(--text-muted, #888)' }}>{deposit.deductionReason}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted, #888)', fontSize: '13px' }}>₹0</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', fontWeight: '700', color: isPending ? '#fbbf24' : '#34d399', fontSize: '15px' }}>
                        ₹{(deposit.netRefundAmount || deposit.originalDepositAmount || 5000).toLocaleString('en-IN')}
                      </td>

                      <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted, #aaa)' }}>
                        {deposit.studentBankDetails?.upiId ? (
                          <div>
                            <span style={{ color: '#60a5fa', fontWeight: '600' }}>UPI: </span>
                            {deposit.studentBankDetails.upiId}
                          </div>
                        ) : deposit.studentBankDetails?.accountNumber ? (
                          <div>
                            <div>A/C: {deposit.studentBankDetails.accountNumber}</div>
                            <div>IFSC: {deposit.studentBankDetails.ifscCode}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#888' }}>Not Provided</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: isPending ? 'rgba(251, 191, 36, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                          color: isPending ? '#fbbf24' : '#34d399',
                          border: `1px solid ${isPending ? 'rgba(251, 191, 36, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`
                        }}>
                          {isPending ? '⏳ Refund Pending' : '✅ Cleared / Refunded'}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        {isPending ? (
                          <button 
                            className="btn-primary" 
                            onClick={() => openRefundModal(deposit)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              background: '#10b981',
                              border: 'none',
                              color: '#fff'
                            }}
                          >
                            💸 Refund & Clear
                          </button>
                        ) : (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted, #888)' }}>
                            <div style={{ color: '#34d399', fontWeight: '600' }}>
                              via {deposit.refundDetails?.refundMode || 'Online'}
                            </div>
                            <div>Txn: {deposit.refundDetails?.transactionId || 'N/A'}</div>
                            <div>{deposit.refundDetails?.refundedAt ? new Date(deposit.refundDetails.refundedAt).toLocaleDateString() : ''}</div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '35px', color: 'var(--text-muted, #888)' }}>
                    No security deposit records found in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Settle Refund Modal */}
      {selectedDeposit && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2200,
          padding: '20px'
        }} onClick={() => setSelectedDeposit(null)}>
          <div 
            style={{
              background: 'var(--bg-surface, #141414)',
              border: '1px solid var(--border-strong, #333)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '560px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
              overflow: 'hidden'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-dim, #262626)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-base, #000)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '600', color: 'var(--text-main, #fff)' }}>
                  💸 Settle Security Deposit Refund
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted, #888)' }}>
                  Refunding student: <strong>{selectedDeposit.studentName}</strong> (Room {selectedDeposit.vacatedRoomNumber || 'N/A'})
                </p>
              </div>
              <button 
                onClick={() => setSelectedDeposit(null)}
                style={{ background: 'none', border: 'none', color: '#888', fontSize: '22px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleRefundSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Financial Breakdown Card */}
              <div style={{ background: 'var(--bg-hover, #1e1e1e)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-dim, #333)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted, #aaa)' }}>Original Security Deposit:</span>
                  <strong style={{ color: '#fff' }}>₹{selectedDeposit.originalDepositAmount || 5000}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#f87171' }}>Damage / Key Deductions:</span>
                  <strong style={{ color: '#f87171' }}>-₹{Number(refundForm.deductionAmount) || 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #333', fontSize: '15px' }}>
                  <span style={{ color: '#34d399', fontWeight: '600' }}>Final Amount to Refund:</span>
                  <strong style={{ color: '#34d399', fontSize: '18px' }}>
                    ₹{Math.max(0, (selectedDeposit.originalDepositAmount || 5000) - (Number(refundForm.deductionAmount) || 0)).toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              {/* Deductions Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>Deduction (₹)</label>
                  <input 
                    type="number" 
                    min="0"
                    max={selectedDeposit.originalDepositAmount || 5000}
                    value={refundForm.deductionAmount}
                    onChange={(e) => setRefundForm({ ...refundForm, deductionAmount: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>Deduction Reason (if any)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Wall painting repair, Lost room key"
                    value={refundForm.deductionReason}
                    onChange={(e) => setRefundForm({ ...refundForm, deductionReason: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }}
                  />
                </div>
              </div>

              {/* Checklist */}
              <div style={{ display: 'flex', gap: '20px', background: 'var(--bg-base, #0a0a0a)', padding: '10px 14px', borderRadius: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={refundForm.roomKeyReturned} 
                    onChange={(e) => setRefundForm({ ...refundForm, roomKeyReturned: e.target.checked })} 
                  />
                  🔑 Room Keys Handed Over
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={refundForm.roomInspectionPassed} 
                    onChange={(e) => setRefundForm({ ...refundForm, roomInspectionPassed: e.target.checked })} 
                  />
                  🧹 Room Inspection Done
                </label>
              </div>

              {/* Student Target Bank / UPI Details */}
              {selectedDeposit.studentBankDetails?.upiId && (
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '10px', borderRadius: '6px', fontSize: '12px', color: '#93c5fd' }}>
                  💡 Student requested refund to UPI ID: <strong>{selectedDeposit.studentBankDetails.upiId}</strong>
                </div>
              )}

              {/* Payment Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>Refund Mode *</label>
                  <select 
                    value={refundForm.refundMode} 
                    onChange={(e) => setRefundForm({ ...refundForm, refundMode: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }}
                    required
                  >
                    <option value="UPI">UPI Transfer</option>
                    <option value="Bank Transfer">Bank NEFT / IMPS</option>
                    <option value="Cash">Cash Handover</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>
                    {refundForm.refundMode === 'Cash' ? 'Receipt / Memo No (Optional)' : 'Transaction ID / UTR *'}
                  </label>
                  <input 
                    type="text" 
                    placeholder={refundForm.refundMode === 'Cash' ? 'Cash receipt #' : 'e.g. 429381748291 or UPI Ref'}
                    value={refundForm.transactionId}
                    onChange={(e) => setRefundForm({ ...refundForm, transactionId: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }}
                    required={refundForm.refundMode !== 'Cash'}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>Clearance Notes / Remarks</label>
                <input 
                  type="text" 
                  placeholder="e.g. Refund sent via Google Pay, room checked by warden"
                  value={refundForm.notes}
                  onChange={(e) => setRefundForm({ ...refundForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }}
                />
              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setSelectedDeposit(null)}
                  disabled={processing}
                  style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={processing}
                  style={{ padding: '8px 20px', borderRadius: '6px', background: '#10b981', border: 'none', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
                >
                  {processing ? 'Processing Settlement...' : '✓ Confirm & Clear Deposit'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default SecurityDepositList;
