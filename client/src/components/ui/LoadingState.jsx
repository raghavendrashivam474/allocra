import React from 'react';

export default function LoadingState({
  message = 'Loading...',
  className = ''
}) {
  return (
    <div className={`loading-state ${className}`.trim()} style={{ padding: '16px 0', color: 'var(--color-text-secondary, #6b7280)', fontSize: '14px' }}>
      <p>{message}</p>
    </div>
  );
}
