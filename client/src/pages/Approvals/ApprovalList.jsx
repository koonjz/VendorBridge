import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { approvalService } from '../../services/approvals';
import { rfqService } from '../../services/rfqs';
import Card from '../../components/UI/Card';
import Table from '../../components/UI/Table';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import { Search, Eye } from 'lucide-react';
import './Approvals.css';

const ApprovalList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Only Managers/Admins should see this
    if (user?.role === 'Vendor' || user?.role === 'Procurement Officer') {
      navigate('/dashboard');
      return;
    }
    
    const fetchData = async () => {
      try {
        const [apprData, rfqData] = await Promise.all([
          approvalService.getAll(),
          rfqService.getAll()
        ]);
        setApprovals(apprData);
        setRfqs(rfqData);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, [user, navigate]);

  const getRfqTitle = (rfqId) => {
    return rfqs.find(r => r.id === rfqId)?.title || 'Unknown RFQ';
  };

  const filteredApprovals = approvals.filter(a => {
    const titleMatch = getRfqTitle(a.rfqId).toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = a.id.toLowerCase().includes(searchTerm.toLowerCase());
    return titleMatch || idMatch;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Approved': return 'success';
      case 'Rejected': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Procurement Approvals</h1>
          <p className="text-muted">Review and approve vendor recommendations.</p>
        </div>
      </div>

      <Card>
        <div className="table-controls">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by ID or RFQ Title..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <Table 
          headers={['Approval ID', 'RFQ Title', 'Vendor', 'Score', 'Requested Date', 'Status', 'Actions']}
          data={filteredApprovals}
          renderRow={(approval) => (
            <tr key={approval.id}>
              <td className="fw-500">{approval.id}</td>
              <td>{getRfqTitle(approval.rfqId)}</td>
              <td>{getCollection('vendors').find(v => v.id === approval.vendorId)?.companyName || 'Unknown'}</td>
              <td><Badge variant="info">{approval.recommendedScore}</Badge></td>
              <td>{new Date(approval.createdAt).toLocaleDateString()}</td>
              <td><Badge variant={getStatusBadge(approval.status)}>{approval.status}</Badge></td>
              <td>
                <div className="action-buttons">
                  <button className="icon-btn-small" title="Review" onClick={() => navigate(`/approvals/${approval.id}`)}>
                    <Eye size={16}/>
                  </button>
                </div>
              </td>
            </tr>
          )}
        />
      </Card>
    </div>
  );
};

export default ApprovalList;
