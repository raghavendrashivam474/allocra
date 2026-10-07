import React from 'react';

export default function Card({
  title,
  description,
  children,
  className = '',
  style,
  ...props
}) {
  return (
    <div className={`card ${className}`.trim()} style={style} {...props}>
      {title && <h2>{title}</h2>}
      {description && <p style={{ marginBottom: '16px' }}>{description}</p>}
      {children}
    </div>
  );
}
