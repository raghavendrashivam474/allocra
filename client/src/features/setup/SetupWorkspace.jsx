import React, { useState, useEffect } from 'react';
import { fetchReadiness } from '../../api/setup';

export default function SetupWorkspace({ onNavigate }) {
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReadiness = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReadiness();
      setReadiness(data);
    } catch (err) {
      setError(err.message || 'Failed to load configuration readiness');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReadiness();
  }, []);

  const navMap = {
    'institution': 'institution',
    'academic-structure': 'academic-structure',
    'terms-groups': 'terms-and-groups',
    'calendar': 'calendar',
    'time-model': 'time-model'
  };

  if (loading) {
    return (
      <div className="card">
        <p>Loading setup workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2>Setup Workspace</h2>
        <div className="alert alert-error" style={{ margin: '16px 0' }}>
          {error}
        </div>
        <button className="btn btn-primary" onClick={loadReadiness}>
          Retry
        </button>
      </div>
    );
  }

  const checks = readiness?.checks || [];
  const isReady = readiness?.ready === true;
  const incompleteChecks = checks.filter(c => c.status !== 'complete');

  return (
    <div className="setup-workspace">
      <div className="card setup-header-card">
        <h2>Setup Workspace & Configuration Readiness</h2>
        <p>
          Overview of Phase 1 foundational setup. Ensure all sections are configured before proceeding to Phase 2.
        </p>

        <div className={`readiness-banner ${isReady ? 'banner-ready' : 'banner-incomplete'}`}>
          <div className="banner-status-icon">
            {isReady ? '✓' : '⚠'}
          </div>
          <div className="banner-content">
            <h3>{isReady ? 'Configuration Ready' : 'Configuration Incomplete'}</h3>
            <p>
              {isReady
                ? 'Your institution has the foundational academic, calendar, and time configuration required to continue to Phase 2.'
                : `${incompleteChecks.length} item(s) still need attention before continuing to Phase 2:`}
            </p>
            {!isReady && (
              <ul className="incomplete-list">
                {incompleteChecks.map(c => (
                  <li key={c.key}>
                    <strong>{c.label}:</strong> {c.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="setup-grid">
        {checks.map(check => {
          const targetTab = navMap[check.key];
          const isComplete = check.status === 'complete';

          return (
            <div key={check.key} className={`card setup-item-card ${isComplete ? 'item-complete' : 'item-incomplete'}`}>
              <div className="item-header">
                <span className={`status-badge ${isComplete ? 'badge-complete' : 'badge-incomplete'}`}>
                  {isComplete ? '✓ Configured' : '✕ Incomplete'}
                </span>
                <h3>{check.label}</h3>
              </div>
              <p className="item-message">{check.message}</p>
              <div className="item-actions">
                <button
                  className={`btn ${isComplete ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => onNavigate && targetTab && onNavigate(targetTab)}
                >
                  {isComplete ? 'Manage' : 'Configure'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
