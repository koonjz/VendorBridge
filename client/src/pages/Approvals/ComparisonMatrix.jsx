import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { rfqService } from '../../services/rfqs';
import { quotationService } from '../../services/quotations';
import { vendorService } from '../../services/vendors';
import { approvalService } from '../../services/approvals';
import { activityLogService } from '../../services/activityLogs';
import Card from '../../components/UI/Card';
import Badge from '../../components/UI/Badge';
import Button from '../../components/UI/Button';
import { calculateQuotationScore } from '../../utils/scoring';
import { ArrowLeft, CheckCircle, Zap, Star, Sparkles } from 'lucide-react';
import './Approvals.css';

const ComparisonMatrix = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [rfq, setRfq] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [justification, setJustification] = useState('');

  useEffect(() => {
    if (user?.role === 'Vendor') {
      navigate('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        const targetRfq = await rfqService.getById(id);
        if (!targetRfq) return navigate('/rfqs');
        setRfq(targetRfq);

        const [allQuotes, vendors] = await Promise.all([
          quotationService.getAll(),
          vendorService.getAll()
        ]);
        
        // Filter quotes for this RFQ and attach vendor info + scores
        const rfqQuotes = allQuotes
          .filter(q => q.rfqId === id && q.status !== 'Draft')
          .map(q => {
            const vendor = vendors.find(v => v.id === q.vendorId);
            return { ...q, vendor };
          });

        // Calculate scores
        const scoredQuotes = rfqQuotes.map(q => {
          const scoring = calculateQuotationScore(q, rfqQuotes);
          return { ...q, ...scoring };
        }).sort((a, b) => b.score - a.score);

        setQuotations(scoredQuotes);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, [id, user, navigate]);

  const handleForwardForApproval = async () => {
    if (!selectedQuoteId) return alert('Please select a quotation to forward.');
    if (!justification) return alert('Please provide a justification for this recommendation.');

    const selectedQuote = quotations.find(q => q.id === selectedQuoteId);

    try {
      // 1. Update quotation status to 'Under Review' (Procurement -> Manager)
      await quotationService.update(selectedQuote.id, { status: 'Under Review' });
      
      // 2. Create approval record
      const newApproval = {
        rfqId: rfq.id,
        quotationId: selectedQuote.id,
        vendorId: selectedQuote.vendorId,
        recommendedScore: selectedQuote.score,
        recommendedBy: user.id,
        justification: justification,
        status: 'Pending',
        createdAt: new Date().toISOString(),
        remarks: ''
      };
      await approvalService.create(newApproval);

      // 3. Update RFQ status
      await rfqService.update(rfq.id, { status: 'Under Review' });

      // 4. Log activity
      await activityLogService.create({ action: 'Forwarded for Approval', details: `Quotation ${selectedQuote.id} forwarded to Managers.`, status: 'info', module: 'Approvals', role: user.role, userId: user.id, ipAddress: '127.0.0.1' });

      alert('Successfully forwarded for approval!');
      navigate('/rfqs');
    } catch (e) {
      console.error(e);
      alert('Failed to forward for approval.');
    }
  };

  if (!rfq) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <Button variant="secondary" onClick={() => navigate('/rfqs')}><ArrowLeft size={18} /></Button>
          <div>
            <h1>Compare Quotations: {rfq.title}</h1>
            <p className="text-muted">Evaluate responses and recommend a vendor.</p>
          </div>
        </div>
      </div>

      <Card className="comparison-matrix-card">
        {quotations.length === 0 ? (
          <div className="empty-state">No submitted quotations found for this RFQ yet.</div>
        ) : (
          <div className="matrix-scroll-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Criteria</th>
                  {quotations.map(q => (
                    <th key={q.id} className={selectedQuoteId === q.id ? 'highlight-col' : ''}>
                      <div className="vendor-header-col">
                        <strong>{q.vendor?.companyName}</strong>
                        <div className="score-badge">Score: {q.score}</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total Price</td>
                  {quotations.map(q => (
                    <td key={q.id} className={selectedQuoteId === q.id ? 'highlight-col' : ''}>
                      ${Number(q.finalAmount).toLocaleString()} {q.currency}
                      {q.isLowestPrice && <Badge variant="success" className="ml-2"><CheckCircle size={12}/> Best Price</Badge>}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Delivery Time</td>
                  {quotations.map(q => (
                    <td key={q.id} className={selectedQuoteId === q.id ? 'highlight-col' : ''}>
                      {q.deliveryDays} Days
                      {q.isFastestDelivery && <Badge variant="info" className="ml-2"><Zap size={12}/> Fastest</Badge>}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Vendor Rating</td>
                  {quotations.map(q => (
                    <td key={q.id} className={selectedQuoteId === q.id ? 'highlight-col' : ''}>
                      {q.vendor?.rating} / 5
                      {q.isTopRated && <Badge variant="warning" className="ml-2"><Star size={12}/> Top Rated</Badge>}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Warranty & Terms</td>
                  {quotations.map(q => (
                    <td key={q.id} className={selectedQuoteId === q.id ? 'highlight-col' : ''}>
                      <div style={{fontSize: '0.85rem'}}>
                        <div>W: {q.warranty || 'N/A'}</div>
                        <div className="text-muted">P: {q.paymentTerms || 'N/A'}</div>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Action</td>
                  {quotations.map(q => (
                    <td key={q.id} className={selectedQuoteId === q.id ? 'highlight-col' : ''}>
                      <input 
                        type="radio" 
                        name="selectedQuote" 
                        checked={selectedQuoteId === q.id}
                        onChange={() => setSelectedQuoteId(q.id)}
                        disabled={rfq.status !== 'Open'}
                      /> Select
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedQuoteId && rfq.status === 'Open' && (
        <Card style={{marginTop: '1.5rem'}} className="forward-approval-card">
          <h3 className="section-title">Recommendation Engine</h3>
          
          <div className="ai-reasoning-card" style={{
            background: 'rgba(59, 130, 246, 0.1)', 
            border: '1px solid rgba(59, 130, 246, 0.3)', 
            padding: '1.25rem', 
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start',
            marginBottom: '1.5rem'
          }}>
            <Sparkles size={20} style={{marginTop: '2px', color: '#3b82f6', flexShrink: 0}} />
            <div>
              <h4 style={{margin: '0 0 0.5rem 0', color: '#3b82f6', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px'}}>AI Analysis</h4>
              <p style={{margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.5'}}>
                {quotations.find(q => q.id === selectedQuoteId)?.reasoning}
              </p>
            </div>
          </div>

          <p>You have selected <strong>{quotations.find(q => q.id === selectedQuoteId)?.vendorName}</strong>. Please provide a brief justification for this choice before forwarding to management.</p>
          <div style={{marginTop: '1rem'}}>
            <textarea 
              className="input-field w-full" 
              rows={3} 
              placeholder="e.g. Recommended due to best price and excellent past rating."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            ></textarea>
          </div>
          <div style={{marginTop: '1rem', display: 'flex', justifyContent: 'flex-end'}}>
            <Button variant="primary" onClick={handleForwardForApproval}>
              Forward to Manager for Approval
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ComparisonMatrix;
