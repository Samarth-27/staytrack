import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../api/config';

const API_URL = API_BASE_URL;

function StudentProfile({ token }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [saving, setSaving] = useState(false);
  const [showAadhar, setShowAadhar] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    aadharNumber: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    studyStatus: '',
    collegeName: '',
    course: '',
    branch: '',
    currentYear: '',
    enrollmentNumber: '',
    fatherName: '',
    fatherPhone: '',
    motherName: '',
    motherPhone: '',
    guardianName: '',
    guardianRelation: '',
    guardianPhone: '',
    guardianEmail: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
    permanentAddress: '',
    city: '',
    state: '',
    pincode: '',
    foodPreference: '',
    vehicleNumber: '',
    medicalConditions: ''
  });

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/student/profile?t=${new Date().getTime()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      if (response.data?.student) {
        populateForm(response.data.student);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (s) => {
    setFormData({
      name: s.name || '',
      phone: s.phone || '',
      email: s.email || '',
      aadharNumber: s.aadharNumber || '',
      dob: s.dob || '',
      gender: s.gender || '',
      bloodGroup: s.bloodGroup || '',
      studyStatus: s.studyStatus || '',
      collegeName: s.collegeName || '',
      course: s.course || '',
      branch: s.branch || '',
      currentYear: s.currentYear || '',
      enrollmentNumber: s.enrollmentNumber || '',
      fatherName: s.fatherName || '',
      fatherPhone: s.fatherPhone || '',
      motherName: s.motherName || '',
      motherPhone: s.motherPhone || '',
      guardianName: s.guardianName || '',
      guardianRelation: s.guardianRelation || '',
      guardianPhone: s.guardianPhone || '',
      guardianEmail: s.guardianEmail || '',
      emergencyContactName: s.emergencyContactName || '',
      emergencyContactRelation: s.emergencyContactRelation || '',
      emergencyContactPhone: s.emergencyContactPhone || '',
      permanentAddress: s.permanentAddress || '',
      city: s.city || '',
      state: s.state || '',
      pincode: s.pincode || '',
      foodPreference: s.foodPreference || '',
      vehicleNumber: s.vehicleNumber || '',
      medicalConditions: s.medicalConditions || ''
    });
  };

  const showNotification = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 6000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    // Client-side quick validations
    if (formData.aadharNumber && formData.aadharNumber.replace(/[\s-]/g, '').length !== 12) {
      showNotification('You have encountered an error: Aadhaar number must be a valid 12-digit number. Please correct your details and try again.', 'error');
      setSaving(false);
      return;
    }

    if (formData.phone && formData.phone.replace(/[\s-]/g, '').length !== 10) {
      showNotification('You have encountered an error: Phone number must be a valid 10-digit number. Please correct your details and try again.', 'error');
      setSaving(false);
      return;
    }

    if (formData.emergencyContactPhone && formData.emergencyContactPhone.replace(/[\s-]/g, '').length !== 10) {
      showNotification('You have encountered an error: Emergency contact phone must be 10 digits. Please correct your details and try again.', 'error');
      setSaving(false);
      return;
    }

    if (formData.pincode && formData.pincode.replace(/\s/g, '').length !== 6) {
      showNotification('You have encountered an error: PIN code must be a valid 6-digit number. Please correct your details and try again.', 'error');
      setSaving(false);
      return;
    }

    try {
      const response = await axios.put(`${API_URL}/student/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(prev => ({ ...prev, student: response.data.student }));
      populateForm(response.data.student);
      showNotification('✓ Profile and KYC details saved successfully!', 'success');
      setShowEditModal(false);
    } catch (error) {
      const errMsg = error.response?.data?.message || `You have encountered an error: ${error.message}. Please correct your details and try again.`;
      showNotification(errMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) return <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>📋 Loading comprehensive profile...</div>;
  if (!profile) return <div className="error" style={{ padding: '40px', textAlign: 'center' }}>Failed to load profile. Please refresh.</div>;

  const { student, room } = profile;
  const completion = student.profileCompletionPercentage !== undefined ? student.profileCompletionPercentage : (student.profileCompleted ? 100 : 35);

  return (
    <div className="profile-container" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Notifications */}
      {message.text && (
        <div 
          className={`message ${message.type}`} 
          style={{
            marginBottom: '20px',
            padding: '14px 18px',
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

      {/* Top Banner & Profile Completion */}
      <div style={{
        background: 'var(--bg-surface, #121212)',
        border: '1px solid var(--border-dim, #262626)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: '700',
              color: '#fff'
            }}>
              {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: 'var(--text-main, #fff)' }}>
                {student.name}
              </h2>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px', fontSize: '14px', color: 'var(--text-muted, #888)' }}>
                <span>@{student.username}</span>
                <span>•</span>
                <span style={{ color: '#3b82f6', fontWeight: '600' }}>
                  {room ? `Room ${room.roomNumber}` : 'Unassigned'}
                </span>
                <span>•</span>
                <span style={{ 
                  color: student.presenceStatus === 'on_leave' ? 'var(--warning, #fbbf24)' : 'var(--success, #34d399)',
                  fontWeight: '600'
                }}>
                  {student.presenceStatus === 'on_leave' ? '🔴 On Leave' : '🟢 In Hostel'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              className="btn-primary" 
              onClick={() => setShowEditModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <span>✏️</span> Edit / Complete Profile
            </button>
          </div>
        </div>

        {/* Profile Completion Bar */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-dim, #262626)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main, #fff)' }}>
              Profile & KYC Verification Progress
            </span>
            <span style={{
              fontSize: '13px',
              fontWeight: '700',
              color: completion >= 80 ? '#34d399' : '#fbbf24'
            }}>
              {completion}% Completed {completion >= 80 ? '✓' : '(Action Required)'}
            </span>
          </div>

          <div style={{
            height: '8px',
            background: 'var(--bg-hover, #222)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${completion}%`,
              background: completion >= 80 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
              transition: 'width 0.4s ease'
            }} />
          </div>

          {completion < 80 && (
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#fbbf24' }}>
              ⚠️ Please fill in all required fields (Aadhaar, Study Status, College, Guardian Phone, Address) so the Warden and Owner have complete official records.
            </p>
          )}
        </div>
      </div>

      {/* Grid of Profile Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Card 1: Academic & Study Status */}
        <div style={{
          background: 'var(--bg-surface, #121212)',
          border: '1px solid var(--border-dim, #262626)',
          borderRadius: '10px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--text-main, #fff)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎓</span> Academic & Study Status
            </h3>
            {student.studyStatus && (
              <span style={{
                background: 'rgba(59, 130, 246, 0.2)',
                color: '#60a5fa',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                {student.studyStatus}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div>
              <span style={{ color: 'var(--text-muted, #888)', display: 'block', fontSize: '11px' }}>Current Status</span>
              <span style={{ color: 'var(--text-main, #fff)', fontWeight: '500' }}>{student.studyStatus || 'Not Specified'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted, #888)', display: 'block', fontSize: '11px' }}>College / Institute</span>
              <span style={{ color: 'var(--text-main, #fff)', fontWeight: '500' }}>{student.collegeName || 'Not Specified'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted, #888)', display: 'block', fontSize: '11px' }}>Course / Degree</span>
              <span style={{ color: 'var(--text-main, #fff)', fontWeight: '500' }}>{student.course || 'Not Specified'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted, #888)', display: 'block', fontSize: '11px' }}>Branch / Stream</span>
              <span style={{ color: 'var(--text-main, #fff)', fontWeight: '500' }}>{student.branch || 'Not Specified'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted, #888)', display: 'block', fontSize: '11px' }}>Year / Semester</span>
              <span style={{ color: 'var(--text-main, #fff)', fontWeight: '500' }}>{student.currentYear || 'Not Specified'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted, #888)', display: 'block', fontSize: '11px' }}>Enrollment / Roll No</span>
              <span style={{ color: 'var(--text-main, #fff)', fontWeight: '500' }}>{student.enrollmentNumber || 'Not Specified'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Identity & Aadhaar KYC */}
        <div style={{
          background: 'var(--bg-surface, #121212)',
          border: '1px solid var(--border-dim, #262626)',
          borderRadius: '10px',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text-main, #fff)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🪪</span> Identity & KYC
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div>
              <span style={{ color: 'var(--text-muted, #888)', display: 'block', fontSize: '11px' }}>Aadhaar Number</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: student.aadharNumber ? '#34d399' : 'var(--text-muted, #888)', fontWeight: '600', fontFamily: 'monospace' }}>
                  {showAadhar ? formatAadhar(student.aadharNumber) : maskAadhar(student.aadharNumber)}
                </span>
                {student.aadharNumber && (
                  <button 
                    type="button" 
                    onClick={() => setShowAadhar(!showAadhar)}
                    style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '12px' }}
                  >
                    {showAadhar ? 'Hide' : 'Show'}
                  </button>
                )}
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted, #888)', display: 'block', fontSize: '11px' }}>Date of Birth</span>
              <span style={{ color: 'var(--text-main, #fff)', fontWeight: '500' }}>{student.dob || 'Not Provided'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted, #888)', display: 'block', fontSize: '11px' }}>Gender</span>
              <span style={{ color: 'var(--text-main, #fff)', fontWeight: '500' }}>{student.gender || 'Not Provided'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted, #888)', display: 'block', fontSize: '11px' }}>Blood Group</span>
              <span style={{ color: student.bloodGroup ? '#f87171' : 'var(--text-muted, #888)', fontWeight: '600' }}>
                {student.bloodGroup ? `🩸 ${student.bloodGroup}` : 'Not Provided'}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted, #888)', display: 'block', fontSize: '11px' }}>Phone</span>
              <span style={{ color: 'var(--text-main, #fff)', fontWeight: '500' }}>{student.phone || 'Not Provided'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted, #888)', display: 'block', fontSize: '11px' }}>Email</span>
              <span style={{ color: 'var(--text-main, #fff)', fontWeight: '500' }}>{student.email || 'Not Provided'}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Parents & Guardian */}
        <div style={{
          background: 'var(--bg-surface, #121212)',
          border: '1px solid var(--border-dim, #262626)',
          borderRadius: '10px',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text-main, #fff)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>👨‍👩‍👧</span> Parents & Guardian
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div>
              <span style={{ color: 'var(--text-muted, #888)', display: 'block', fontSize: '11px' }}>Father's Name & Phone</span>
              <span style={{ color: 'var(--text-main, #fff)', fontWeight: '500' }}>
                {student.fatherName ? `${student.fatherName} ${student.fatherPhone ? `(${student.fatherPhone})` : ''}` : 'Not Provided'}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted, #888)', display: 'block', fontSize: '11px' }}>Mother's Name & Phone</span>
              <span style={{ color: 'var(--text-main, #fff)', fontWeight: '500' }}>
                {student.motherName ? `${student.motherName} ${student.motherPhone ? `(${student.motherPhone})` : ''}` : 'Not Provided'}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted, #888)', display: 'block', fontSize: '11px' }}>Local / Legal Guardian</span>
              <span style={{ color: 'var(--text-main, #fff)', fontWeight: '500' }}>
                {student.guardianName ? `${student.guardianName} (${student.guardianRelation || 'Guardian'})` : 'Not Provided'}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted, #888)', display: 'block', fontSize: '11px' }}>Guardian Contact</span>
              <span style={{ color: 'var(--text-main, #fff)', fontWeight: '500' }}>
                {student.guardianPhone || 'Not Provided'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Emergency & Living Preferences */}
        <div style={{
          background: 'var(--bg-surface, #121212)',
          border: '1px solid var(--border-dim, #262626)',
          borderRadius: '10px',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text-main, #fff)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🚨</span> Emergency & Living Preferences
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <span style={{ color: '#f87171', display: 'block', fontSize: '11px', fontWeight: '600' }}>Emergency Contact</span>
              <span style={{ color: 'var(--text-main, #fff)', fontWeight: '600' }}>
                {student.emergencyContactName ? `${student.emergencyContactName} (${student.emergencyContactRelation || 'Emergency'}) - ${student.emergencyContactPhone}` : '⚠️ Not Set'}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted, #888)', display: 'block', fontSize: '11px' }}>Mess Dietary Preference</span>
              <span style={{ color: '#34d399', fontWeight: '600' }}>{student.foodPreference || 'Not Specified'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted, #888)', display: 'block', fontSize: '11px' }}>Vehicle Number</span>
              <span style={{ color: 'var(--text-main, #fff)', fontWeight: '500' }}>{student.vehicleNumber || 'No Vehicle'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted, #888)', display: 'block', fontSize: '11px' }}>Medical Conditions / Allergies</span>
              <span style={{ color: 'var(--text-main, #fff)', fontWeight: '500' }}>{student.medicalConditions || 'None Recorded'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted, #888)', display: 'block', fontSize: '11px' }}>Permanent Address</span>
              <span style={{ color: 'var(--text-main, #fff)', fontWeight: '500' }}>
                {student.permanentAddress ? `${student.permanentAddress}, ${student.city || ''} ${student.state || ''} ${student.pincode || ''}` : 'Not Provided'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Room & Presence Status Section */}
      <div style={{
        marginTop: '24px',
        background: 'var(--bg-surface, #121212)',
        border: '1px solid var(--border-dim, #262626)',
        borderRadius: '10px',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text-main, #fff)' }}>
              🛏️ Room & Hostel Presence
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted, #888)' }}>
              Keep the warden informed about whether you are present at the hostel mess or currently at home.
            </p>
            {room && (
              <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '13px' }}>
                <span><strong>Room:</strong> Room {room.roomNumber}</span>
                <span><strong>Monthly Rent:</strong> ₹{room.rentAmount}</span>
                {room.students && room.students.length > 0 && (
                  <span><strong>Roommates:</strong> {room.students.map(s => s.name).join(', ')}</span>
                )}
              </div>
            )}
          </div>

          <button 
            onClick={async () => {
              const newStatus = student.presenceStatus === 'on_leave' ? 'in_hostel' : 'on_leave';
              setProfile({ ...profile, student: { ...student, presenceStatus: newStatus } });
              try {
                await axios.put(`${API_URL}/student/presence`, { presenceStatus: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
                showNotification(`Status updated: ${newStatus === 'on_leave' ? 'On Leave' : 'In Hostel'}`);
              } catch (error) {
                setProfile({ ...profile, student: { ...student, presenceStatus: student.presenceStatus } });
                showNotification('Failed to update status: ' + (error.response?.data?.message || error.message), 'error');
              }
            }}
            style={{
              padding: '10px 22px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
              background: student.presenceStatus === 'on_leave' ? 'var(--warning, #fbbf24)' : 'var(--success, #34d399)',
              color: '#000'
            }}
          >
            {student.presenceStatus === 'on_leave' ? '🔴 On Leave (At Home)' : '🟢 In Hostel'}
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
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
          zIndex: 2100,
          padding: '20px'
        }} onClick={() => setShowEditModal(false)}>
          <div 
            style={{
              background: 'var(--bg-surface, #141414)',
              border: '1px solid var(--border-strong, #333)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '850px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
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
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text-main, #fff)' }}>
                  ✏️ Edit Profile & KYC Details
                </h2>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted, #888)' }}>
                  All information is securely shared with the Hostel Warden and Owner.
                </p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', color: '#888', fontSize: '22px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Section: Academic Status */}
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    🎓 1. Academic & Study Status
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>Current Study Status *</label>
                      <select name="studyStatus" value={formData.studyStatus} onChange={handleInputChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }} required>
                        <option value="">Select Study Status</option>
                        <option value="Pursuing Degree">Pursuing Degree</option>
                        <option value="Internship / Job">Internship / Job</option>
                        <option value="Preparing for Competitive Exams">Preparing for Competitive Exams</option>
                        <option value="Distance / Online Learning">Distance / Online Learning</option>
                        <option value="Completed / Other">Completed / Other</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>College / Institute Name *</label>
                      <input type="text" name="collegeName" value={formData.collegeName} onChange={handleInputChange} placeholder="e.g. ABC Institute of Tech" style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }} required />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>Course / Program *</label>
                      <input type="text" name="course" value={formData.course} onChange={handleInputChange} placeholder="e.g. B.Tech, MBA, BCA" style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }} required />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>Branch / Stream</label>
                      <input type="text" name="branch" value={formData.branch} onChange={handleInputChange} placeholder="e.g. Computer Science" style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }} />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>Current Year / Semester</label>
                      <select name="currentYear" value={formData.currentYear} onChange={handleInputChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }}>
                        <option value="">Select Year</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                        <option value="Final Year">Final Year</option>
                        <option value="Intern">Intern</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>College Roll No / Enrollment No</label>
                      <input type="text" name="enrollmentNumber" value={formData.enrollmentNumber} onChange={handleInputChange} placeholder="e.g. 21BCE1042" style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }} />
                    </div>
                  </div>
                </div>

                {/* Section: Identity & Aadhaar KYC */}
                <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-dim, #262626)' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    🪪 2. Identity & Aadhaar KYC
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>Aadhaar Card Number (12 digits) *</label>
                      <input 
                        type="text" 
                        name="aadharNumber" 
                        maxLength={14} 
                        value={formData.aadharNumber} 
                        onChange={handleInputChange} 
                        placeholder="12-digit Aadhaar" 
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff', fontFamily: 'monospace' }} 
                        required 
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>Date of Birth</label>
                      <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }} />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>Gender</label>
                      <select name="gender" value={formData.gender} onChange={handleInputChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }}>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>Blood Group</label>
                      <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }}>
                        <option value="">Select Blood Group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>Student Phone (10 digits) *</label>
                      <input type="tel" name="phone" maxLength={10} value={formData.phone} onChange={handleInputChange} placeholder="10-digit number" style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }} required />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>Student Email</label>
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="student@example.com" style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }} />
                    </div>
                  </div>
                </div>

                {/* Section: Parents & Emergency Contacts */}
                <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-dim, #262626)' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    👨‍👩‍👧 3. Parents, Guardian & Emergency Contacts
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>Father's Full Name</label>
                      <input type="text" name="fatherName" value={formData.fatherName} onChange={handleInputChange} placeholder="Father's Name" style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }} />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>Father's Phone Number</label>
                      <input type="tel" name="fatherPhone" maxLength={10} value={formData.fatherPhone} onChange={handleInputChange} placeholder="10-digit number" style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }} />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>Mother's Full Name</label>
                      <input type="text" name="motherName" value={formData.motherName} onChange={handleInputChange} placeholder="Mother's Name" style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }} />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>Guardian Name (if applicable)</label>
                      <input type="text" name="guardianName" value={formData.guardianName} onChange={handleInputChange} placeholder="Guardian Name" style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }} />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>Guardian Phone *</label>
                      <input type="tel" name="guardianPhone" maxLength={10} value={formData.guardianPhone} onChange={handleInputChange} placeholder="10-digit number" style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }} required />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>Guardian Relation</label>
                      <input type="text" name="guardianRelation" value={formData.guardianRelation} onChange={handleInputChange} placeholder="e.g. Father, Uncle" style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }} />
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '12px', color: '#f87171', display: 'block', marginBottom: '4px', fontWeight: '600' }}>🚨 Emergency Contact Person & Phone *</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleInputChange} placeholder="Contact Name" style={{ padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }} required />
                        <input type="text" name="emergencyContactRelation" value={formData.emergencyContactRelation} onChange={handleInputChange} placeholder="Relation (e.g. Brother)" style={{ padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }} />
                        <input type="tel" name="emergencyContactPhone" maxLength={10} value={formData.emergencyContactPhone} onChange={handleInputChange} placeholder="10-digit Emergency Phone" style={{ padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }} required />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Address & Preferences */}
                <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-dim, #262626)' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    🏠 4. Address & Hostel Living Preferences
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>Permanent Address</label>
                      <input type="text" name="permanentAddress" value={formData.permanentAddress} onChange={handleInputChange} placeholder="House / Flat No, Street, Landmark" style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }} />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>City</label>
                      <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="City" style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }} />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>State</label>
                      <input type="text" name="state" value={formData.state} onChange={handleInputChange} placeholder="State" style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }} />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>PIN Code (6 digits)</label>
                      <input type="text" name="pincode" maxLength={6} value={formData.pincode} onChange={handleInputChange} placeholder="6-digit PIN" style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }} />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>Mess Dietary Preference</label>
                      <select name="foodPreference" value={formData.foodPreference} onChange={handleInputChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }}>
                        <option value="">Select Food Preference</option>
                        <option value="Veg">Pure Vegetarian</option>
                        <option value="Non-Veg">Non-Vegetarian</option>
                        <option value="Eggetarian">Eggetarian</option>
                        <option value="Jain">Jain Food</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>Hostel Parking Vehicle Reg No</label>
                      <input type="text" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleInputChange} placeholder="e.g. DL-01-AB-1234" style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }} />
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', display: 'block', marginBottom: '4px' }}>Medical Conditions / Allergies (Optional)</label>
                      <input type="text" name="medicalConditions" value={formData.medicalConditions} onChange={handleInputChange} placeholder="e.g. Asthma, Peanut Allergy, or None" style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-hover, #222)', border: '1px solid var(--border-dim, #333)', color: '#fff' }} />
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
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
                  onClick={() => setShowEditModal(false)}
                  disabled={saving}
                  style={{ padding: '8px 18px', borderRadius: '6px', background: 'transparent', border: '1px solid var(--border-dim, #333)', color: 'var(--text-main, #fff)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={saving}
                  style={{ padding: '8px 22px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                >
                  {saving ? 'Saving Details...' : '💾 Save Profile & KYC'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default StudentProfile;
