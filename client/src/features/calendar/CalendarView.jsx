import React, { useState, useEffect } from 'react';
import { fetchInstitution } from '../../api/institution';
import { fetchCalendar, saveCalendar } from '../../api/calendar';
import { Card, Alert, Button, LoadingState } from '../../components/ui';

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
    setSuccessMessage(null);
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
      <Card title="Calendar Configuration">
        <LoadingState message="Loading calendar details..." />
      </Card>
    );
  }

  if (!institution) {
    return (
      <Card title="Calendar Configuration">
        <Alert type="error">
          {error || 'Please configure your Institution first before accessing Calendar Configuration.'}
        </Alert>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '650px' }}>
      {/* Active Institution Context Header */}
      <Card title="Active Institution" style={{ maxWidth: '100%' }}>
        <div className="info-group">
          <span className="info-label">Name</span>
          <span className="info-value">{institution.name}</span>
        </div>
        <div className="info-group" style={{ marginBottom: 0 }}>
          <span className="info-label">Academic Year</span>
          <span className="info-value">{institution.academicYear}</span>
        </div>
      </Card>

      {/* Working Days Configurator card */}
      <Card title="Working Days" description="Define which days of the week are normally available for academic scheduling." style={{ maxWidth: '100%' }}>
        {error && <Alert type="error">{error}</Alert>}
        {successMessage && <Alert type="success">{successMessage}</Alert>}

        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {DAYS_OF_WEEK.map(day => {
              const isChecked = selectedDays.includes(day.value);
              return (
                <label
                  key={day.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: isChecked ? 'var(--color-primary-light, #eef2ff)' : 'transparent',
                    border: `1px solid ${isChecked ? 'var(--color-primary-border, #c7d2fe)' : 'var(--color-border, #e2e8f0)'}`,
                    borderRadius: 'var(--radius-md, 8px)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: isChecked ? 600 : 400,
                    color: isChecked ? 'var(--color-primary, #4338ca)' : 'var(--color-text-primary, #0f172a)',
                    transition: 'all var(--transition-fast, 150ms ease-in-out)'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleCheckboxChange(day.value)}
                    disabled={submitting}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--color-primary, #4338ca)' }}
                  />
                  {day.label}
                </label>
              );
            })}
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            style={{ minWidth: '130px' }}
          >
            {submitting ? 'Saving...' : 'Save Calendar'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
