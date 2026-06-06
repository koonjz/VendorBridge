import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, CheckSquare, ShoppingCart, FileOutput, Activity, BarChart2 } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const menuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/vendors', name: 'Vendors', icon: <Users size={20} /> },
    { path: '/rfqs', name: 'RFQs', icon: <FileText size={20} /> },
    { path: '/quotations', name: 'Quotations', icon: <CheckSquare size={20} /> },
    { path: '/approvals', name: 'Approvals', icon: <CheckSquare size={20} /> },
    { path: '/purchase-orders', name: 'Purchase Orders', icon: <ShoppingCart size={20} /> },
    { path: '/invoices', name: 'Invoices', icon: <FileOutput size={20} /> },
    { path: '/logs', name: 'Activity Logs', icon: <Activity size={20} /> },
    { path: '/reports', name: 'Reports', icon: <BarChart2 size={20} /> },
  ];

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">VB</div>
          <h2>VendorBridge</h2>
        </div>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
