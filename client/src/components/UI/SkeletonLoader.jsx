import React from 'react';
import './UI.css';

export const SkeletonCard = ({ count = 1 }) => (
  <>{Array.from({length: count}).map((_, i) => (
    <div key={i} className="skeleton-wrapper skeleton-card">
      <div className="skeleton-pulse" style={{width: '60%', height: '24px', marginBottom: '1rem', borderRadius: '4px'}}></div>
      <div className="skeleton-pulse" style={{width: '100%', height: '16px', marginBottom: '0.5rem', borderRadius: '4px'}}></div>
      <div className="skeleton-pulse" style={{width: '80%', height: '16px', borderRadius: '4px'}}></div>
    </div>
  ))}</>
);

export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="skeleton-wrapper skeleton-table">
    <div className="skeleton-table-header">
      {Array.from({length: cols}).map((_, i) => (
        <div key={i} className="skeleton-pulse" style={{height: '20px', borderRadius: '4px', flex: 1, margin: '0 0.5rem'}}></div>
      ))}
    </div>
    {Array.from({length: rows}).map((_, r) => (
      <div key={r} className="skeleton-table-row">
        {Array.from({length: cols}).map((_, c) => (
          <div key={c} style={{flex: 1, padding: '0 0.5rem'}}>
            <div className="skeleton-pulse" style={{height: '16px', borderRadius: '4px', width: `${Math.random() * 40 + 40}%`}}></div>
          </div>
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonDashboard = () => (
  <div className="skeleton-dashboard">
    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem'}}>
      <SkeletonCard count={4} />
    </div>
    <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem'}}>
      <SkeletonTable rows={4} cols={5} />
      <SkeletonCard count={1} />
    </div>
  </div>
);
