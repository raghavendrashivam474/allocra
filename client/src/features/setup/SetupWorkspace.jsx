import React, { useState, useEffect } from 'react';
import { fetchReadiness } from '../../api/setup';
import { Card, Alert, Button, LoadingState } from '../../components/ui';

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
      <Card>
        <LoadingState message="Loading setup workspace..." />
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Setup Workspace">
        <Alert type="error" style={{ margin: '16px 0' }}>
          {error}
        </Alert>
        <Button variant="primary" onClick={loadReadiness}>
          Retry
        </Button>
      </Card>
    );
  }

  const checks = readiness?.checks || [];
  const isReady = readiness?.ready === true;
  const completedCount = checks.filter(c => c.status === 'complete').length;
  const totalCount = checks.length;
  const incompleteChecks = checks.filter(c => c.status !== 'complete');

  return (
    <div className="setup-workspace">
      <div className="card setup-header-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2>Setup Workspace & Configuration Readiness</h2>
            <p>
              Overview of Phase 1 foundational setup. Ensure all sections are configured before proceeding to Phase 2.
            </p>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface-subtle)', padding: '4px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)' }}>
            {completedCount} / {totalCount} Configured
          </span>
        </div>

        <div className={`readiness-banner ${isReady ? 'banner-ready' : 'banner-incomplete'}`}>
          <div className="banner-status-icon" aria-hidden="true">
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
                <Button
                  variant={isComplete ? 'secondary' : 'primary'}
                  onClick={() => onNavigate && targetTab && onNavigate(targetTab)}
                >
                  {isComplete ? 'Manage' : 'Configure'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
