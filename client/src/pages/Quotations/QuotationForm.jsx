import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { quotationService } from '../../services/quotations';
import { rfqService } from '../../services/rfqs';
import { activityLogService } from '../../services/activityLogs';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Badge from '../../components/UI/Badge';
import { ArrowLeft, Save, Send, AlertCircle } from 'lucide-react';
import './Quotations.css';

const QuotationForm = () => {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [rfq, setRfq] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [existingQuoteId, setExistingQuoteId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    price: '',
    currency: 'USD',
    tax: '',
    discount: '',
    deliveryDays: '',
    expectedDeliveryDate: '',
    warranty: '',
    paymentTerms: 'Net 30',
    notes: '',
    status: 'Draft'
  });

  useEffect(() => {
    if (user?.role !== 'Vendor') {
      navigate('/quotations');
      return;
    }

    const fetchData = async () => {
      try {
        const targetRfq = await rfqService.getById(rfqId);
        if (!targetRfq) {
          navigate('/dashboard');
          return;
        }
        setRfq(targetRfq);

        const isExpired = new Date() > new Date(targetRfq.deadline);
        if (targetRfq.status !== 'Open' || isExpired) {
          setIsReadOnly(true);
        }

        const quotes = await quotationService.getAll();
        const vId = user.vendorId || user.id;
        const existingQuote = quotes.find(q => q.rfqId === rfqId && q.vendorId === vId);
        
        if (existingQuote) {
          setExistingQuoteId(existingQuote.id);
          setFormData(existingQuote);
          if (existingQuote.status !== 'Draft' && existingQuote.status !== 'Submitted') {
            setIsReadOnly(true);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [rfqId, user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateFinal = () => {
    const price = parseFloat(formData.price) || 0;
    const tax = parseFloat(formData.tax) || 0;
    const discount = parseFloat(formData.discount) || 0;
    return price + tax - discount;
  };

  const saveQuotation = async (status) => {
    const finalAmount = calculateFinal();
    const vId = user.vendorId || user.id;
    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      tax: parseFloat(formData.tax) || 0,
      discount: parseFloat(formData.discount) || 0,
      finalAmount,
      rfqId,
      vendorId: vId,
      vendorName: user.name,
      status,
      updatedAt: new Date().toISOString()
    };

    try {
      if (existingQuoteId) {
        await quotationService.update(existingQuoteId, payload);
        if (status === 'Submitted') {
          await activityLogService.create({ action: 'Quotation Submitted', details: `${user.name} submitted quotation for ${rfqId}.`, status: 'success', module: 'Quotations', role: 'Vendor', userId: vId, ipAddress: '127.0.0.1' });
        } else {
          await activityLogService.create({ action: 'Quotation Draft Saved', details: `${user.name} updated draft for ${rfqId}.`, status: 'info', module: 'Quotations', role: 'Vendor', userId: vId, ipAddress: '127.0.0.1' });
        }
      } else {
        payload.submittedAt = new Date().toISOString();
        await quotationService.create(payload);
        
        if (status === 'Submitted') {
          await activityLogService.create({ action: 'Quotation Submitted', details: `${user.name} submitted quotation for ${rfqId}.`, status: 'success', module: 'Quotations', role: 'Vendor', userId: vId, ipAddress: '127.0.0.1' });
        }
      }
      navigate('/quotations');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveDraft = (e) => {
    e.preventDefault();
    saveQuotation('Draft');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if(window.confirm('Are you sure you want to submit this final quotation?')) {
      saveQuotation('Submitted');
    }
  };

  if (loading || !rfq) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <Button variant="secondary" onClick={() => navigate('/quotations')}><ArrowLeft size={18} /></Button>
          <div>
            <h1>{existingQuoteId ? `Quotation: ${existingQuoteId}` : 'Submit Quotation'}</h1>
            <p className="text-muted">Responding to RFQ: {rfq.title}</p>
          </div>
        </div>
      </div>

      {isReadOnly && (
        <div className="readonly-banner">
          <AlertCircle size={20} />
          <span>Quotation can no longer be modified. (RFQ Closed, Expired, or Quotation Locked)</span>
        </div>
      )}

      <form className="quote-form-layout">
        <div className="quote-form-main">
          <Card>
            <h3 className="section-title">Commercial Details</h3>
            <div className="form-row-2">
              <Input label="Total Price" type="number" name="price" value={formData.price} onChange={handleChange} required disabled={isReadOnly} />
              <div className="input-group">
                <label className="input-label">Currency</label>
                <select name="currency" className="input-field" value={formData.currency} onChange={handleChange} disabled={isReadOnly}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
            <div className="form-row-2">
              <Input label="Tax Amount" type="number" name="tax" value={formData.tax} onChange={handleChange} disabled={isReadOnly} />
              <Input label="Discount Amount" type="number" name="discount" value={formData.discount} onChange={handleChange} disabled={isReadOnly} />
            </div>
            <div className="final-amount-box">
              <span>Final Calculated Amount:</span>
              <strong>${calculateFinal().toLocaleString()} {formData.currency}</strong>
            </div>
          </Card>

          <Card style={{marginTop: '1.5rem'}}>
            <h3 className="section-title">Delivery & Additional Details</h3>
            <div className="form-row-2">
              <Input label="Delivery Time (Days)" type="number" name="deliveryDays" value={formData.deliveryDays} onChange={handleChange} required disabled={isReadOnly} />
              <Input label="Expected Delivery Date" type="date" name="expectedDeliveryDate" value={formData.expectedDeliveryDate} onChange={handleChange} required disabled={isReadOnly} />
            </div>
            <div className="form-row-2">
              <Input label="Warranty" name="warranty" placeholder="e.g. 1 Year" value={formData.warranty} onChange={handleChange} disabled={isReadOnly} />
              <Input label="Payment Terms" name="paymentTerms" placeholder="e.g. Net 30" value={formData.paymentTerms} onChange={handleChange} disabled={isReadOnly} />
            </div>
            <div className="input-group" style={{marginTop: '1rem'}}>
              <label className="input-label">Additional Notes</label>
              <textarea className="input-field" name="notes" rows={3} value={formData.notes} onChange={handleChange} disabled={isReadOnly}></textarea>
            </div>
          </Card>
        </div>

        <div className="quote-form-sidebar">
          <Card>
            <h3 className="section-title">RFQ Reference</h3>
            <div className="rfq-reference-info">
              <p><strong>ID:</strong> {rfq.id}</p>
              <p><strong>Quantity:</strong> {rfq.quantity} {rfq.unit}</p>
              <p><strong>Budget:</strong> ${Number(rfq.budget).toLocaleString()}</p>
              <p><strong>Deadline:</strong> {new Date(rfq.deadline).toLocaleDateString()}</p>
            </div>
          </Card>

          {!isReadOnly && (
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem'}}>
              <Button type="button" variant="secondary" className="w-full" onClick={handleSaveDraft}>
                <Save size={18} /> Save Draft
              </Button>
              <Button type="button" variant="primary" className="w-full" onClick={handleSubmit}>
                <Send size={18} /> Submit Final Quotation
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default QuotationForm;
