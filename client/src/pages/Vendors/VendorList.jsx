import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vendorService } from '../../services/vendors';
import { activityLogService } from '../../services/activityLogs';
import Card from '../../components/UI/Card';
import Table from '../../components/UI/Table';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import Input from '../../components/UI/Input';
import { SkeletonTable } from '../../components/UI/SkeletonLoader';
import EmptyState from '../../components/UI/EmptyState';
import VendorModal from './VendorModal';
import { Plus, Search, Eye, Edit, Archive, Users } from 'lucide-react';
import './Vendors.css';

const VendorList = () => {
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  const loadVendors = async () => {
    setIsLoading(true);
    try {
      const data = await vendorService.getAll();
      setVendors(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleSave = async (vendorData) => {
    try {
      if (editingVendor) {
        await vendorService.update(editingVendor.id, vendorData);
        await activityLogService.create({ action: 'Vendor Updated', details: `${vendorData.companyName} details were updated.`, status: 'info', module: 'Vendors', role: 'System', userId: 'System', ipAddress: '127.0.0.1' });
      } else {
        await vendorService.create(vendorData);
        await activityLogService.create({ action: 'Vendor Created', details: `${vendorData.companyName} was added.`, status: 'success', module: 'Vendors', role: 'System', userId: 'System', ipAddress: '127.0.0.1' });
      }
      loadVendors();
      setIsModalOpen(false);
      setEditingVendor(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleArchive = async (id, companyName) => {
    if(window.confirm(`Are you sure you want to archive ${companyName}?`)) {
      try {
        await vendorService.delete(id); // This performs the archive based on our backend
        await activityLogService.create({ action: 'Vendor Archived', details: `${companyName} was archived.`, status: 'warning', module: 'Vendors', role: 'System', userId: 'System', ipAddress: '127.0.0.1' });
        loadVendors();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || v.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const paginatedVendors = filteredVendors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Pending': return 'warning';
      case 'Inactive': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Vendor Management</h1>
          <p className="text-muted">Manage supplier profiles and registrations.</p>
        </div>
        <Button onClick={() => { setEditingVendor(null); setIsModalOpen(true); }}>
          <Plus size={18} /> Add Vendor
        </Button>
      </div>

      <Card className="vendor-list-card">
        <div className="table-controls">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search vendors..." 
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
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {isLoading ? (
          <SkeletonTable rows={5} cols={5} />
        ) : filteredVendors.length === 0 && !searchTerm ? (
          <EmptyState 
            icon={Users} 
            title="No Vendors Registered" 
            description="Start building your procurement network by adding a new vendor." 
            actionLabel="Add Vendor" 
            onAction={() => { setEditingVendor(null); setIsModalOpen(true); }} 
          />
        ) : (
          <>
            <Table 
              headers={['Vendor ID', 'Company', 'Category', 'Contact', 'Status', 'Rating', 'Actions']}
              data={paginatedVendors}
              renderRow={(vendor) => (
                <tr key={vendor.id}>
                  <td>{vendor.id}</td>
                  <td>
                    <div className="company-name">{vendor.companyName}</div>
                    <div className="vendor-email">{vendor.email}</div>
                  </td>
                  <td>{vendor.category}</td>
                  <td>{vendor.contactPerson}</td>
                  <td><Badge variant={getStatusBadge(vendor.status)}>{vendor.status}</Badge></td>
                  <td>{vendor.rating > 0 ? `${vendor.rating} ★` : 'N/A'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="icon-btn-small" title="View Details" onClick={() => navigate(`/vendors/${vendor.id}`)}><Eye size={16}/></button>
                      <button className="icon-btn-small" title="Edit" onClick={() => { setEditingVendor(vendor); setIsModalOpen(true); }}><Edit size={16}/></button>
                      <button className="icon-btn-small danger" title="Archive" onClick={() => handleArchive(vendor.id, vendor.companyName)}><Archive size={16}/></button>
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
          </>
        )}
      </Card>

      <VendorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        vendor={editingVendor}
        onSave={handleSave}
      />
    </div>
  );
};

export default VendorList;
