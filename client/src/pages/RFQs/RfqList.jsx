import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { rfqService } from '../../services/rfqs';
import { activityLogService } from '../../services/activityLogs';
import { userService } from '../../services/users';
import Card from '../../components/UI/Card';
import Table from '../../components/UI/Table';
import Button from '../../components/UI/Button';
import { SkeletonTable } from '../../components/UI/SkeletonLoader';
import EmptyState from '../../components/UI/EmptyState';
import { Plus, Search, Eye, Edit, Archive, Send, GitMerge, FileText } from 'lucide-react';
import Badge from '../../components/UI/Badge';
import './RFQs.css';

const RfqList = () => {
  const { user } = useAuth();
  const [rfqs, setRfqs] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rfqData, userData] = await Promise.all([
        rfqService.getAll(),
        userService.getAll()
      ]);
      setRfqs(rfqData);
      setUsers(userData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleArchive = async (id, title) => {
    if(window.confirm(`Are you sure you want to archive/cancel RFQ: ${title}?`)) {
      try {
        await rfqService.update(id, { status: 'Cancelled' });
        await activityLogService.create({ action: 'RFQ Cancelled', details: `${title} was cancelled/archived.`, status: 'warning', module: 'RFQs', role: 'System', userId: 'System', ipAddress: '127.0.0.1' });
        loadData();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const getCreatorName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown';
  };

  const filteredRfqs = rfqs.filter(r => {
    if (user?.role === 'Vendor') {
      if (!r.assignedVendorIds?.includes(user.vendorId)) return false;
      if (r.status !== 'Open') return false;
    }
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const paginatedRfqs = filteredRfqs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredRfqs.length / itemsPerPage);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open': return 'success';
      case 'Draft': return 'default';
      case 'Closed': return 'warning';
      case 'Approved': return 'success';
      case 'Cancelled': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Requests for Quotation (RFQs)</h1>
          <p className="text-muted">Manage all procurement requests and vendor solicitations.</p>
        </div>
        {user?.role !== 'Vendor' && (
          <Button onClick={() => navigate('/rfqs/new')}>
            <Plus size={18} /> Create RFQ
          </Button>
        )}
      </div>

      <Card className="rfq-list-card">
        <div className="table-controls">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search RFQs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <select 
            className="filter-select" 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
            <option value="Approved">Approved</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {isLoading ? (
          <SkeletonTable rows={5} cols={5} />
        ) : filteredRfqs.length === 0 && !searchTerm ? (
          <EmptyState 
            icon={FileText} 
            title="No RFQs Found" 
            description="Start the procurement process by creating your first Request for Quotation." 
            actionLabel={user?.role !== 'Vendor' ? "Create RFQ" : null}
            onAction={() => navigate('/rfqs/new')} 
          />
        ) : (
          <>
            <Table 
          headers={['RFQ ID', 'Title', 'Category', 'Deadline', 'Vendors', 'Status', 'Actions']}
          data={paginatedRfqs}
          renderRow={(rfq) => (
            <tr key={rfq.id}>
              <td className="fw-500">{rfq.id}</td>
              <td>
                <div className="rfq-title">{rfq.title}</div>
                <div className="rfq-meta">By: {getCreatorName(rfq.createdBy)}</div>
              </td>
              <td>{rfq.category}</td>
              <td>{new Date(rfq.deadline).toLocaleDateString()}</td>
              <td>{rfq.assignedVendorIds?.length || 0}</td>
              <td><Badge variant={getStatusBadge(rfq.status)}>{rfq.status}</Badge></td>
              <td>
                <div className="action-buttons">
                  <button className="icon-btn-small" title="View Details" onClick={() => navigate(`/rfqs/${rfq.id}`)}><Eye size={16}/></button>
                  {user?.role === 'Vendor' ? (
                    <button className="icon-btn-small" title="Submit/Edit Quotation" onClick={() => navigate(`/quotations/new/${rfq.id}`)}>
                      <Send size={16}/>
                    </button>
                  ) : (
                    <>
                      <button 
                        className="icon-btn-small" 
                        title="Compare Quotes" 
                        onClick={() => navigate(`/rfqs/${rfq.id}/compare`)}
                      >
                        <GitMerge size={16}/>
                      </button>
                      <button 
                        className="icon-btn-small" 
                        title="Edit" 
                        onClick={() => navigate(`/rfqs/${rfq.id}/edit`)}
                        disabled={rfq.status === 'Approved' || rfq.status === 'Closed' || rfq.status === 'Cancelled'}
                      >
                        <Edit size={16}/>
                      </button>
                      <button 
                        className="icon-btn-small danger" 
                        title="Cancel/Archive" 
                        onClick={() => handleArchive(rfq.id, rfq.title)}
                        disabled={rfq.status === 'Cancelled'}
                      >
                        <Archive size={16}/>
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          )}
        />
        
        {totalPages > 1 && (
          <div className="pagination">
            <Button variant="secondary" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</Button>
            <Button variant="secondary" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </>
    )}
  </Card>
    </div>
  );
};

export default RfqList;
