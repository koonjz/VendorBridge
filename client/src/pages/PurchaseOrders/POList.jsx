import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { poService } from '../../services/purchaseOrders';
import Card from '../../components/UI/Card';
import Table from '../../components/UI/Table';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import { SkeletonTable } from '../../components/UI/SkeletonLoader';
import EmptyState from '../../components/UI/EmptyState';
import { Plus, Search, Eye, Package } from 'lucide-react';

const POList = () => {
  const { user } = useAuth();
  const [pos, setPos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const allPos = await poService.getAll();
        if (user?.role === 'Vendor') {
          const vId = user.vendorId || user.id;
          setPos(allPos.filter(po => po.vendorId === vId));
        } else {
          setPos(allPos);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const filteredPos = pos.filter(po => 
    po.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    po.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Draft': return 'default';
      case 'Issued': return 'info';
      case 'Acknowledged': return 'info';
      case 'In Progress': return 'warning';
      case 'Delivered': return 'success';
      case 'Closed': return 'default';
      case 'Cancelled': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Purchase Orders</h1>
          <p className="text-muted">Manage procurement orders and fulfillment.</p>
        </div>
        {user?.role !== 'Vendor' && (
          <Button onClick={() => navigate('/purchase-orders/new')}>
            <Plus size={18} /> Create PO
          </Button>
        )}
      </div>

      <Card>
        <div className="table-controls">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by PO ID or Vendor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {isLoading ? (
          <SkeletonTable rows={5} cols={5} />
        ) : filteredPos.length === 0 && !searchTerm ? (
          <EmptyState 
            icon={Package} 
            title="No Purchase Orders" 
            description="You don't have any purchase orders yet." 
            actionLabel={user?.role !== 'Vendor' ? "Create PO" : null}
            onAction={() => navigate('/purchase-orders/new')} 
          />
        ) : (
          <Table 
            headers={['PO Number', 'Issue Date', 'Vendor', 'Total Amount', 'Status', 'Actions']}
            data={filteredPos}
            renderRow={(po) => (
              <tr key={po.id}>
                <td className="fw-500">{po.id}</td>
                <td>{new Date(po.issueDate).toLocaleDateString()}</td>
                <td>{po.vendorName}</td>
                <td className="fw-500">${Number(po.total).toLocaleString()}</td>
                <td><Badge variant={getStatusBadge(po.status)}>{po.status}</Badge></td>
                <td>
                  <div className="action-buttons">
                    <button className="icon-btn-small" title="View Details" onClick={() => navigate(`/purchase-orders/${po.id}`)}>
                      <Eye size={16}/>
                    </button>
                  </div>
                </td>
              </tr>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default POList;
