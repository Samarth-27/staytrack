import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { Loader2, TrendingUp, AlertTriangle, FileText, Download } from 'lucide-react';
import { API_BASE_URL } from '../../api/config';

const OwnerAIInsights = ({ token }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/insights`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setInsights(data);
    } catch (error) {
      console.error('Failed to fetch insights', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ai/reports/monthly`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const report = await res.json();

      // Generate PDF
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text(`AI Monthly Report - ${report.data.month}`, 14, 22);

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Revenue: Rs ${report.data.revenue}`, 14, 40);
      doc.text(`Pending Fees: ${report.data.pendingFees}`, 14, 50);
      doc.text(`Occupancy Rate: ${report.data.occupancyRate}`, 14, 60);
      doc.text(`Total Complaints: ${report.data.complaints.total} (Open: ${report.data.complaints.open})`, 14, 70);

      doc.setFont("helvetica", "bold");
      doc.text("Executive AI Summary & Suggestions:", 14, 90);

      doc.setFont("helvetica", "normal");
      const splitText = doc.splitTextToSize(report.aiSummary, 180);
      doc.text(splitText, 14, 100);

      doc.save(`StayTrack_AI_Report_${report.data.month}.pdf`);
    } catch (error) {
      console.error('Failed to generate report', error);
      alert('Error generating report.');
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return <div className="card" style={{display:'flex', justifyContent:'center', padding:'2rem'}}><Loader2 className="spinner" /></div>;
  }

  return (
    <div className="owner-ai-insights" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp color="#4361ee" /> AI Predictive Analytics
        </h2>
        <button 
          onClick={handleDownloadReport} 
          disabled={generatingReport}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: '#4361ee', color: '#fff', border: 'none',
            padding: '10px 20px', borderRadius: '8px', cursor: 'pointer'
          }}
        >
          {generatingReport ? <Loader2 size={18} className="spinner" /> : <Download size={18} />}
          Generate Monthly PDF
        </button>
      </div>

      {insights && (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="card stat-card" style={{ flex: 1, minWidth: '200px' }}>
            <div className="stat-icon"><AlertTriangle color="#f72585" /></div>
            <div className="stat-info">
              <h3>Top Complaint Trend</h3>
              <p style={{fontSize: '1.1rem', fontWeight: 'bold'}}>{insights.topComplaintCategory || 'N/A'}</p>
            </div>
          </div>
          
          <div className="card stat-card" style={{ flex: 1, minWidth: '200px' }}>
            <div className="stat-icon"><FileText color="#3a0ca3" /></div>
            <div className="stat-info">
              <h3>Maintenance Prediction</h3>
              <p style={{fontSize: '0.9rem', marginTop: '5px'}}>{insights.maintenancePrediction || 'All systems normal.'}</p>
            </div>
          </div>
          
          <div className="card stat-card" style={{ flex: 1, minWidth: '200px' }}>
            <div className="stat-icon"><TrendingUp color="#4cc9f0" /></div>
            <div className="stat-info">
              <h3>Revenue Forecast</h3>
              <p style={{fontSize: '1.1rem', fontWeight: 'bold'}}>{insights.revenueForecastingTrend || 'Stable'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerAIInsights;
