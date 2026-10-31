import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrainCircuit, Loader2, FileText, AlertTriangle, CheckCircle, TrendingUp, Sparkles, MessageSquare } from 'lucide-react';
import { API_BASE_URL } from '../../api/config';

const API_URL = API_BASE_URL;

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

    // Open a blank window synchronously on user click to prevent browser pop-up blocking
    let reportWindow = null;
    try {
      reportWindow = window.open('', '_blank');
      if (reportWindow) {
        reportWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>StayTrack AI Report - Generating...</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 85vh; margin: 0; background: #0f172a; color: #f8fafc;">
              <div style="text-align: center; max-width: 480px; padding: 24px;">
                <div style="font-size: 36px; margin-bottom: 12px; animation: pulse 1.5s infinite;">🤖</div>
                <h2 style="margin: 0 0 10px 0; font-size: 22px; color: #38bdf8;">Generating StayTrack AI Report</h2>
                <p style="margin: 0; font-size: 14px; color: #94a3b8; line-height: 1.5;">Analyzing real-time hostel occupancy, active complaints, and predictive maintenance schedules...</p>
              </div>
            </body>
          </html>
        `);
      }
    } catch (_) {
      // Browser blocked window.open synchronously
    }

    try {
      const response = await axios.get(`${API_URL}/ai/reports/warden-summary`, { 
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'text' // Since it returns HTML
      });
      
      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>StayTrack AI Warden Operational Report</title>
            <style>
              body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; max-width: 860px; margin: 0 auto; background: #ffffff; }
              h1 { color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; font-size: 26px; }
              h2 { color: #1d4ed8; margin-top: 30px; font-size: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
              ul { padding-left: 20px; }
              li { margin-bottom: 8px; }
              p { margin-bottom: 14px; }
              strong { color: #0f172a; }
              .header-meta { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; margin-bottom: 24px; border-radius: 4px; font-size: 14px; }
              .footer { margin-top: 50px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; }
              @media print {
                body { padding: 20px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header-meta">
              <strong>StayTrack Enterprise AI Copilot</strong> &bull; Official Warden Operational Status Report
            </div>
            ${response.data}
            <div class="footer">Generated automatically by StayTrack Enterprise AI Copilot on ${new Date().toLocaleString('en-IN')}</div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `;

      if (reportWindow && !reportWindow.closed) {
        reportWindow.document.open();
        reportWindow.document.write(fullHtml);
        reportWindow.document.close();
      } else {
        // Fallback: If popup was blocked, create blob and open/download
        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const fallbackWindow = window.open(url, '_blank');
        if (!fallbackWindow) {
          const link = document.createElement('a');
          link.href = url;
          link.download = `StayTrack-AI-Warden-Report-${new Date().toISOString().slice(0, 10)}.html`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (error) {
      console.error("Failed to generate report:", error);
      if (reportWindow && !reportWindow.closed) {
        reportWindow.close();
      }
      alert("Failed to generate AI report. Please check if the backend service is reachable and try again.");
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
