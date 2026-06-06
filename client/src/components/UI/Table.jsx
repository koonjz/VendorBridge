import React from 'react';
import './Table.css';

const Table = ({ headers, data, renderRow, className = '' }) => {
  return (
    <div className="table-responsive">
      <div className={`table-container ${className}`}>
        <table className="glass-table">
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((item, index) => renderRow(item, index))
            ) : (
              <tr>
                <td colSpan={headers.length} className="table-empty">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
