import React, { useState, useEffect } from 'react';
import { fetchInstitution } from '../../api/institution';
import { fetchCalendar, saveCalendar } from '../../api/calendar';

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' }
];

export default function CalendarView() {
  const [institution, setInstitution] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    loadCalendarData();
  }, []);

  async function loadCalendarData() {
    setLoading(true);
    setError(null);
    try {
      const instRes = await fetchInstitution();
      setInstitution(instRes.institution);

      if (instRes.institution) {
        const calRes = await fetchCalendar();
        if (calRes.calendar && calRes.calendar.workingDays) {
          setSelectedDays(calRes.calendar.workingDays);
        } else {
          // Default selection if unconfigured (standard Mon-Fri)
          setSelectedDays(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCheckboxChange(day) {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day];
      }
    });
    setSuccessMessage(null); // Clear success when user makes changes
  }

  async function handleSave(e) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (selectedDays.length === 0) {
      setError('Please select at least one working day');
      return;
    }

    setSubmitting(true);
    try {
      await saveCalendar({ workingDays: selectedDays });
      setSuccessMessage('Calendar saved successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="card">
        <h2>Calendar Configuration</h2>
        <p>Loading calendar details...</p>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="card">
        <h2>Calendar Configuration</h2>
        <div className="alert alert-error">
          {error || 'Please configure your Institution first before accessing Calendar Configuration.'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '650px' }}>
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

      {/* Working Days Configurator card */}
      <div className="card" style={{ maxWidth: '100%' }}>
        <h2>Working Days</h2>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '18px' }}>
          Define which days of the week are normally available for academic scheduling.
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {successMessage && <div className="alert alert-success" style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #10b981', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>{successMessage}</div>}

        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {DAYS_OF_WEEK.map(day => {
              const isChecked = selectedDays.includes(day.value);
              return (
                <label
                  key={day.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    backgroundColor: isChecked ? '#f3f4f6' : 'transparent',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: isChecked ? 600 : 400,
                    color: isChecked ? '#111827' : '#374151',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleCheckboxChange(day.value)}
                    disabled={submitting}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  {day.label}
                </label>
              );
            })}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ minWidth: '120px' }}
          >
            {submitting ? 'Saving...' : 'Save Calendar'}
          </button>
        </form>
      </div>
    </div>
  );
}
