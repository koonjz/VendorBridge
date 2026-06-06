import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { approvalService } from '../../services/approvals';
import { rfqService } from '../../services/rfqs';
import { quotationService } from '../../services/quotations';
import { vendorService } from '../../services/vendors';
import { activityLogService } from '../../services/activityLogs';
import Card from '../../components/UI/Card';
import Badge from '../../components/UI/Badge';
import Button from '../../components/UI/Button';
import { ArrowLeft, Check, X } from 'lucide-react';
import './Approvals.css';

const ApprovalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [approval, setApproval] = useState(null);
  const [rfq, setRfq] = useState(null);
  const [quotation, setQuotation] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const targetApproval = await approvalService.getById(id);
        if (!targetApproval) return navigate('/approvals');
        setApproval(targetApproval);

        const [rData, qData, vData] = await Promise.all([
          rfqService.getById(targetApproval.rfqId),
          quotationService.getById(targetApproval.quotationId),
          vendorService.getById(targetApproval.vendorId)
        ]);

        setRfq(rData);
        setQuotation(qData);
        setVendor(vData);
      } catch (e) {
        console.error(e);
        navigate('/approvals');
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleAction = async (decision) => {
    if (!remarks && decision === 'Rejected') {
      return alert('Remarks are required for rejection.');
    }

    const isApproved = decision === 'Approved';
    
    try {
      // Update Approval Record
      await approvalService.update(approval.id, { 
        status: decision, 
        remarks, 
        approvedAt: new Date().toISOString() 
      });

      // Update Quotation Statuses
      const allQuotes = await quotationService.getAll();
      if (isApproved) {
        await quotationService.update(quotation.id, { status: 'Selected' });
        
        // Reject others
        for (const q of allQuotes) {
          if (q.rfqId === rfq.id && q.id !== quotation.id) {
            await quotationService.update(q.id, { status: 'Rejected' });
          }
        }
        
        // Update RFQ
        await rfqService.update(rfq.id, { status: 'Approved' });
        await activityLogService.create({ action: 'RFQ Approved', details: `${rfq.title} was approved by ${user.name}.`, status: 'success', module: 'Approvals', role: user.role, userId: user.id, ipAddress: '127.0.0.1' });
      } else {
        await quotationService.update(quotation.id, { status: 'Rejected' });
        await rfqService.update(rfq.id, { status: 'Open' }); // Re-open RFQ for another selection
        await activityLogService.create({ action: 'Quotation Rejected', details: `${vendor.companyName}'s quote for ${rfq.title} was rejected.`, status: 'danger', module: 'Approvals', role: user.role, userId: user.id, ipAddress: '127.0.0.1' });
      }

      alert(`Successfully ${decision.toLowerCase()}!`);
      navigate('/approvals');
    } catch (e) {
      console.error(e);
      alert('Action failed.');
    }
  };

  if (!approval || !rfq || !quotation) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <Button variant="secondary" onClick={() => navigate('/approvals')}><ArrowLeft size={18} /></Button>
          <div>
            <h1>Approval: {approval.id}</h1>
            <p className="text-muted">Review recommended quotation for RFQ: {rfq.title}</p>
          </div>
        </div>
      </div>

      <div className="approval-details-grid">
        <div className="approval-main">
          <Card>
            <h3 className="section-title">Recommendation Justification</h3>
            <div className="justification-box">
              <p>"{approval.justification}"</p>
            </div>
          </Card>

          <Card style={{marginTop: '1.5rem'}}>
            <h3 className="section-title">Quotation Details</h3>
            <div className="quote-summary">
              <div className="summary-row"><span>Vendor:</span> <strong>{vendor?.companyName}</strong></div>
              <div className="summary-row"><span>Amount:</span> <strong>${Number(quotation.finalAmount).toLocaleString()} {quotation.currency}</strong></div>
              <div className="summary-row"><span>Delivery:</span> <strong>{quotation.deliveryDays} Days</strong></div>
              <div className="summary-row"><span>Warranty:</span> <strong>{quotation.warranty || 'None'}</strong></div>
              <div className="summary-row"><span>Notes:</span> <span>{quotation.notes || 'None'}</span></div>
            </div>
          </Card>
        </div>

        <div className="approval-sidebar">
          <Card>
            <h3 className="section-title">Decision</h3>
            <Badge variant="info" className="mb-4">Score: {approval.recommendedScore} / 100</Badge>
            
            {approval.status === 'Pending' ? (
              <>
                <div className="input-group" style={{marginTop: '1rem', marginBottom: '1rem'}}>
                  <label className="input-label">Manager Remarks</label>
                  <textarea 
                    className="input-field w-full" 
                    rows={4} 
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter approval/rejection remarks..."
                  ></textarea>
                </div>
                <div style={{display: 'flex', gap: '1rem'}}>
                  <Button variant="primary" className="w-full bg-success" onClick={() => handleAction('Approved')}>
                    <Check size={18}/> Approve
                  </Button>
                  <Button variant="secondary" className="w-full text-danger border-danger" onClick={() => handleAction('Rejected')}>
                    <X size={18}/> Reject
                  </Button>
                </div>
              </>
            ) : (
              <div style={{marginTop: '1rem'}}>
                <Badge variant={approval.status === 'Approved' ? 'success' : 'danger'} style={{fontSize: '1rem', padding: '0.5rem'}}>
                  {approval.status}
                </Badge>
                <div style={{marginTop: '1rem'}}>
                  <strong>Remarks:</strong>
                  <p className="text-muted mt-2">{approval.remarks || 'No remarks provided.'}</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ApprovalDetails;
