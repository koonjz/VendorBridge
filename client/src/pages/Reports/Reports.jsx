import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastProvider';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { Download, FileText, PieChart, TrendingUp, BarChart2, Star, Clock } from 'lucide-react';
import { SkeletonDashboard } from '../../components/UI/SkeletonLoader';
import './Reports.css';

const StatCard = ({ title, value, icon, subtext }) => (
  <Card className="stat-card fade-in-up">
    <div className="stat-header">
      <span className="stat-title">{title}</span>
      <div className="stat-icon">{icon}</div>
    </div>
    <div className="stat-value">{value}</div>
    {subtext && <div className="stat-trend text-muted">{subtext}</div>}
  </Card>
);

const Reports = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  }, []);

  const handleExport = (type) => {
    addToast(`Exporting report as ${type}...`, 'info');
    setTimeout(() => {
      addToast(`${type} export completed successfully!`, 'success');
    }, 1500);
  };

  if (isLoading) return <div className="page-container"><SkeletonDashboard /></div>;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1>Executive Analytics</h1>
          <p className="text-muted">High-level insights into procurement operations.</p>
        </div>
        <div style={{display: 'flex', gap: '0.5rem'}}>
          <Button variant="secondary" onClick={() => handleExport('CSV')}><Download size={18} /> CSV</Button>
          <Button variant="secondary" onClick={() => handleExport('PDF')}><FileText size={18} /> PDF</Button>
        </div>
      </div>

      <div className="stats-grid" style={{marginBottom: '1.5rem'}}>
        <StatCard title="Total Spend YTD" value="$1,245,600" icon={<TrendingUp size={20} />} subtext="+14% vs last year" />
        <StatCard title="Active Vendors" value="48" icon={<Star size={20} />} subtext="3 onboarded this month" />
        <StatCard title="Avg Turnaround" value="2.4 days" icon={<Clock size={20} />} subtext="-0.5 days vs last month" />
        <StatCard title="Cost Savings" value="$84,200" icon={<PieChart size={20} />} subtext="From automated comparisons" />
      </div>

      <div className="reports-grid">
        <Card className="report-span-2">
          <h3 className="section-title">Monthly Procurement Trend</h3>
          <div className="mock-chart-area bar-chart">
            <div className="report-chart-bar" style={{height: '30%'}}><span>Jan</span></div>
            <div className="report-chart-bar" style={{height: '45%'}}><span>Feb</span></div>
            <div className="report-chart-bar" style={{height: '60%'}}><span>Mar</span></div>
            <div className="report-chart-bar" style={{height: '40%'}}><span>Apr</span></div>
            <div className="report-chart-bar" style={{height: '75%'}}><span>May</span></div>
            <div className="report-chart-bar" style={{height: '90%', background: 'var(--accent-primary)'}}><span>Jun</span></div>
          </div>
        </Card>

        <Card>
          <h3 className="section-title">Spending by Category</h3>
          <div className="donut-chart-container">
            <div className="mock-donut">
              <div className="donut-center"></div>
            </div>
            <div className="donut-legend">
              <div className="legend-item"><span className="dot c1"></span> Hardware (45%)</div>
              <div className="legend-item"><span className="dot c2"></span> Software (30%)</div>
              <div className="legend-item"><span className="dot c3"></span> Services (15%)</div>
              <div className="legend-item"><span className="dot c4"></span> Supplies (10%)</div>
            </div>
          </div>
        </Card>

        <Card className="report-span-2">
          <h3 className="section-title">Top Vendors Leaderboard</h3>
          <div className="table-responsive" style={{marginTop: '1rem'}}>
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Vendor Name</th>
                  <th>Orders Filled</th>
                  <th>Avg Rating</th>
                  <th>Delivery SLA</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>#1</td><td className="fw-500">Global Supplies Inc</td><td>24</td><td className="text-success">4.9 ★</td><td>98%</td></tr>
                <tr><td>#2</td><td className="fw-500">TechCorp Solutions</td><td>18</td><td className="text-success">4.7 ★</td><td>95%</td></tr>
                <tr><td>#3</td><td className="fw-500">Office World</td><td>12</td><td>4.5 ★</td><td>92%</td></tr>
                <tr><td>#4</td><td className="fw-500">Hardware Plus</td><td>8</td><td>4.2 ★</td><td>88%</td></tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
