import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notifications';
import { activityLogService } from '../../services/activityLogs';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import Table from '../../components/UI/Table';
import { SkeletonDashboard } from '../../components/UI/SkeletonLoader';
import EmptyState from '../../components/UI/EmptyState';
import { Bell, CheckSquare, FileText, Package, Clock, CheckCircle } from 'lucide-react';
import './Notifications.css';

const StatCard = ({ title, value, icon }) => (
  <Card className="stat-card fade-in-up">
    <div className="stat-header">
      <span className="stat-title">{title}</span>
      <div className="stat-icon">{icon}</div>
    </div>
    <div className="stat-value">{value}</div>
  </Card>
);

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notifications');
  const [filterPeriod, setFilterPeriod] = useState('All');
  const [filterModule, setFilterModule] = useState('All');

  const loadData = async () => {
    try {
      const [allNotifs, allLogs] = await Promise.all([
        notificationService.getAll(),
        activityLogService.getAll()
      ]);

      // Role-based filtering
      let userNotifs = allNotifs;
      let userLogs = allLogs;

      if (user?.role === 'Procurement Officer') {
        userLogs = allLogs.filter(l => ['RFQs', 'Quotations', 'Purchase Orders', 'System'].includes(l.module));
      } else if (user?.role === 'Manager') {
        userLogs = allLogs.filter(l => ['Approvals', 'System'].includes(l.module));
      } else if (user?.role === 'Vendor') {
        userNotifs = allNotifs.filter(n => n.userId === user.id || n.userId === 'all');
        userLogs = allLogs.filter(l => l.userId === user.id);
      }

      setNotifications(userNotifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setLogs(userLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      await loadData();
      setIsLoading(false);
    };
    initData();
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await notificationService.update(id, { status: 'read', read: true });
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => notificationService.update(n.id, { status: 'read', read: true })));
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredLogs = logs.filter(log => {
    let periodMatch = true;
    if (filterPeriod === 'Today') {
      periodMatch = new Date(log.createdAt).toDateString() === new Date().toDateString();
    } else if (filterPeriod === 'Last 7 Days') {
      periodMatch = new Date(log.createdAt) > new Date(Date.now() - 7 * 86400000);
    } else if (filterPeriod === 'Last 30 Days') {
      periodMatch = new Date(log.createdAt) > new Date(Date.now() - 30 * 86400000);
    }

    let moduleMatch = filterModule === 'All' || log.module === filterModule;

    return periodMatch && moduleMatch;
  });

  const getIconForType = (type) => {
    switch (type) {
      case 'RFQ': return <FileText size={20} className="text-accent-primary" />;
      case 'Approval': return <CheckSquare size={20} className="text-warning" />;
      case 'Invoice': return <Package size={20} className="text-success" />;
      default: return <Bell size={20} className="text-muted" />;
    }
  };

  if (isLoading) return <div className="page-container"><SkeletonDashboard /></div>;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1>Activity Logs & Notifications</h1>
          <p className="text-muted">Stay updated on procurement events and audit trails.</p>
        </div>
      </div>

      <div className="stats-grid mb-4" style={{marginBottom: '1.5rem'}}>
        <StatCard title="Total Notifications" value={notifications.length} icon={<Bell size={20} />} />
        <StatCard title="Unread" value={notifications.filter(n => !n.read).length} icon={<Clock size={20} />} />
        <StatCard title="System Events" value={logs.length} icon={<CheckCircle size={20} />} />
      </div>

      <Card className="tabs-container" style={{padding: '0'}}>
        <div className="ui-tabs" style={{padding: '1rem 1.5rem 0', borderBottom: '1px solid var(--border-color)'}}>
          <button className={`ui-tab ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>Notifications</button>
          <button className={`ui-tab ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>Activity Timeline</button>
          <button className={`ui-tab ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>Audit Logs</button>
        </div>
        
        {activeTab === 'audit' && (
          <div className="filter-bar" style={{padding: '1.5rem 1.5rem 0'}}>
            <select className="ui-input" value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}>
              <option value="All">All Time</option>
              <option value="Today">Today</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
            </select>
            <select className="ui-input" value={filterModule} onChange={(e) => setFilterModule(e.target.value)}>
              <option value="All">All Modules</option>
              <option value="RFQs">RFQs</option>
              <option value="Vendors">Vendors</option>
              <option value="Quotations">Quotations</option>
              <option value="Approvals">Approvals</option>
              <option value="Purchase Orders">Purchase Orders</option>
              <option value="Invoices">Invoices</option>
              <option value="System">System</option>
            </select>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="notifications-panel" style={{padding: '1.5rem'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h3 style={{margin: 0}}>Recent Notifications</h3>
              <Button variant="secondary" size="sm" onClick={markAllAsRead}>Mark all as read</Button>
            </div>
            {notifications.length === 0 ? (
              <EmptyState icon={Bell} title="All Caught Up!" description="You have no new notifications." />
            ) : (
              <div className="notifications-list">
                {notifications.map(n => (
                  <div key={n.id} className={`notification-item ${n.read ? 'read' : 'unread'}`}>
                    <div className="notification-icon">
                      {getIconForType(n.type)}
                    </div>
                    <div className="notification-content">
                      <h4 style={{margin: '0 0 0.25rem', color: 'var(--text-primary)'}}>{n.title}</h4>
                      <p style={{margin: '0 0 0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem'}}>{n.description}</p>
                      <span className="notification-time" style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                    {!n.read && (
                      <button className="mark-read-btn" onClick={() => markAsRead(n.id)}>Mark as read</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="timeline-panel" style={{padding: '1.5rem'}}>
            {logs.length === 0 ? (
               <EmptyState icon={Clock} title="No Activity Yet" description="Activity will appear here once actions are taken." />
            ) : (
              <div className="timeline-vertical">
                {logs.slice(0, 20).map(log => (
                  <div key={log.id} className="timeline-vertical-item">
                    <div className={`timeline-dot ${log.status}`}></div>
                    <div className="timeline-vertical-content">
                      <div className="timeline-time" style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem'}}>{new Date(log.createdAt).toLocaleString()}</div>
                      <div className="timeline-action" style={{color: 'var(--text-primary)', marginBottom: '0.25rem'}}><strong>{log.action}</strong> by {log.role}</div>
                      <div className="timeline-details" style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>{log.details}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="audit-panel" style={{padding: '1.5rem'}}>
             {filteredLogs.length === 0 ? (
               <EmptyState icon={FileText} title="No Logs Found" description="Try adjusting your filters to find what you're looking for." />
             ) : (
               <Table 
                headers={['Log ID', 'User Role', 'Action', 'Module', 'Status', 'IP Address', 'Date & Time']}
                data={filteredLogs}
                renderRow={(log) => (
                  <tr key={log.id}>
                    <td className="text-muted">{log.id.slice(0, 8)}</td>
                    <td><Badge variant="secondary">{log.role}</Badge></td>
                    <td className="fw-500">{log.action}</td>
                    <td>{log.module}</td>
                    <td><Badge variant={log.status === 'success' ? 'success' : (log.status === 'warning' ? 'warning' : 'primary')}>{log.status}</Badge></td>
                    <td className="text-muted">{log.ipAddress}</td>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                )}
               />
             )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Notifications;
