import React from 'react';

export default function PageHeader({
  title,
  description,
  action,
  children,
  className = ''
}) {
  return (
    <header className={`page-header ${className}`.trim()} style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-text-primary, #0f172a)', letterSpacing: '-0.3px', marginBottom: '4px' }}>
            {title}
          </h1>
          {description && (
            <p style={{ color: 'var(--color-text-secondary, #475569)', fontSize: '14px', lineHeight: '1.4' }}>
              {description}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </header>
  );
}
