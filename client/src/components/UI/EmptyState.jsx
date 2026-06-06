import React from 'react';
import Button from './Button';
import './UI.css';

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => (
  <div className="empty-state fade-in">
    <div className="empty-state-icon">
      {Icon && <Icon size={48} />}
    </div>
    <h3 className="empty-state-title">{title}</h3>
    <p className="empty-state-desc">{description}</p>
    {actionLabel && onAction && (
      <Button variant="primary" onClick={onAction}>{actionLabel}</Button>
    )}
  </div>
);

export default EmptyState;
