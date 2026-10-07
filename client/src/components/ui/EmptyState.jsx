import React from 'react';
import Button from './Button';

export default function EmptyState({
  message,
  actionLabel,
  onAction,
  actionDisabled = false,
  className = ''
}) {
  return (
    <div className={`empty-state ${className}`.trim()}>
      <p style={{ color: 'var(--color-text-secondary, #6b7280)', fontSize: '14px', marginBottom: actionLabel ? '12px' : 0 }}>
        {message}
      </p>
      {actionLabel && (
        <Button variant="primary" onClick={onAction} disabled={actionDisabled}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
