import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rfqService } from '../../services/rfqs';
import { vendorService } from '../../services/vendors';
import { userService } from '../../services/users';
import Card from '../../components/UI/Card';
import Badge from '../../components/UI/Badge';
import Button from '../../components/UI/Button';
import { ArrowLeft, Calendar, User, DollarSign, Package, AlertCircle } from 'lucide-react';

const RfqDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfq, setRfq] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [creator, setCreator] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const foundRfq = await rfqService.getById(id);
        const [allVendors, allUsers] = await Promise.all([
          vendorService.getAll(),
          userService.getAll()
        ]);
        if (foundRfq) {
          setRfq(foundRfq);
          // With Prisma, assignedVendors might be returned populated depending on the include schema,
          // but if we fall back to filtering, we can check foundRfq.assignedVendors or fallback
          if (foundRfq.assignedVendors) {
             setVendors(foundRfq.assignedVendors);
          } else {
             setVendors(allVendors.filter(v => foundRfq.assignedVendorIds?.includes(v.id)));
          }
          setCreator(allUsers.find(u => u.id === foundRfq.createdBy));
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, [id]);

  if (!rfq) return <div className="page-container"><p>Loading RFQ details...</p></div>;

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

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent': return 'danger';
      case 'High': return 'warning';
      default: return 'info';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <Button variant="secondary" onClick={() => navigate('/rfqs')}><ArrowLeft size={18} /></Button>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {rfq.title}
              <Badge variant={getStatusBadge(rfq.status)}>{rfq.status}</Badge>
            </h1>
            <p className="text-muted">RFQ ID: {rfq.id}</p>
          </div>
        </div>
        {(rfq.status === 'Draft' || rfq.status === 'Open') && (
          <Button onClick={() => navigate(`/rfqs/${rfq.id}/edit`)}>Edit RFQ</Button>
        )}
      </div>

      <div className="rfq-details-grid">
        <div className="rfq-main-col">
          <Card>
            <h3 className="section-title">Description</h3>
            <p style={{lineHeight: '1.6'}}>{rfq.description}</p>
            {rfq.notes && (
              <div className="info-notes" style={{marginTop: '1.5rem'}}>
                <strong>Notes:</strong> <p className="text-muted">{rfq.notes}</p>
              </div>
            )}
          </Card>

          <Card style={{marginTop: '1.5rem'}}>
            <h3 className="section-title">Assigned Vendors ({vendors.length})</h3>
            <div className="assigned-vendors-grid">
              {vendors.length > 0 ? vendors.map(v => (
                <div key={v.id} className="assigned-vendor-card">
                  <div className="vendor-header">
                    <strong>{v.companyName}</strong>
                    <Badge variant={v.status === 'Active' ? 'success' : 'warning'}>{v.status}</Badge>
                  </div>
                  <p className="text-muted" style={{fontSize: '0.85rem', marginTop: '0.5rem'}}>{v.category} • {v.rating > 0 ? `${v.rating} ★` : 'No rating'}</p>
                </div>
              )) : (
                <p className="text-muted">No vendors assigned to this RFQ yet.</p>
              )}
            </div>
          </Card>
        </div>

        <div className="rfq-side-col">
          <Card>
            <h3 className="section-title">Procurement Details</h3>
            <div className="info-list">
              <div className="info-item">
                <Package size={16} className="text-muted" />
                <span><strong>Quantity:</strong> {rfq.quantity} {rfq.unit}</span>
              </div>
              <div className="info-item">
                <DollarSign size={16} className="text-muted" />
                <span><strong>Budget:</strong> ${Number(rfq.budget).toLocaleString()}</span>
              </div>
              <div className="info-item">
                <AlertCircle size={16} className="text-muted" />
                <span><strong>Priority:</strong> <Badge variant={getPriorityBadge(rfq.priority)}>{rfq.priority}</Badge></span>
              </div>
              <div className="info-item">
                <Calendar size={16} className="text-muted" />
                <span><strong>Deadline:</strong> {new Date(rfq.deadline).toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <User size={16} className="text-muted" />
                <span><strong>Created By:</strong> {creator?.name || 'Unknown'}</span>
              </div>
            </div>
          </Card>

          <Card style={{marginTop: '1.5rem'}}>
            <h3 className="section-title">Workflow Timeline</h3>
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-dot success"></div>
                <div className="timeline-content">
                  <div className="timeline-action">RFQ Created</div>
                  <div className="timeline-time">{new Date(rfq.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="timeline-item">
                <div className={`timeline-dot ${rfq.status !== 'Draft' ? 'success' : 'default'}`}></div>
                <div className="timeline-content">
                  <div className="timeline-action">Vendor Invitations Sent</div>
                  <div className="timeline-time">{rfq.status !== 'Draft' ? 'Done' : 'Pending'}</div>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot default"></div>
                <div className="timeline-content">
                  <div className="timeline-action">Quotations Received</div>
                  <div className="timeline-time">Pending Submission Module</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RfqDetails;
