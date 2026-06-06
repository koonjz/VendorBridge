import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { poService } from '../../services/purchaseOrders';
import { activityLogService } from '../../services/activityLogs';
import Card from '../../components/UI/Card';
import Badge from '../../components/UI/Badge';
import Button from '../../components/UI/Button';
import { ArrowLeft, FileText, CheckCircle, Truck, XCircle } from 'lucide-react';
import './PurchaseOrders.css';

const PODetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [po, setPo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const targetPo = await poService.getById(id);
        if (!targetPo) return navigate('/purchase-orders');
        
        // Vendor security check
        const vId = user?.vendorId || user?.id;
        if (user?.role === 'Vendor' && targetPo.vendorId !== vId) {
          return navigate('/purchase-orders');
        }
        
        setPo(targetPo);
      } catch (e) {
        console.error(e);
        navigate('/purchase-orders');
      }
    };
    fetchData();
  }, [id, user, navigate]);

  const updateStatus = async (newStatus) => {
    if(window.confirm(`Are you sure you want to mark this PO as ${newStatus}?`)) {
      try {
        await poService.update(po.id, { status: newStatus });
        await activityLogService.create({ action: 'PO Status Updated', details: `PO ${po.id} status changed to ${newStatus}.`, status: 'info', module: 'Purchase Orders', role: user.role, userId: user.id, ipAddress: '127.0.0.1' });
        setPo({ ...po, status: newStatus });
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (!po) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <Button variant="secondary" onClick={() => navigate('/purchase-orders')}><ArrowLeft size={18} /></Button>
          <div>
            <h1>Purchase Order: {po.id}</h1>
            <p className="text-muted">Issued to {po.vendorName} on {new Date(po.issueDate).toLocaleDateString()}</p>
          </div>
        </div>
        <div style={{display: 'flex', gap: '1rem'}}>
          {po.status === 'Delivered' && user?.role !== 'Vendor' && (
            <Button variant="primary" onClick={() => navigate(`/invoices/new/${po.id}`)}>
              <FileText size={18} /> Generate Invoice
            </Button>
          )}
        </div>
      </div>

      <div className="po-details-grid">
        <div className="po-main-col">
          <Card>
            <h3 className="section-title">Itemized Order Details</h3>
            <table className="po-items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th style={{textAlign: 'center'}}>Qty</th>
                  <th style={{textAlign: 'right'}}>Unit Price</th>
                  <th style={{textAlign: 'right'}}>Total</th>
                </tr>
              </thead>
              <tbody>
                {po.items.map(item => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td style={{textAlign: 'center'}}>{item.quantity}</td>
                    <td style={{textAlign: 'right'}}>${Number(item.unitPrice).toLocaleString()}</td>
                    <td style={{textAlign: 'right'}}>${(item.quantity * item.unitPrice).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="po-financial-summary">
              <div className="summary-line"><span>Subtotal:</span> <span>${po.subtotal.toLocaleString()}</span></div>
              <div className="summary-line"><span>Tax:</span> <span>${po.tax.toLocaleString()}</span></div>
              <div className="summary-line"><span>Discount:</span> <span>${po.discount.toLocaleString()}</span></div>
              <div className="summary-line final-total"><span>Grand Total:</span> <span>${po.total.toLocaleString()}</span></div>
            </div>
          </Card>

          <Card style={{marginTop: '1.5rem'}}>
            <h3 className="section-title">Notes & Instructions</h3>
            <p className="text-muted">{po.notes || 'No special instructions provided.'}</p>
          </Card>
        </div>

        <div className="po-sidebar-col">
          <Card>
            <h3 className="section-title">Status Actions</h3>
            <div style={{marginBottom: '1.5rem'}}>
              <Badge variant="info" style={{fontSize: '1rem', padding: '0.5rem 1rem'}}>{po.status}</Badge>
            </div>
            
            <div className="status-action-list">
              {user?.role === 'Vendor' ? (
                <>
                  <Button variant="secondary" className="w-full" disabled={po.status !== 'Issued'} onClick={() => updateStatus('Acknowledged')}>
                    <CheckCircle size={16} /> Acknowledge Receipt
                  </Button>
                  <Button variant="primary" className="w-full" disabled={po.status !== 'Acknowledged'} onClick={() => updateStatus('In Progress')}>
                    <Truck size={16} /> Mark In Progress
                  </Button>
                  <Button variant="success" className="w-full bg-success" disabled={po.status !== 'In Progress'} onClick={() => updateStatus('Delivered')}>
                    <CheckCircle size={16} /> Mark Delivered
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="danger" className="w-full text-danger border-danger" disabled={po.status === 'Delivered' || po.status === 'Closed' || po.status === 'Cancelled'} onClick={() => updateStatus('Cancelled')}>
                    <XCircle size={16} /> Cancel Order
                  </Button>
                  <Button variant="secondary" className="w-full" disabled={po.status !== 'Delivered'} onClick={() => updateStatus('Closed')}>
                    <CheckCircle size={16} /> Close Order
                  </Button>
                </>
              )}
            </div>
          </Card>

          <Card style={{marginTop: '1.5rem'}}>
            <h3 className="section-title">Order References</h3>
            <p className="text-muted mb-2"><strong>Vendor:</strong> {po.vendorName}</p>
            <p className="text-muted mb-2"><strong>Approval ID:</strong> {po.approvalId}</p>
            <p className="text-muted mb-2"><strong>RFQ ID:</strong> {po.rfqId}</p>
            <p className="text-muted"><strong>Expected Delivery:</strong> {new Date(po.expectedDelivery).toLocaleDateString()}</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PODetails;
