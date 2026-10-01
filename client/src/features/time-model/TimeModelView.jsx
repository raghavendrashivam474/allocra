import React, { useState, useEffect } from 'react';
import { fetchInstitution } from '../../api/institution';
import { fetchTimeModel, saveTimeModel } from '../../api/timeModel';

export default function TimeModelView() {
  const [institution, setInstitution] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [breaks, setBreaks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const instRes = await fetchInstitution();
      setInstitution(instRes.institution);

      if (instRes.institution) {
        const tmRes = await fetchTimeModel();
        if (tmRes.timeModel) {
          setPeriods(tmRes.timeModel.periods || []);
          setBreaks(tmRes.timeModel.breaks || []);
        } else {
          // Provide initial default template for convenience
          setPeriods([
            { name: 'Period 1', startTime: '09:00', endTime: '09:50' },
            { name: 'Period 2', startTime: '09:50', endTime: '10:40' },
            { name: 'Period 3', startTime: '11:00', endTime: '11:50' }
          ]);
          setBreaks([
            { name: 'Break', startTime: '10:40', endTime: '11:00' }
          ]);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handlePeriodChange(index, field, value) {
    setPeriods(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setSuccessMessage(null);
  }

  function addPeriod() {
    setPeriods(prev => [
      ...prev,
      { name: `Period ${prev.length + 1}`, startTime: '', endTime: '' }
    ]);
    setSuccessMessage(null);
  }

  function removePeriod(index) {
    setPeriods(prev => prev.filter((_, i) => i !== index));
    setSuccessMessage(null);
  }

  function handleBreakChange(index, field, value) {
    setBreaks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setSuccessMessage(null);
  }

  function addBreak() {
    setBreaks(prev => [
      ...prev,
      { name: 'Break', startTime: '', endTime: '' }
    ]);
    setSuccessMessage(null);
  }

  function removeBreak(index) {
    setBreaks(prev => prev.filter((_, i) => i !== index));
    setSuccessMessage(null);
  }

  function validateLocal() {
    if (periods.length === 0) {
      return 'At least one period is required';
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    for (const p of periods) {
      if (!p.name.trim()) return 'All periods must have a name';
      if (!timeRegex.test(p.startTime)) return `Invalid start time "${p.startTime}" on ${p.name}. Use HH:mm`;
      if (!timeRegex.test(p.endTime)) return `Invalid end time "${p.endTime}" on ${p.name}. Use HH:mm`;
      if (p.startTime >= p.endTime) return `Start time must be strictly before end time for "${p.name}"`;
    }

    for (const b of breaks) {
      if (!b.name.trim()) return 'All breaks must have a name';
      if (!timeRegex.test(b.startTime)) return `Invalid start time "${b.startTime}" on ${b.name}. Use HH:mm`;
      if (!timeRegex.test(b.endTime)) return `Invalid end time "${b.endTime}" on ${b.name}. Use HH:mm`;
      if (b.startTime >= b.endTime) return `Start time must be strictly before end time for "${b.name}"`;
    }

    // Overlap validation
    const all = [
      ...periods.map(p => ({ ...p, type: 'Period' })),
      ...breaks.map(b => ({ ...b, type: 'Break' }))
    ].sort((a, b) => a.startTime.localeCompare(b.startTime));

    for (let i = 1; i < all.length; i++) {
      if (all[i].startTime < all[i - 1].endTime) {
        return `${all[i].type} "${all[i].name}" (${all[i].startTime} - ${all[i].endTime}) overlaps with ${all[i - 1].type} "${all[i - 1].name}" (${all[i - 1].startTime} - ${all[i - 1].endTime})`;
      }
    }

    return null;
  }

  async function handleSave(e) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const validationError = validateLocal();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await saveTimeModel({ periods, breaks });
      setSuccessMessage('Time model saved successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="card">
        <h2>Time Model Configuration</h2>
        <p>Loading time model details...</p>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="card">
        <h2>Time Model Configuration</h2>
        <div className="alert alert-error">
          {error || 'Please configure your Institution first before accessing Time Model Configuration.'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      {/* Active Institution Context Header */}
      <div className="card" style={{ maxWidth: '100%' }}>
        <h2>Active Institution</h2>
        <div className="info-group">
          <span className="info-label">Name</span>
          <span className="info-value">{institution.name}</span>
        </div>
        <div className="info-group" style={{ marginBottom: 0 }}>
          <span className="info-label">Academic Year</span>
          <span className="info-value">{institution.academicYear}</span>
        </div>
      </div>

      {/* Time Model Form */}
      <div className="card" style={{ maxWidth: '100%' }}>
        <h2>Time Model</h2>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '18px' }}>
          Define the daily schedule structure (periods and breaks). Times must be in 24-hour HH:mm format.
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {successMessage && (
          <div
            className="alert alert-success"
            style={{
              backgroundColor: '#ecfdf5',
              color: '#047857',
              border: '1px solid #10b981',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '14px'
            }}
          >
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* Periods Section */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Periods</h3>
              <button
                type="button"
                className="btn"
                onClick={addPeriod}
                disabled={submitting}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                + Add Period
              </button>
            </div>

            {periods.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '14px', fontStyle: 'italic' }}>No periods configured.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {periods.map((period, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'center',
                      background: '#f9fafb',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Period Name"
                      aria-label={`Period ${idx + 1} Name`}
                      value={period.name}
                      onChange={e => handlePeriodChange(idx, 'name', e.target.value)}
                      disabled={submitting}
                      style={{ flex: '2', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                    <input
                      type="text"
                      placeholder="09:00"
                      aria-label={`Period ${idx + 1} Start Time`}
                      value={period.startTime}
                      onChange={e => handlePeriodChange(idx, 'startTime', e.target.value)}
                      disabled={submitting}
                      style={{ flex: '1', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', maxWidth: '100px' }}
                    />
                    <span>—</span>
                    <input
                      type="text"
                      placeholder="09:50"
                      aria-label={`Period ${idx + 1} End Time`}
                      value={period.endTime}
                      onChange={e => handlePeriodChange(idx, 'endTime', e.target.value)}
                      disabled={submitting}
                      style={{ flex: '1', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', maxWidth: '100px' }}
                    />
                    <button
                      type="button"
                      onClick={() => removePeriod(idx)}
                      disabled={submitting}
                      aria-label={`Remove Period ${idx + 1}`}
                      style={{
                        padding: '6px 10px',
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: '1px solid #fca5a5',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Breaks Section */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Breaks</h3>
              <button
                type="button"
                className="btn"
                onClick={addBreak}
                disabled={submitting}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                + Add Break
              </button>
            </div>

            {breaks.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '14px', fontStyle: 'italic' }}>No breaks configured.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {breaks.map((brk, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'center',
                      background: '#f9fafb',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Break Name"
                      aria-label={`Break ${idx + 1} Name`}
                      value={brk.name}
                      onChange={e => handleBreakChange(idx, 'name', e.target.value)}
                      disabled={submitting}
                      style={{ flex: '2', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                    <input
                      type="text"
                      placeholder="10:40"
                      aria-label={`Break ${idx + 1} Start Time`}
                      value={brk.startTime}
                      onChange={e => handleBreakChange(idx, 'startTime', e.target.value)}
                      disabled={submitting}
                      style={{ flex: '1', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', maxWidth: '100px' }}
                    />
                    <span>—</span>
                    <input
                      type="text"
                      placeholder="11:00"
                      aria-label={`Break ${idx + 1} End Time`}
                      value={brk.endTime}
                      onChange={e => handleBreakChange(idx, 'endTime', e.target.value)}
                      disabled={submitting}
                      style={{ flex: '1', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', maxWidth: '100px' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeBreak(idx)}
                      disabled={submitting}
                      aria-label={`Remove Break ${idx + 1}`}
                      style={{
                        padding: '6px 10px',
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: '1px solid #fca5a5',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ minWidth: '140px' }}
          >
            {submitting ? 'Saving...' : 'Save Time Model'}
          </button>
        </form>
      </div>
    </div>
  );
}
