import React, { useState, useEffect, useCallback } from 'react';
import { fetchValidation } from '../../api/validation';
import { Card, Alert, Button, LoadingState } from '../../components/ui';

const STATUS_LABELS = {
  ready: 'Configuration Ready',
  needs_attention: 'Needs Attention',
  no_activities: 'No Activities Configured',
  not_configured: 'Institution Not Configured'
};

const SEVERITY_ICONS = {
  error: '?',
  warning: '?',
  info: '?'
};

const SEVERITY_LABELS = {
  error: 'Error',
  warning: 'Warning',
  info: 'Info'
};

export default function ValidationWorkspace({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadValidation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchValidation();
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load validation results');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadValidation();
  }, [loadValidation]);

  if (loading) {
    return (
      <Card>
        <LoadingState message="Evaluating configuration readiness..." />
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Configuration Validation">
        <Alert type="error" style={{ margin: '16px 0' }}>
          {error}
        </Alert>
        <Button variant="primary" onClick={loadValidation}>
          Retry
        </Button>
      </Card>
    );
  }

  const { summary, findings } = data || {};
  const status = summary?.status || 'not_configured';
  const statusLabel = STATUS_LABELS[status] || status;
  const isReady = status === 'ready';

  return (
    <div className="validation-workspace">
      {/* -- Summary Banner -- */}
      <div className="card setup-header-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2>Configuration Validation</h2>
            <p>
              Evaluates Activity and resource eligibility for allocation readiness.
            </p>
          </div>
          <Button variant="secondary" onClick={loadValidation}>
            Re-check
          </Button>
        </div>

        <div className={`readiness-banner ${isReady ? 'banner-ready' : 'banner-incomplete'}`}>
          <div className="banner-status-icon" aria-hidden="true">
            {isReady ? '?' : '?'}
          </div>
          <div className="banner-content">
            <h3>{statusLabel}</h3>
            {status === 'not_configured' && (
              <p>Configure your institution first via the Setup Workspace.</p>
            )}
            {status === 'no_activities' && (
              <p>No activities have been created yet. Add activities to evaluate their readiness.</p>
            )}
            {status === 'ready' && (
              <p>
                All {summary.activityCount} activit{summary.activityCount === 1 ? 'y' : 'ies'} satisfy the defined readiness rules.
              </p>
            )}
            {status === 'needs_attention' && (
              <p>
                {summary.activityCount - summary.validActivityCount} of {summary.activityCount} activit{summary.activityCount === 1 ? 'y' : 'ies'} need configuration.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* -- Counts Grid -- */}
      {status !== 'not_configured' && status !== 'no_activities' && (
        <div className="setup-grid" style={{ marginTop: '16px' }}>
          <div className="card setup-item-card item-complete">
            <h3>Activities Evaluated</h3>
            <p style={{ fontSize: '24px', fontWeight: 700 }}>{summary.activityCount}</p>
          </div>
          <div className={`card setup-item-card ${summary.validActivityCount === summary.activityCount ? 'item-complete' : 'item-incomplete'}`}>
            <h3>Valid Activities</h3>
            <p style={{ fontSize: '24px', fontWeight: 700 }}>{summary.validActivityCount}</p>
          </div>
          <div className={`card setup-item-card ${summary.errorCount === 0 ? 'item-complete' : 'item-incomplete'}`}>
            <h3>Errors</h3>
            <p style={{ fontSize: '24px', fontWeight: 700 }}>{summary.errorCount}</p>
          </div>
          <div className={`card setup-item-card ${summary.warningCount === 0 ? 'item-complete' : 'item-incomplete'}`}>
            <h3>Warnings</h3>
            <p style={{ fontSize: '24px', fontWeight: 700 }}>{summary.warningCount}</p>
          </div>
        </div>
      )}

      {/* -- Findings List -- */}
      {findings && findings.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3>Findings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {findings.map((f, idx) => (
              <div
                key={`${f.code}-${f.entityId}-${idx}`}
                className={`card setup-item-card finding-${f.severity}`}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}
              >
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      className="status-badge badge-incomplete"
                      aria-label={SEVERITY_LABELS[f.severity]}
                    >
                      {SEVERITY_ICONS[f.severity]} {SEVERITY_LABELS[f.severity]}
                    </span>
                    <strong>{f.entityName}</strong>
                  </div>
                  <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>{f.message}</p>
                </div>
                {f.action?.type === 'configure_activity_resources' && (
                  <Button
                    variant="primary"
                    onClick={() => onNavigate && onNavigate('activities')}
                  >
                    Configure Resources
                  </Button>
                )}
                {f.action?.type === 'configure_activity' && (
                  <Button
                    variant="primary"
                    onClick={() => onNavigate && onNavigate('activities')}
                  >
                    Open Activities
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -- No Issues State -- */}
      {isReady && findings && findings.length === 0 && (
        <Card title="All Clear" style={{ marginTop: '24px' }}>
          <p>No configuration issues detected. Your activities are ready for the next phase.</p>
        </Card>
      )}

      {/* -- Navigation Links -- */}
      {status !== 'not_configured' && (
        <div style={{ marginTop: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={() => onNavigate && onNavigate('activities')}>
            Manage Activities
          </Button>
          <Button variant="secondary" onClick={() => onNavigate && onNavigate('faculty')}>
            Manage Faculty
          </Button>
          <Button variant="secondary" onClick={() => onNavigate && onNavigate('rooms')}>
            Manage Rooms
          </Button>
        </div>
      )}
      {status === 'not_configured' && (
        <div style={{ marginTop: '24px' }}>
          <Button variant="primary" onClick={() => onNavigate && onNavigate('setup')}>
            Go to Setup Workspace
          </Button>
        </div>
      )}
    </div>
  );
}
