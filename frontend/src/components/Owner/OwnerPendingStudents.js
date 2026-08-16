import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../api/config';

const API_URL = API_BASE_URL;

function OwnerPendingStudents({ token }) {
  const [pendingStudents, setPendingStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingStudents();
  }, []);

  const fetchPendingStudents = async () => {
    try {
      const response = await axios.get(`${API_URL}/owner/pending-students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingStudents(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPendingAmount = pendingStudents.reduce((sum, p) => sum + p.amount, 0);

  if (loading) return <div className="loading">Loading pending students...</div>;

  return (
    <div className="pending-students-container">
      <div className="pending-summary">
        <h3>⚠️ Total Pending: ₹{totalPendingAmount}</h3>
        <p>Students: {pendingStudents.length}</p>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Room</th>
            <th>Phone</th>
            <th>Month</th>
            <th>Pending Amount</th>
          </tr>
        </thead>
        <tbody>
          {pendingStudents.length > 0 ? (
            pendingStudents.map(payment => (
              <tr key={payment._id}>
                <td>{payment.student?.name || 'Unknown Student'}</td>
                <td>Room {payment.room?.roomNumber || 'Unassigned'}</td>
                <td><a href={`tel:${payment.student?.phone}`}>{payment.student?.phone || '-'}</a></td>
                <td>{payment.month}</td>
                <td className="amount">₹{payment.amount}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="5" className="no-data">✓ All students have paid!</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default OwnerPendingStudents;
