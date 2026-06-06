import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vendorService } from '../../services/vendors';
import Card from '../../components/UI/Card';
import Badge from '../../components/UI/Badge';
import Button from '../../components/UI/Button';
import { ArrowLeft, Building, Mail, Phone, MapPin, FileText, CheckSquare, ShoppingCart } from 'lucide-react';

const VendorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const data = await vendorService.getById(id);
        setVendor(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchVendor();
  }, [id]);

  if (!vendor) {
    return <div className="page-container"><p>Loading vendor details...</p></div>;
  }

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
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <Button variant="secondary" onClick={() => navigate('/vendors')}><ArrowLeft size={18} /></Button>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {vendor.companyName}
              <Badge variant={getStatusBadge(vendor.status)}>{vendor.status}</Badge>
            </h1>
            <p className="text-muted">Vendor ID: {vendor.id} • Category: {vendor.category}</p>
          </div>
        </div>
      </div>

      <div className="details-grid">
        <Card>
          <h3 className="section-title">Company Information</h3>
          <div className="info-list">
            <div className="info-item">
              <Building size={16} className="text-muted" />
              <span><strong>GST:</strong> {vendor.gst}</span>
            </div>
            <div className="info-item">
              <MapPin size={16} className="text-muted" />
              <span><strong>Address:</strong> {vendor.address}, {vendor.country}</span>
            </div>
            <div className="info-item">
              <span className="text-muted" style={{marginLeft: '20px'}}><strong>Rating:</strong> {vendor.rating > 0 ? `${vendor.rating} / 5` : 'Not Rated'}</span>
            </div>
          </div>
          <h3 className="section-title" style={{marginTop: '1.5rem'}}>Contact Information</h3>
          <div className="info-list">
            <div className="info-item">
              <span className="text-muted" style={{marginLeft: '20px'}}><strong>Person:</strong> {vendor.contactPerson}</span>
            </div>
            <div className="info-item">
              <Mail size={16} className="text-muted" />
              <span>{vendor.email}</span>
            </div>
            <div className="info-item">
              <Phone size={16} className="text-muted" />
              <span>{vendor.phone}</span>
            </div>
          </div>
          {vendor.notes && (
            <div className="info-notes" style={{marginTop: '1.5rem'}}>
              <strong>Notes:</strong> <p className="text-muted">{vendor.notes}</p>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="section-title">Procurement Summary (Mock Data)</h3>
          <div className="stats-grid" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
            <div className="stat-card" style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)'}}>
              <div className="stat-header">
                <span className="stat-title">RFQs Participated</span>
                <div className="stat-icon"><FileText size={16} /></div>
              </div>
              <div className="stat-value">3</div>
            </div>
            <div className="stat-card" style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)'}}>
              <div className="stat-header">
                <span className="stat-title">Quotations Submitted</span>
                <div className="stat-icon"><CheckSquare size={16} /></div>
              </div>
              <div className="stat-value">2</div>
            </div>
            <div className="stat-card" style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)'}}>
              <div className="stat-header">
                <span className="stat-title">Purchase Orders Received</span>
                <div className="stat-icon"><ShoppingCart size={16} /></div>
              </div>
              <div className="stat-value">1</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VendorDetails;
