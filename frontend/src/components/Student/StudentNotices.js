import React from 'react';

function StudentNotices() {
  const notices = [
    { id: 1, date: '2024-03-01', title: 'Hostel Rent Due', content: 'Please pay your monthly rent of ₹8500 (₹3500 Online + ₹5000 Cash) by the 5th of this month to avoid late fees.' },
    { id: 2, date: '2024-02-28', title: 'Maintenance Notice', content: 'Water supply will be unavailable on Thursday between 2 PM and 4 PM due to tank cleaning.' },
    { id: 3, date: '2024-02-15', title: 'Night Curfew Reminder', content: 'All students must return to their rooms by 10:30 PM. Main gates will be locked at 11:00 PM.' }
  ];

  return (
    <div className="notices-container" style={{ padding: '20px' }}>
      <h2>📌 Notice Board & Updates</h2>
      <div className="notices-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        {notices.map(notice => (
          <div key={notice.id} className="notice-card" style={{ background: '#fff', borderLeft: '4px solid #3498db', padding: '15px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, color: '#2c3e50' }}>{notice.title}</h4>
              <span style={{ fontSize: '12px', color: '#7f8c8d' }}>{new Date(notice.date).toLocaleDateString()}</span>
            </div>
            <p style={{ margin: 0, color: '#34495e', lineHeight: '1.5' }}>{notice.content}</p>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '30px', padding: '20px', background: '#fdf3e7', borderRadius: '8px', border: '1px solid #f39c12' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#e67e22' }}>⚠️ Hostel Rules</h3>
        <ul style={{ paddingLeft: '20px', margin: 0, color: '#d35400', lineHeight: '1.8' }}>
          <li>No loud music after 10 PM.</li>
          <li>Visitors are not allowed inside the rooms.</li>
          <li>Keep the common areas clean.</li>
          <li>Any damages to hostel property will be charged to the residents of the room.</li>
        </ul>
      </div>
    </div>
  );
}

export default StudentNotices;
