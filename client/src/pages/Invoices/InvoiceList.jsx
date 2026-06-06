import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { invoiceService } from '../../services/invoices';
import Card from '../../components/UI/Card';
import Table from '../../components/UI/Table';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import { SkeletonTable } from '../../components/UI/SkeletonLoader';
import EmptyState from '../../components/UI/EmptyState';
import { Search, Eye, FileText } from 'lucide-react';
import './Invoices.css';

const InvoiceList = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const allInvoices = await invoiceService.getAll();
        if (user?.role === 'Vendor') {
          const vId = user.vendorId || user.id;
          setInvoices(allInvoices.filter(inv => inv.vendorId === vId));
        } else {
          setInvoices(allInvoices);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inv.vendorName?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Draft': return 'default';
      case 'Sent': return 'info';
      case 'Paid': return 'success';
      case 'Overdue': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Invoices</h1>
          <p className="text-muted">Manage billing and payments.</p>
        </div>
      </div>

      <Card>
        <div className="table-controls">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by Invoice # or Vendor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {isLoading ? (
          <SkeletonTable rows={5} cols={5} />
        ) : filteredInvoices.length === 0 && !searchTerm ? (
          <EmptyState 
            icon={FileText} 
            title="No Invoices" 
            description="You don't have any invoices yet." 
          />
        ) : (
          <Table 
            headers={['Invoice Number', 'PO Reference', 'Vendor', 'Billing Date', 'Due Date', 'Amount', 'Status', 'Actions']}
            data={filteredInvoices}
            renderRow={(inv) => (
              <tr key={inv.id}>
                <td className="fw-500">{inv.invoiceNumber}</td>
                <td>{inv.purchaseOrderId}</td>
                <td>{inv.vendorName || 'Unknown'}</td>
                <td>{new Date(inv.billingDate).toLocaleDateString()}</td>
                <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                <td className="fw-500">${Number(inv.grandTotal).toLocaleString()}</td>
                <td><Badge variant={getStatusBadge(inv.status)}>{inv.status}</Badge></td>
                <td>
                  <div className="action-buttons">
                    <button className="icon-btn-small" title="Preview" onClick={() => navigate(`/invoices/${inv.id}`)}>
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

export default InvoiceList;
