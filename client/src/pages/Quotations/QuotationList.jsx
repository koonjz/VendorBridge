import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { quotationService } from '../../services/quotations';
import Card from '../../components/UI/Card';
import Table from '../../components/UI/Table';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import { Search, Eye, Edit } from 'lucide-react';
import './Quotations.css';

const QuotationList = () => {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allQuotations = await quotationService.getAll();
        if (user?.role === 'Vendor') {
          // Fallback if vendorId is undefined in schema but maps to user
          const vId = user.vendorId || user.id; 
          setQuotations(allQuotations.filter(q => q.vendorId === vId));
        } else {
          setQuotations(allQuotations);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, [user]);

  const filteredQuotes = quotations.filter(q => {
    const matchesSearch = q.rfqId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          q.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          q.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || q.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const paginatedQuotes = filteredQuotes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Submitted': return 'info';
      case 'Under Review': return 'warning';
      case 'Selected': return 'success';
      case 'Rejected': return 'danger';
      case 'Draft': return 'default';
      default: return 'default';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>{user?.role === 'Vendor' ? 'My Quotations' : 'Vendor Quotations'}</h1>
          <p className="text-muted">Manage and review RFQ responses.</p>
        </div>
      </div>

      <Card className="quotation-list-card">
        <div className="table-controls">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by ID, RFQ or Vendor..." 
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
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Selected">Selected</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <Table 
          headers={['Quotation ID', 'RFQ ID', 'Vendor', 'Amount', 'Delivery', 'Status', 'Actions']}
          data={paginatedQuotes}
          renderRow={(quote) => (
            <tr key={quote.id}>
              <td className="fw-500">{quote.id}</td>
              <td>{quote.rfqId}</td>
              <td>{quote.vendorName}</td>
              <td className="fw-500">${Number(quote.finalAmount).toLocaleString()} {quote.currency}</td>
              <td>{quote.deliveryDays} Days</td>
              <td><Badge variant={getStatusBadge(quote.status)}>{quote.status}</Badge></td>
              <td>
                <div className="action-buttons">
                  {user?.role === 'Vendor' && (quote.status === 'Draft' || quote.status === 'Submitted') ? (
                    <button className="icon-btn-small" title="Edit/View" onClick={() => navigate(`/quotations/new/${quote.rfqId}`)}>
                      <Edit size={16}/>
                    </button>
                  ) : (
                    <button className="icon-btn-small" title="View Details" onClick={() => navigate(`/quotations/${quote.id}`)}>
                      <Eye size={16}/>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )}
        />
        
        {totalPages > 1 && (
          <div className="pagination">
            <Button variant="secondary" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</Button>
            <span className="page-info">Page {currentPage} of {totalPages}</span>
            <Button variant="secondary" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default QuotationList;
