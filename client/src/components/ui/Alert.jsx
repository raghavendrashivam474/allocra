import React from 'react';

export default function Alert({
  children,
  type = 'error',
  className = '',
  style,
  ...props
}) {
  const typeClass = type === 'success'
    ? 'alert-success'
    : type === 'warning'
    ? 'alert-warning'
    : type === 'info'
    ? 'alert-info'
    : 'alert-error';

  return (
    <div className={`alert ${typeClass} ${className}`.trim()} style={style} role="alert" {...props}>
      {children}
    </div>
  );
}
