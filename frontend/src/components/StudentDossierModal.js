import React, { useState } from 'react';

/**
 * STUDENT DOSSIER MODAL
 * Comprehensive view of a student's full profile:
 * Aadhaar, Academic & Study Status, Guardians, Emergency Contacts, Address, Food Preferences, Room, etc.
 * Shared across Warden & Owner dashboards.
 */
function StudentDossierModal({ student, onClose }) {
  const [showAadhar, setShowAadhar] = useState(false);

  if (!student) return null;

  const maskAadhar = (num) => {
    if (!num) return 'Not Provided';
    const cleaned = String(num).replace(/[\s-]/g, '');
    if (cleaned.length !== 12) return cleaned;
    return `XXXX XXXX ${cleaned.slice(-4)}`;
  };

  const formatAadhar = (num) => {
    if (!num) return 'Not Provided';
    const cleaned = String(num).replace(/[\s-]/g, '');
    if (cleaned.length === 12) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8, 12)}`;
    }
    return cleaned;
  };

  const handlePrint = () => {
    window.print();
  };

  const completion = student.profileCompletionPercentage !== undefined ? student.profileCompletionPercentage : (student.profileCompleted ? 100 : 40);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'var(--bg-surface, #121212)',
          border: '1px solid var(--border-strong, #333)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-dim, #262626)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-base, #000)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: '700',
              color: '#fff'
            }}>
              {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text-main, #fff)' }}>
                {student.name}
              </h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', fontSize: '13px', color: 'var(--text-muted, #888)' }}>
                <span>@{student.username}</span>
                <span>•</span>
                <span style={{ color: '#3b82f6', fontWeight: '500' }}>
                  {student.roomNumber ? `Room ${student.roomNumber}` : 'Room Unassigned'}
                </span>
                <span>•</span>
                <span style={{ 
                  color: student.presenceStatus === 'on_leave' ? 'var(--warning, #fbbf24)' : 'var(--success, #34d399)',
                  fontWeight: '500'
                }}>
                  {student.presenceStatus === 'on_leave' ? '🔴 On Leave (At Home)' : '🟢 In Hostel'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              background: completion >= 80 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(251, 191, 36, 0.15)',
              color: completion >= 80 ? '#34d399' : '#fbbf24',
              border: `1px solid ${completion >= 80 ? 'rgba(52, 211, 153, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`
            }}>
              {completion >= 80 ? `✓ KYC Complete (${completion}%)` : `⚠️ KYC Incomplete (${completion}%)`}
            </span>
            <button 
              onClick={handlePrint} 
              style={{
                background: 'transparent',
                border: '1px solid var(--border-dim, #333)',
                color: 'var(--text-main, #fff)',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
              title="Print Dossier"
            >
              🖨️ Print
            </button>
            <button 
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #888)',
                fontSize: '22px',
                cursor: 'pointer',
                lineHeight: '1',
                padding: '4px 8px'
              }}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body (Scrollable) */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Section 1: Academic & Study Status */}
          <div style={{
            background: 'var(--bg-hover, #1a1a1a)',
            border: '1px solid var(--border-dim, #262626)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'var(--text-main, #fff)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🎓</span> Academic & Current Study Status
              </h3>
              {student.studyStatus && (
                <span style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {student.studyStatus}
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)', display: 'block' }}>College / University</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main, #fff)' }}>
                  {student.collegeName || 'Not Provided'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)', display: 'block' }}>Degree / Course</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main, #fff)' }}>
                  {student.course || 'Not Provided'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)', display: 'block' }}>Branch / Specialization</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main, #fff)' }}>
                  {student.branch || 'Not Provided'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)', display: 'block' }}>Current Year / Semester</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main, #fff)' }}>
                  {student.currentYear || 'Not Provided'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)', display: 'block' }}>Roll No / Enrollment No</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main, #fff)' }}>
                  {student.enrollmentNumber || 'Not Provided'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Identity & KYC Details */}
          <div style={{
            background: 'var(--bg-hover, #1a1a1a)',
            border: '1px solid var(--border-dim, #262626)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: '600', color: 'var(--text-main, #fff)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🪪</span> Identity & Aadhaar KYC
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)', display: 'block' }}>Aadhaar Number</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', fontFamily: 'monospace', color: student.aadharNumber ? '#34d399' : 'var(--text-muted, #888)' }}>
                    {showAadhar ? formatAadhar(student.aadharNumber) : maskAadhar(student.aadharNumber)}
                  </span>
                  {student.aadharNumber && (
                    <button 
                      type="button" 
                      onClick={() => setShowAadhar(!showAadhar)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: '#60a5fa',
                        padding: '0 4px'
                      }}
                    >
                      {showAadhar ? 'Hide' : 'Show'}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)', display: 'block' }}>Date of Birth</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main, #fff)' }}>
                  {student.dob || 'Not Provided'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)', display: 'block' }}>Gender</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main, #fff)' }}>
                  {student.gender || 'Not Provided'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)', display: 'block' }}>Blood Group</span>
                <span style={{ 
                  display: 'inline-block',
                  background: student.bloodGroup ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                  color: student.bloodGroup ? '#f87171' : 'var(--text-muted, #888)',
                  padding: student.bloodGroup ? '2px 8px' : 0,
                  borderRadius: '4px',
                  fontWeight: '600',
                  fontSize: '13px'
                }}>
                  {student.bloodGroup ? `🩸 ${student.bloodGroup}` : 'Not Provided'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)', display: 'block' }}>Student Phone</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main, #fff)' }}>
                  {student.phone ? <a href={`tel:${student.phone}`} style={{ color: '#60a5fa', textDecoration: 'none' }}>📞 {student.phone}</a> : 'Not Provided'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)', display: 'block' }}>Email Address</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main, #fff)' }}>
                  {student.email ? <a href={`mailto:${student.email}`} style={{ color: '#60a5fa', textDecoration: 'none' }}>✉️ {student.email}</a> : 'Not Provided'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Parents & Guardian Contacts */}
          <div style={{
            background: 'var(--bg-hover, #1a1a1a)',
            border: '1px solid var(--border-dim, #262626)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: '600', color: 'var(--text-main, #fff)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👨‍👩‍👧</span> Parent & Guardian Contacts
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)', display: 'block' }}>Father's Name</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main, #fff)' }}>
                  {student.fatherName || 'Not Provided'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)', display: 'block' }}>Father's Contact</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main, #fff)' }}>
                  {student.fatherPhone ? <a href={`tel:${student.fatherPhone}`} style={{ color: '#34d399', textDecoration: 'none' }}>📞 {student.fatherPhone}</a> : 'Not Provided'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)', display: 'block' }}>Mother's Name</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main, #fff)' }}>
                  {student.motherName || 'Not Provided'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)', display: 'block' }}>Mother's Contact</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main, #fff)' }}>
                  {student.motherPhone ? <a href={`tel:${student.motherPhone}`} style={{ color: '#34d399', textDecoration: 'none' }}>📞 {student.motherPhone}</a> : 'Not Provided'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)', display: 'block' }}>Primary Guardian</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main, #fff)' }}>
                  {student.guardianName ? `${student.guardianName} (${student.guardianRelation || 'Guardian'})` : 'Not Provided'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)', display: 'block' }}>Guardian Phone</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main, #fff)' }}>
                  {student.guardianPhone ? <a href={`tel:${student.guardianPhone}`} style={{ color: '#34d399', textDecoration: 'none' }}>📞 {student.guardianPhone}</a> : 'Not Provided'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Emergency Contacts & Address */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* Emergency Contact */}
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '600', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🚨</span> Emergency Contact (Immediate)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)', display: 'block' }}>Contact Name & Relation</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main, #fff)' }}>
                    {student.emergencyContactName ? `${student.emergencyContactName} (${student.emergencyContactRelation || 'Emergency'})` : 'Not Provided'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)', display: 'block' }}>Emergency Phone</span>
                  <div style={{ marginTop: '4px' }}>
                    {student.emergencyContactPhone ? (
                      <a 
                        href={`tel:${student.emergencyContactPhone}`} 
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#ef4444',
                          color: '#fff',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontWeight: '600',
                          fontSize: '13px'
                        }}
                      >
                        📞 Call {student.emergencyContactPhone}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted, #888)', fontSize: '14px' }}>No Emergency Number on File</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Permanent Address */}
            <div style={{
              background: 'var(--bg-hover, #1a1a1a)',
              border: '1px solid var(--border-dim, #262626)',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '600', color: 'var(--text-main, #fff)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🏠</span> Permanent Address
              </h3>
              <div style={{ fontSize: '14px', color: 'var(--text-main, #fff)', lineHeight: '1.6' }}>
                {student.permanentAddress ? (
                  <>
                    <p style={{ margin: '0 0 4px 0' }}>{student.permanentAddress}</p>
                    <p style={{ margin: 0, color: 'var(--text-muted, #888)' }}>
                      {[student.city, student.state, student.pincode].filter(Boolean).join(', ')}
                    </p>
                  </>
                ) : (
                  <span style={{ color: 'var(--text-muted, #888)' }}>Address Not Provided</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 5: Food & Preferences */}
          <div style={{
            background: 'var(--bg-hover, #1a1a1a)',
            border: '1px solid var(--border-dim, #262626)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '600', color: 'var(--text-main, #fff)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🍽️</span> Living & Hostel Preferences
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)', display: 'block' }}>Mess Dietary Preference</span>
                <span style={{ 
                  display: 'inline-block',
                  background: student.foodPreference ? 'rgba(52, 211, 153, 0.15)' : 'transparent',
                  color: student.foodPreference ? '#34d399' : 'var(--text-muted, #888)',
                  padding: student.foodPreference ? '2px 8px' : 0,
                  borderRadius: '4px',
                  fontWeight: '600',
                  fontSize: '13px',
                  marginTop: '2px'
                }}>
                  {student.foodPreference || 'Not Specified'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)', display: 'block' }}>Vehicle Number</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main, #fff)' }}>
                  {student.vehicleNumber || 'No Vehicle Registered'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)', display: 'block' }}>Medical Notes / Allergies</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main, #fff)' }}>
                  {student.medicalConditions || 'None Recorded'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-dim, #262626)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          background: 'var(--bg-base, #000)'
        }}>
          <button 
            type="button" 
            className="btn-secondary"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              background: 'transparent',
              border: '1px solid var(--border-dim, #333)',
              color: 'var(--text-main, #fff)',
              cursor: 'pointer'
            }}
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentDossierModal;
