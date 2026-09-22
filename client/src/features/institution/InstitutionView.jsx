import React, { useState, useEffect } from 'react';
import { fetchInstitution, saveInstitution } from '../../api/institution';

export default function InstitutionView() {
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInstitution();
  }, []);

  async function loadInstitution() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInstitution();
      if (data.institution) {
        setInstitution(data.institution);
        setName(data.institution.name);
        setAcademicYear(data.institution.academicYear);
      } else {
        setInstitution(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !academicYear.trim()) {
      setError('Please provide both Institution Name and Academic Year');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await saveInstitution({ name, academicYear });
      setInstitution(result.institution);
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleStartCreate() {
    setName('');
    setAcademicYear('');
    setError(null);
    setIsEditing(true);
  }

  if (loading) {
    return (
      <div className="card">
        <h2>Institution Configuration</h2>
        <p className="loading-text">Loading institution details...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Institution Configuration</h2>

      {error && <div className="alert alert-error">{error}</div>}

      {!isEditing && institution && (
        <div className="institution-details">
          <div className="info-group">
            <span className="info-label">Institution Name</span>
            <span className="info-value">{institution.name}</span>
          </div>

          <div className="info-group">
            <span className="info-label">Academic Year</span>
            <span className="info-value">{institution.academicYear}</span>
          </div>

          <div className="badge-success">
            &#x2713; Institution configured
          </div>

          <div style={{ marginTop: '20px' }}>
            <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
              Edit Configuration
            </button>
          </div>
        </div>
      )}

      {!isEditing && !institution && (
        <div className="empty-state">
          <p>No institution configured yet.</p>
          <button className="btn btn-primary" onClick={handleStartCreate} style={{ marginTop: '16px' }}>
            Create Institution
          </button>
        </div>
      )}

      {isEditing && (
        <form onSubmit={handleSubmit} className="institution-form">
          <div className="form-group">
            <label htmlFor="name">Institution Name</label>
            <input
              id="name"
              type="text"
              placeholder="e.g. ABC Engineering College"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="academicYear">Academic Year</label>
            <input
              id="academicYear"
              type="text"
              placeholder="e.g. 2026–27"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Institution'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsEditing(false);
                setError(null);
                if (institution) {
                  setName(institution.name);
                  setAcademicYear(institution.academicYear);
                }
              }}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
