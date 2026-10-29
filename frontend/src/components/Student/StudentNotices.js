import React from 'react';

function StudentNotices() {
  const notices = [
    { id: 1, date: '2026-03-01', title: 'Hostel Rent Due', content: 'Please pay your monthly rent of ₹8500 (₹3500 Online + ₹5000 Cash) by the 5th of this month to avoid late fees.' },
    { id: 2, date: '2026-02-28', title: 'Maintenance Notice', content: 'Water supply will be unavailable on Thursday between 2 PM and 4 PM due to tank cleaning.' },
    { id: 3, date: '2026-02-15', title: 'Night Curfew Reminder', content: 'All students must return to their rooms by 10:30 PM. Main gates will be locked at 11:00 PM.' }
  ];

  return (
    <div className="notices-container" style={{ padding: '8px 0' }}>
      <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: '600', color: 'var(--text-main, #ededed)', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>📌</span> Notice Board & Updates
      </h2>
      <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted, #a1a1aa)', fontSize: '14px' }}>
        Important official notifications, schedule updates, and hostel guidelines.
      </p>

      <div className="notices-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {notices.map(notice => (
          <div 
            key={notice.id} 
            className="notice-card card" 
            style={{ 
              background: 'var(--bg-surface, #0a0a0a)', 
              border: '1px solid var(--border-dim, #262626)',
              borderLeft: '4px solid var(--accent, #ffffff)', 
              padding: '20px', 
              borderRadius: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <h4 style={{ margin: 0, color: 'var(--text-main, #ededed)', fontSize: '16px', fontWeight: '600' }}>
                {notice.title}
              </h4>
              <span style={{ fontSize: '12px', color: 'var(--text-muted, #a1a1aa)' }}>
                {new Date(notice.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted, #a1a1aa)', lineHeight: '1.6', fontSize: '14px' }}>
              {notice.content}
            </p>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '28px', padding: '22px', background: 'var(--bg-surface, #0a0a0a)', borderRadius: '10px', border: '1px solid var(--border-dim, #262626)' }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#fbbf24', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⚠️</span> Hostel Rules & Regulations
        </h3>
        <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-main, #ededed)', lineHeight: '1.8', fontSize: '14px' }}>
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
