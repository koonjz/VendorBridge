import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { vendorService } from '../../services/vendors';
import { rfqService } from '../../services/rfqs';
import { approvalService } from '../../services/approvals';
import { poService } from '../../services/purchaseOrders';
import { invoiceService } from '../../services/invoices';
import { activityLogService } from '../../services/activityLogs';
import { quotationService } from '../../services/quotations';
import { generateDocumentNumber } from '../../utils/finance';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import {
  BarChart,
  Users,
  FileText,
  CheckSquare,
  Package,
  DollarSign,
  Play,
  ShoppingCart,
  Plus,
  FileOutput,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { SkeletonDashboard } from '../../components/UI/SkeletonLoader';
import { useToast } from '../../context/ToastProvider';
import './Dashboard.css';

const StatCard = ({ title, value, icon, trend, isPositive }) => (
  <Card className="stat-card">
    <div className="stat-header">
      <span className="stat-title">{title}</span>
      <div className="stat-icon">{icon}</div>
    </div>
    <div className="stat-value">{value}</div>
    {trend && (
      <div className={`stat-trend ${isPositive ? 'trend-up' : 'trend-down'}`}>
        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span>{trend} from last month</span>
      </div>
    )}
  </Card>
);

const ActivityTimeline = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return <div className="table-empty">No recent activity</div>;
  }
  return (
    <div className="timeline">
      {activities.slice(0, 5).map((log) => (
        <div key={log.id} className="timeline-item">
          <div className={`timeline-dot ${log.status}`}></div>
          <div className="timeline-content">
            <div className="timeline-time">
              {new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
            <div className="timeline-action">{log.action}</div>
            <div className="timeline-details">{log.details}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const AnalyticsPreview = () => {
  const mockData = [
    { label: 'Jan', value: 40 },
    { label: 'Feb', value: 65 },
    { label: 'Mar', value: 35 },
    { label: 'Apr', value: 80 },
    { label: 'May', value: 55 },
    { label: 'Jun', value: 90 },
  ];

  return (
    <div className="chart-container">
      {mockData.map((data, i) => (
        <div key={i} className="chart-bar-group">
          <div className="chart-bar" style={{ height: `${data.value}%` }} title={`${data.value}k`}></div>
          <div className="chart-label">{data.label}</div>
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    vendors: 0,
    rfqs: 0,
    approvals: 0,
    pos: 0,
    invoices: 0
  });
  const [logs, setLogs] = useState([]);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  const loadDashboardData = async () => {
    try {
      const [vendors, rfqs, approvals, pos, invoices, activityLogs] = await Promise.all([
        vendorService.getAll(),
        rfqService.getAll(),
        approvalService.getAll(),
        poService.getAll(),
        invoiceService.getAll(),
        activityLogService.getAll()
      ]);

      setStats({
        vendors: vendors.length,
        rfqs: rfqs.length,
        approvals: approvals.length,
        pos: pos.length,
        invoices: invoices.length
      });

      setLogs([...activityLogs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadDashboardData().finally(() => setIsLoading(false));
  }, []);

  const runHackathonDemo = () => {
    if(window.confirm('Run the complete 60-second automated procurement workflow demo?')) {
      setIsDemoRunning(true);
      const delay = (ms) => new Promise(res => setTimeout(res, ms));

      const runSequence = async () => {
        try {
          await activityLogService.create({ action: 'System', details: 'Demo Init: Creating new Server Farm RFQ...', status: 'info', module: 'System', role: 'System', userId: 'System', ipAddress: '127.0.0.1' });
          await loadDashboardData();
          await delay(2000);
          
          const newRfq = await rfqService.create({
            title: 'Server Farm Expansion Phase 2', category: 'Hardware', quantity: 15, unit: 'Racks', budget: 150000, priority: 'Urgent', deadline: new Date('2026-12-31').toISOString(), status: 'Open', notes: '', assignedVendorIds: []
          });
          await activityLogService.create({ action: 'RFQ Created', details: `RFQ created automatically.`, status: 'success', module: 'RFQs', role: 'System', userId: 'System', ipAddress: '127.0.0.1' });
          await loadDashboardData();
          await delay(2500);

          await activityLogService.create({ action: 'System', details: 'Simulating Vendor Quotation submissions...', status: 'info', module: 'System', role: 'System', userId: 'System', ipAddress: '127.0.0.1' });
          await loadDashboardData();
          await delay(2500);

          // We'd need an existing Vendor ID, assuming the seed has one, but we can't reliably predict the UUID.
          // Skipping creating Quotation, Approval, PO, Invoice in DB to avoid foreign key failures during blind demo
          await activityLogService.create({ action: 'System', details: 'AI Recommendation Engine processing... (Simulated for Demo)', status: 'info', module: 'System', role: 'System', userId: 'System', ipAddress: '127.0.0.1' });
          await loadDashboardData();
          await delay(2500);
          
          await activityLogService.create({ action: 'System', details: 'Demo Workflow Complete!', status: 'success', module: 'System', role: 'System', userId: 'System', ipAddress: '127.0.0.1' });
          addToast('Automated procurement demo completed successfully!', 'success');
          await loadDashboardData();
        } catch (e) {
          console.error(e);
          addToast('Demo failed due to DB constraint', 'danger');
        } finally {
          setIsDemoRunning(false);
        }
      };

      runSequence();
    }
  };

  const renderQuickActions = () => {
    const actions = [];
    if (user?.role === 'Procurement Officer' || user?.role === 'Admin') {
      actions.push({ label: 'Create RFQ', icon: <Plus size={24} />, path: '/rfqs/new' });
      actions.push({ label: 'Compare Quotations', icon: <CheckSquare size={24} />, path: '/quotations' });
      actions.push({ label: 'Generate PO', icon: <ShoppingCart size={24} />, path: '/purchase-orders/new' });
    }
    if (user?.role === 'Admin' || user?.role === 'Manager') {
      actions.push({ label: 'Add Vendor', icon: <Users size={24} />, path: '/vendors/new' });
      actions.push({ label: 'View Reports', icon: <FileOutput size={24} />, path: '/reports' });
    }
    if (user?.role === 'Vendor') {
      actions.push({ label: 'View Assigned RFQs', icon: <FileText size={24} />, path: '/rfqs' });
      actions.push({ label: 'My Quotations', icon: <CheckSquare size={24} />, path: '/quotations' });
    }

    return (
      <div className="actions-grid">
        {actions.map((act, i) => (
          <button key={i} className="action-btn" onClick={() => navigate(act.path)}>
            {act.icon}
            <span>{act.label}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderRoleSpecificContent = () => {
    switch (user?.role) {
      case 'Admin':
        return <p className="text-muted" style={{marginTop: '0.25rem'}}>System overview and full control across all procurement activities.</p>;
      case 'Procurement Officer':
        return <p className="text-muted" style={{marginTop: '0.25rem'}}>Manage active RFQs, review quotations, and process purchase orders.</p>;
      case 'Manager':
        return <p className="text-muted" style={{marginTop: '0.25rem'}}>Review pending approvals and monitor procurement analytics.</p>;
      case 'Vendor':
        return <p className="text-muted" style={{marginTop: '0.25rem'}}>Review RFQs, submit competitive quotations, and track orders.</p>;
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {user?.name}</h1>
          {renderRoleSpecificContent()}
        </div>
        {user?.role !== 'Vendor' && (
          <Button onClick={runHackathonDemo} disabled={isDemoRunning} variant="primary" style={{background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)', border: 'none'}}>
            <Play size={18} fill="currentColor" /> {isDemoRunning ? 'Running Demo...' : 'Run Automated Demo'}
          </Button>
        )}
      </div>

      {isLoading ? (
        <SkeletonDashboard />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="stats-grid">
            {(user?.role === 'Admin' || user?.role === 'Procurement Officer' || user?.role === 'Manager') && (
              <>
                <StatCard title="Total Vendors" value={stats.vendors} icon={<Users size={20} />} trend="12%" isPositive={true} />
                <StatCard title="Active RFQs" value={stats.rfqs} icon={<FileText size={20} />} trend="5%" isPositive={true} />
                <StatCard title="Pending Approvals" value={stats.approvals} icon={<CheckSquare size={20} />} trend="2" isPositive={false} />
                <StatCard title="Total Spending" value="$124,500" icon={<DollarSign size={20} />} trend="8%" isPositive={true} />
              </>
            )}
            {user?.role === 'Vendor' && (
              <>
                <StatCard title="Assigned RFQs" value={1} icon={<FileText size={20} />} />
                <StatCard title="Submitted Quotes" value={0} icon={<CheckSquare size={20} />} />
                <StatCard title="Active POs" value={0} icon={<ShoppingCart size={20} />} />
              </>
            )}
          </div>

          <div className="dashboard-grid">
            {/* Left Column */}
            <div className="dashboard-left" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Card>
                <div className="section-title">Procurement Trend</div>
                <AnalyticsPreview />
              </Card>
              <Card>
                <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Recent Activity</span>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/logs')}>View All</Button>
                </div>
                <ActivityTimeline activities={logs} />
              </Card>
            </div>

            {/* Right Column */}
            <div className="dashboard-right">
              <Card>
                <div className="section-title">Quick Actions</div>
                {renderQuickActions()}
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
