import { useState, useMemo } from 'react';
import { 
  Check, 
  Calendar, 
  Clock, 
  Layers, 
  FileText, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Users, 
  MapPin, 
  Info,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { api, showToast } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export function MultiStepBookingModal({ isOpen, onClose, lookups, onBookingSuccess }) {
  const { currentUser } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [createdBooking, setCreatedBooking] = useState(null);

  // Form State
  const [selectedResourceIds, setSelectedResourceIds] = useState([]);
  const [bookingDate, setBookingDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [purpose, setPurpose] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const resources = lookups?.resources || [];
  const types = lookups?.types || [];
  const locations = lookups?.locations || [];

  // Filter available resources
  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const matchSearch = !resourceFilter || 
        r.resource_name.toLowerCase().includes(resourceFilter.toLowerCase()) ||
        r.resource_code.toLowerCase().includes(resourceFilter.toLowerCase());
      const matchType = !typeFilter || String(r.type_id) === String(typeFilter);
      return matchSearch && matchType;
    });
  }, [resources, resourceFilter, typeFilter]);

  const selectedResourcesList = useMemo(() => {
    return resources.filter((r) => selectedResourceIds.includes(r.resource_id));
  }, [resources, selectedResourceIds]);

  // Calculate duration in hours
  const durationHours = useMemo(() => {
    if (!startTime || !endTime) return 0;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    return Math.max(0, (endMins - startMins) / 60);
  }, [startTime, endTime]);

  // Check max duration limit
  const maxAllowedDuration = useMemo(() => {
    if (!selectedResourcesList.length) return 24;
    return Math.min(...selectedResourcesList.map((r) => r.max_booking_hours || 4));
  }, [selectedResourcesList]);

  const toggleResource = (resourceId) => {
    setSelectedResourceIds((prev) => 
      prev.includes(resourceId) 
        ? prev.filter((id) => id !== resourceId) 
        : [...prev, resourceId]
    );
  };

  const handleNext = () => {
    setSubmitError('');
    if (step === 1) {
      if (selectedResourceIds.length === 0) {
        setSubmitError('Please select at least one resource for your reservation.');
        return;
      }
    } else if (step === 2) {
      if (!bookingDate || !startTime || !endTime) {
        setSubmitError('Please specify booking date, start time, and end time.');
        return;
      }
      if (startTime >= endTime) {
        setSubmitError('End time must be later than start time.');
        return;
      }
      if (durationHours > maxAllowedDuration) {
        setSubmitError(`Requested duration of ${durationHours}h exceeds maximum allowed of ${maxAllowedDuration}h for selected resource(s).`);
        return;
      }
    } else if (step === 3) {
      if (!purpose.trim()) {
        setSubmitError('Please enter the academic purpose of this reservation.');
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setSubmitError('');
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');

    const startDateTime = `${bookingDate} ${startTime}:00`;
    const endDateTime = `${bookingDate} ${endTime}:00`;

    try {
      const response = await api('/bookings', {
        method: 'POST',
        body: {
          purpose: purpose.trim(),
          resource_ids: selectedResourceIds,
          start: startDateTime,
          end: endDateTime
        }
      });

      const bookingInfo = {
        booking_id: response.booking_id,
        purpose,
        resources: selectedResourcesList.map((r) => r.resource_name).join(', '),
        start_time: startDateTime,
        end_time: endDateTime,
        status: 'PENDING'
      };

      setCreatedBooking(bookingInfo);
      setStep(5);
      showToast(`Reservation #${response.booking_id} submitted successfully!`, 'ok');
      onBookingSuccess?.();
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit booking. Check for slot conflicts.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedResourceIds([]);
    setPurpose('');
    setSubmitError('');
    setCreatedBooking(null);
    onClose();
  };

  const stepsList = [
    { num: 1, label: 'Resource' },
    { num: 2, label: 'Schedule' },
    { num: 3, label: 'Details' },
    { num: 4, label: 'Review' },
    { num: 5, label: 'Status' }
  ];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleReset} 
      title="Institutional Resource Reservation"
      maxWidth="720px"
    >
      {/* Stepper Progress */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        padding: '0 8px'
      }}>
        {stepsList.map((s, idx) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: idx < stepsList.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: step === s.num 
                  ? 'var(--brand-primary)' 
                  : step > s.num 
                    ? 'var(--brand-primary)' 
                    : 'var(--card-border)',
                color: step >= s.num ? '#FFFFFF' : 'var(--text-muted)',
                transition: 'var(--transition-smooth)'
              }}>
                {step > s.num ? <Check size={14} /> : s.num}
              </div>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: step === s.num ? 700 : 500,
                color: step === s.num ? 'var(--brand-primary)' : 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                {s.label}
              </span>
            </div>

            {idx < stepsList.length - 1 && (
              <div style={{
                flex: 1,
                height: '2px',
                backgroundColor: step > s.num ? 'var(--brand-primary)' : 'var(--card-border)',
                margin: '0 8px 16px',
                transition: 'var(--transition-smooth)'
              }} />
            )}
          </div>
        ))}
      </div>

      {submitError && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--error-bg)',
          color: 'var(--error-text)',
          border: '1px solid var(--error-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.82rem'
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{submitError}</span>
        </div>
      )}

      {/* STEP 1: Select Resource */}
      {step === 1 && (
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
            <input 
              type="text" 
              placeholder="Filter by name or code…" 
              className="form-input-academic"
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              style={{ flex: 1 }}
            />
            <select 
              className="form-select-academic"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ width: '180px' }}
            >
              <option value="">All Categories</option>
              {types.map((t) => (
                <option key={t.type_id} value={t.type_id}>{t.type_name}</option>
              ))}
            </select>
          </div>

          <div style={{
            maxHeight: '340px',
            overflowY: 'auto',
            border: '1px solid var(--card-border)',
            borderRadius: 'var(--r-md)',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {filteredResources.map((res) => {
              const isSelected = selectedResourceIds.includes(res.resource_id);
              const isAvailable = res.status === 'AVAILABLE';

              return (
                <div 
                  key={res.resource_id}
                  onClick={() => isAvailable && toggleResource(res.resource_id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--r-md)',
                    border: isSelected 
                      ? '1px solid var(--brand-primary)' 
                      : '1px solid var(--border-subtle)',
                    backgroundColor: isSelected 
                      ? 'var(--brand-light)' 
                      : isAvailable ? 'var(--card-bg)' : 'var(--bg-subtle)',
                    cursor: isAvailable ? 'pointer' : 'not-allowed',
                    opacity: isAvailable ? 1 : 0.6,
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      disabled={!isAvailable}
                      onChange={() => {}} 
                      style={{ cursor: isAvailable ? 'pointer' : 'not-allowed' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                          {res.resource_name}
                        </strong>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          [{res.resource_code}]
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '14px', marginTop: '4px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Layers size={13} style={{ color: 'var(--brand-primary)' }} /> {res.type_name || 'Standard'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={13} style={{ color: 'var(--brand-primary)' }} /> {res.location || 'Campus'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Users size={13} style={{ color: 'var(--brand-primary)' }} /> Cap: {res.capacity || 1}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <StatusBadge status={res.status} />
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                      Max {res.max_booking_hours || 4}h
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredResources.length === 0 && (
              <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No matching campus facilities found.
              </p>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: Schedule Selection */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group-academic">
            <label className="form-label-academic">
              <span>Reservation Date</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--slate-grey)' }}>Standard academic week</span>
            </label>
            <input 
              type="date" 
              className="form-input-academic"
              value={bookingDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setBookingDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group-academic">
              <label className="form-label-academic">Start Time</label>
              <input 
                type="time" 
                className="form-input-academic"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="form-group-academic">
              <label className="form-label-academic">End Time</label>
              <input 
                type="time" 
                className="form-input-academic"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--card-border)',
            borderRadius: 'var(--r-md)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Requested Session Duration:</span>
              <strong style={{ fontSize: '0.95rem', color: durationHours > maxAllowedDuration ? 'var(--error-text)' : 'var(--text-primary)' }} className="num-tabular">
                {durationHours} Hours (Max: {maxAllowedDuration} Hours)
              </strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              <Info size={14} style={{ color: 'var(--brand-primary)' }} />
              <span>All reservations are cross-checked for faculty lectures, lab maintenance, and existing approvals.</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Booking Details & Purpose */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group-academic">
            <label className="form-label-academic">
              <span>Academic Purpose & Subject</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Max 200 characters</span>
            </label>
            <textarea 
              rows={3}
              maxLength={200}
              placeholder="e.g. Distributed Database practical session for Batch B / IoT Capstone project testing"
              className="form-textarea-academic"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
            <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
              {purpose.length}/200
            </div>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--card-border)',
            fontSize: '0.8rem',
            lineHeight: 1.6
          }}>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Requester Information</p>
            <p style={{ color: 'var(--text-muted)' }}><strong>Name:</strong> {currentUser?.full_name}</p>
            <p style={{ color: 'var(--text-muted)' }}><strong>Role:</strong> {currentUser?.role}</p>
            <p style={{ color: 'var(--text-muted)' }}><strong>Department:</strong> {currentUser?.dept_name || 'Academic Faculty'}</p>
          </div>
        </div>
      )}

      {/* STEP 4: Review and Submit */}
      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            padding: '20px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--card-border)'
          }}>
            <h4 style={{ marginBottom: '14px', color: 'var(--text-primary)' }}>
              Reservation Summary
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>Date</span>
                <strong>{bookingDate}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>Time Window</span>
                <strong>{startTime} – {endTime} ({durationHours}h)</strong>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>Resources</span>
                <strong>{selectedResourcesList.map(r => `${r.resource_name} (${r.resource_code})`).join(', ')}</strong>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>Academic Purpose</span>
                <p style={{ marginTop: '2px', color: 'var(--text-primary)' }}>{purpose}</p>
              </div>
            </div>

            <div style={{
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid var(--card-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Initial Approval State:</span>
              <StatusBadge status="PENDING" />
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Success & Booking Receipt */}
      {step === 5 && createdBooking && (
        <div style={{ textAlign: 'center', padding: '16px 8px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--success-bg)',
            color: 'var(--success-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            border: '1px solid var(--success-border)'
          }}>
            <CheckCircle2 size={32} />
          </div>

          <h3 style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>
            Reservation Request Submitted
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Your request has been registered in the smart campus database under reference ID:
          </p>

          <div style={{
            display: 'inline-block',
            padding: '8px 24px',
            backgroundColor: 'var(--brand-light)',
            border: '1px solid var(--brand-border)',
            borderRadius: 'var(--r-md)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: '1.25rem',
            color: 'var(--brand-primary)',
            marginBottom: '20px'
          }}>
            BOOKING #{createdBooking.booking_id}
          </div>

          <div style={{
            textAlign: 'left',
            padding: '16px',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--card-border)',
            borderRadius: 'var(--r-md)',
            fontSize: '0.82rem',
            lineHeight: 1.6
          }}>
            <p><strong>Resources:</strong> {createdBooking.resources}</p>
            <p><strong>Timing:</strong> {createdBooking.start_time} to {createdBooking.end_time}</p>
            <p><strong>Purpose:</strong> {createdBooking.purpose}</p>
            <p><strong>Status:</strong> <StatusBadge status={createdBooking.status} /></p>
          </div>
        </div>
      )}

      {/* Modal Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '24px',
        paddingTop: '16px',
        borderTop: '1px solid var(--border-grey)'
      }}>
        {step < 5 ? (
          <>
            <button 
              className="btn-academic btn-secondary"
              onClick={step === 1 ? handleReset : handleBack}
            >
              <ChevronLeft size={16} />
              <span>{step === 1 ? 'Cancel' : 'Back'}</span>
            </button>

            {step < 4 ? (
              <button 
                className="btn-academic btn-primary"
                onClick={handleNext}
              >
                <span>Continue</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button 
                className="btn-academic btn-gold"
                disabled={isSubmitting}
                onClick={handleSubmit}
              >
                <span>{isSubmitting ? 'Verifying Availability…' : 'Confirm & Request Booking'}</span>
              </button>
            )}
          </>
        ) : (
          <button 
            className="btn-academic btn-primary"
            style={{ width: '100%' }}
            onClick={handleReset}
          >
            <span>Return to Dashboard</span>
          </button>
        )}
      </div>
    </Modal>
  );
}
