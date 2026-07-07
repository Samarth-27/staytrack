import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

function WardenRooms({ token }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRooms(); }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API_URL}/warden/rooms`, { headers: { Authorization: `Bearer ${token}` } });
      setRooms(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading rooms...</div>;

  const occupiedCount = rooms.filter(r => r.status === 'occupied').length;

  return (
    <div className="rooms-container">
      <div className="summary-cards">
        <div className="card"><h4>Total Rooms</h4><p className="count">{rooms.length}</p></div>
        <div className="card occupied"><h4>Occupied</h4><p className="count">{occupiedCount}</p></div>
        <div className="card vacant"><h4>Vacant</h4><p className="count">{rooms.length - occupiedCount}</p></div>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Room No.</th>
            <th>Capacity</th>
            <th>Occupied</th>
            <th>Status</th>
            <th>Students</th>
          </tr>
        </thead>
        <tbody>
          {rooms.length > 0 ? (
            rooms.map(room => (
              <tr key={room._id}>
                <td><strong>Room {room.roomNumber}</strong></td>
                <td>{room.capacity}</td>
                <td>{room.students.length}/{room.capacity}</td>
                <td><span className={`status ${room.status}`}>{room.status === 'occupied' ? '✓ Occupied' : '□ Vacant'}</span></td>
                <td>{room.students.map(s => s.name).join(', ') || 'No students'}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="5" className="no-data">No rooms</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
export default WardenRooms;
