import React, { useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

function OwnerReports({ token }) {
  const [activeReport, setActiveReport] = useState('revenue');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    generateReport(activeReport);
  }, [activeReport]);

  const generateReport = async (type) => {
    setLoading(true);
    setError('');
    setReportData(null);
    try {
      const endpoint = {
        'revenue': '/warden/report/revenue',
        'payments': '/warden/report/payments',
        'students': '/warden/report/students',
        'complaints': '/warden/report/complaints'
      }[type];
      
      const response = await axios.get(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(response.data);
    } catch (err) {
      setError('Failed to generate report: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();
    doc.text(`StayTrack - ${activeReport.toUpperCase()} REPORT`, 14, 15);
    
    if (Array.isArray(reportData.data)) {
      if (reportData.data.length === 0) return;
      const keys = Object.keys(reportData.data[0]);
      const head = [keys.map(k => k.toUpperCase())];
      const body = reportData.data.map(item => keys.map(k => String(item[k])));
      autoTable(doc, { head, body, startY: 20 });
    } else {
      const keys = Object.keys(reportData.data);
      const head = [['Month', 'Revenue']];
      const body = keys.map(k => [k, `Rs ${reportData.data[k]}`]);
      autoTable(doc, { head, body, startY: 20 });
    }

    doc.save(`${activeReport}-report.pdf`);
  };

  return (
    <div className="reports-container">
      <h2>Advanced Reports & Analytics</h2>
      
      <div className="tabs report-tabs" style={{ marginBottom: '20px' }}>
        <button className={activeReport === 'revenue' ? 'active' : ''} onClick={() => setActiveReport('revenue')}>Revenue</button>
        <button className={activeReport === 'payments' ? 'active' : ''} onClick={() => setActiveReport('payments')}>💳 Payments</button>
        <button className={activeReport === 'students' ? 'active' : ''} onClick={() => setActiveReport('students')}>Students</button>
        <button className={activeReport === 'complaints' ? 'active' : ''} onClick={() => setActiveReport('complaints')}>Complaints</button>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        {loading && <span style={{ color: '#3498db', fontWeight: 'bold' }}>Fetching latest data...</span>}
        {reportData && !loading && (
          <>
            <button className="btn-warning" onClick={downloadPDF}>
              Download PDF
            </button>
          </>
        )}
      </div>

      {error && <div className="message error">{error}</div>}

      {reportData && (
        <div className="report-content card">
          <h3>{activeReport.charAt(0).toUpperCase() + activeReport.slice(1)} Report</h3>
          
          <div className="report-stats" style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            {Object.entries(reportData.stats || {}).map(([key, value]) => (
              <div key={key} className="stat-box" style={{ background: 'var(--bg-surface)', padding: '15px', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                <p style={{ fontSize: '1.5em', margin: 0, fontWeight: 'bold' }}>
                  {typeof value === 'number' && key.toLowerCase().includes('amount') ? `₹${value}` : value}
                </p>
              </div>
            ))}
          </div>

          <div className="report-data" style={{ overflowX: 'auto', marginTop: '20px', background: 'var(--bg-surface)', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface)', textAlign: 'left', borderBottom: '1px solid var(--border-dim)' }}>
                  {Array.isArray(reportData.data) && reportData.data.length > 0 
                    ? Object.keys(reportData.data[0]).map(k => <th key={k} style={{ padding: '12px' }}>{k.toUpperCase()}</th>)
                    : (reportData.data && !Array.isArray(reportData.data) ? <><th style={{ padding: '12px' }}>MONTH</th><th style={{ padding: '12px' }}>REVENUE</th></> : null)
                  }
                </tr>
              </thead>
              <tbody>
                {Array.isArray(reportData.data) 
                  ? reportData.data.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                        {Object.values(item).map((val, i) => <td key={i} style={{ padding: '12px' }}>{String(val)}</td>)}
                      </tr>
                    ))
                  : (reportData.data ? Object.entries(reportData.data).map(([k, v]) => (
                      <tr key={k} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                        <td style={{ padding: '12px' }}>{k}</td>
                        <td style={{ padding: '12px' }}>₹{v}</td>
                      </tr>
                    )) : null)
                }
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerReports;
