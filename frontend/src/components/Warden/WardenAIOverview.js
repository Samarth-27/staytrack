import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrainCircuit, Loader2, FileText, AlertTriangle, CheckCircle, TrendingUp, Sparkles, MessageSquare } from 'lucide-react';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

function WardenAIOverview({ token }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_URL}/warden/complaints`, { headers: { Authorization: `Bearer ${token}` } });
      const data = response.data || [];
      setComplaints(data);
      generateMockAIInsights(data);
    } catch (error) {
      console.error('Error fetching data for AI:', error);
    } finally {
      setLoading(false);
    }
  };

  // Simulate an AI analyzing the complaints
  const generateMockAIInsights = (data) => {
    const open = data.filter(c => c.status === 'open').length;
    const highPriority = data.filter(c => c.priority === 'high' && c.status !== 'resolved').length;
    const electrical = data.filter(c => c.title.toLowerCase().includes('electric') || c.title.toLowerCase().includes('fan') || c.title.toLowerCase().includes('light')).length;
    
    setTimeout(() => {
      setAiInsights({
        criticalAlerts: highPriority > 0 ? `${highPriority} high-priority issues require immediate attention.` : 'No critical issues at the moment.',
        pattern: electrical > 2 ? 'Recurring electrical issues detected across multiple rooms.' : 'Complaint distribution is normal.',
        efficiency: open > 10 ? 'Resolution rate has dropped. Backlog is building up.' : 'Resolution rate is optimal. Excellent workflow.',
        summary: `You have ${open} open complaints. Prioritize the ${highPriority} high-priority tasks first.`
      });
    }, 1500); // Simulate network delay
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const response = await axios.get(`${API_URL}/ai/reports/warden-summary`, { 
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'text' // Since it returns HTML
      });
      
      const reportWindow = window.open('', '_blank');
      reportWindow.document.write(`
        <html>
          <head>
            <title>StayTrack AI Report</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
              h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
              h2 { color: #2980b9; margin-top: 30px; }
              .footer { margin-top: 50px; font-size: 12px; color: #7f8c8d; text-align: center; }
            </style>
          </head>
          <body>
            ${response.data}
            <div class="footer">Generated automatically by StayTrack Enterprise AI Copilot on ${new Date().toLocaleString()}</div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      reportWindow.document.close();
    } catch (error) {
      console.error("Failed to generate report:", error);
      alert("Failed to generate AI report. Please check if the backend is running.");
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) return <div className="loading"><Loader2 className="spinner" /> Loading AI Systems...</div>;

  const openComplaints = complaints.filter(c => c.status === 'open').length;
  const inProgress = complaints.filter(c => c.status === 'in-progress').length;
  const resolved = complaints.filter(c => c.status === 'resolved').length;

  return (
    <div className="ai-overview-container">
      
      {/* AI Copilot Banner */}
      <div className="ai-copilot-banner">
        <div className="banner-content">
          <BrainCircuit size={48} className="ai-icon-large floating" />
          <div className="banner-text">
            <h2>StayTrack AI Copilot</h2>
            <p>Smart predictive insights and automated management reporting.</p>
          </div>
        </div>
        <button 
          className="btn-ai-generate" 
          onClick={handleGenerateReport} 
          disabled={generatingReport}
        >
          {generatingReport ? (
             <><Loader2 size={16} className="spinner" /> Generating...</>
          ) : (
             <><FileText size={16} /> Generate AI Report</>
          )}
        </button>
      </div>

      {/* AI Insights Grid */}
      <div className="ai-insights-grid">
        <div className="ai-card insight-main">
          <div className="ai-card-header">
            <Sparkles size={20} className="icon-gold" />
            <h3>Copilot Analysis</h3>
          </div>
          {aiInsights ? (
            <div className="insight-content">
              <p className="insight-summary">{aiInsights.summary}</p>
              <ul className="insight-list">
                <li><AlertTriangle size={16} className="icon-red" /> <strong>Alerts:</strong> {aiInsights.criticalAlerts}</li>
                <li><TrendingUp size={16} className="icon-blue" /> <strong>Pattern:</strong> {aiInsights.pattern}</li>
                <li><CheckCircle size={16} className="icon-green" /> <strong>Efficiency:</strong> {aiInsights.efficiency}</li>
              </ul>
            </div>
          ) : (
            <div className="insight-loading">
              <Loader2 className="spinner" size={24} />
              <p>Analyzing hostel data...</p>
            </div>
          )}
        </div>

        <div className="ai-card metrics-card">
          <div className="ai-card-header">
            <MessageSquare size={20} className="icon-blue" />
            <h3>Live Workload</h3>
          </div>
          <div className="metrics-wrapper">
            <div className="metric-item">
              <span className="metric-value open">{openComplaints}</span>
              <span className="metric-label">Open</span>
            </div>
            <div className="metric-item">
              <span className="metric-value progress">{inProgress}</span>
              <span className="metric-label">In Progress</span>
            </div>
            <div className="metric-item">
              <span className="metric-value resolved">{resolved}</span>
              <span className="metric-label">Resolved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent High Priority */}
      <div className="ai-urgent-section">
        <h3><AlertTriangle size={18} className="icon-red" /> Urgent Attention Required</h3>
        <table className="data-table mt-3">
          <thead>
            <tr>
              <th>Room</th>
              <th>Student</th>
              <th>Issue</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {complaints.filter(c => c.priority === 'high' && c.status !== 'resolved').length > 0 ? (
              complaints.filter(c => c.priority === 'high' && c.status !== 'resolved').slice(0,3).map(c => (
                <tr key={c._id}>
                  <td><strong>{c.room?.roomNumber || '?'}</strong></td>
                  <td>{c.student?.name || 'Unknown'}</td>
                  <td>{c.title}</td>
                  <td><span className={`status ${c.status}`}>{c.status}</span></td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" className="no-data">No urgent complaints right now. Good job!</td></tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default WardenAIOverview;
