import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { poService } from '../../services/purchaseOrders';
import { approvalService } from '../../services/approvals';
import { rfqService } from '../../services/rfqs';
import { vendorService } from '../../services/vendors';
import { quotationService } from '../../services/quotations';
import { activityLogService } from '../../services/activityLogs';
import { generateDocumentNumber, calculateTotals } from '../../utils/finance';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import { ArrowLeft, Save } from 'lucide-react';
import './PurchaseOrders.css';

const POForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [approvedQuotations, setApprovedQuotations] = useState([]);
  const [selectedApprovalId, setSelectedApprovalId] = useState('');
  
  const [poData, setPoData] = useState({
    id: generateDocumentNumber('PO'),
    issueDate: new Date().toISOString().split('T')[0],
    expectedDelivery: '',
    items: [{ id: 1, description: '', quantity: 1, unitPrice: 0 }],
    tax: 0,
    discount: 0,
    notes: 'Please quote PO number on all correspondence.'
  });

  const [totals, setTotals] = useState({ subtotal: 0, total: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allApprovals, existingPos, rfqs, vendors, quotes] = await Promise.all([
          approvalService.getAll(),
          poService.getAll(),
          rfqService.getAll(),
          vendorService.getAll(),
          quotationService.getAll()
        ]);

        const approvals = allApprovals.filter(a => a.status === 'Approved');
        const pendingPOApprovals = approvals.filter(a => !existingPos.find(po => po.approvalId === a.id));

        const mapped = pendingPOApprovals.map(a => {
          const rfq = rfqs.find(r => r.id === a.rfqId);
          const vendor = vendors.find(v => v.id === a.vendorId);
          const quote = quotes.find(q => q.id === a.quotationId);
          return { ...a, rfq, vendor, quote };
        });

        setApprovedQuotations(mapped);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setTotals(calculateTotals(poData.items, poData.tax, poData.discount));
  }, [poData.items, poData.tax, poData.discount]);

  const handleApprovalSelection = (e) => {
    const approvalId = e.target.value;
    setSelectedApprovalId(approvalId);
    
    const selection = approvedQuotations.find(a => a.id === approvalId);
    if (selection) {
      setPoData({
        ...poData,
        expectedDelivery: selection.quote.expectedDeliveryDate || '',
        tax: selection.quote.tax || 0,
        discount: selection.quote.discount || 0,
        items: [{
          id: 1,
          description: `${selection.rfq.title} - As per Quotation ${selection.quote.id}`,
          quantity: selection.rfq.quantity,
          unitPrice: (selection.quote.price / selection.rfq.quantity).toFixed(2)
        }]
      });
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...poData.items];
    newItems[index][field] = value;
    setPoData({ ...poData, items: newItems });
  };

  const addItem = () => {
    setPoData({
      ...poData,
      items: [...poData.items, { id: Date.now(), description: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = poData.items.filter((_, i) => i !== index);
    setPoData({ ...poData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApprovalId) return alert('Please select an approved quotation source.');

    const selection = approvedQuotations.find(a => a.id === selectedApprovalId);

    const payload = {
      ...poData,
      rfqId: selection.rfqId,
      quotationId: selection.quotationId,
      approvalId: selection.id,
      vendorId: selection.vendorId,
      vendorName: selection.vendor.companyName,
      status: 'Issued',
      subtotal: totals.subtotal,
      total: totals.total,
      createdAt: new Date().toISOString()
    };

    try {
      await poService.create(payload);
      await activityLogService.create({ action: 'Purchase Order Issued', details: `PO ${payload.id} issued to ${payload.vendorName}.`, status: 'success', module: 'Purchase Orders', role: user.role, userId: user.id, ipAddress: '127.0.0.1' });
      navigate('/purchase-orders');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <Button variant="secondary" onClick={() => navigate('/purchase-orders')}><ArrowLeft size={18} /></Button>
          <div>
            <h1>Create Purchase Order</h1>
            <p className="text-muted">Generate a PO from an approved quotation.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <h3 className="section-title">PO Source</h3>
          <div className="input-group">
            <label className="input-label">Select Approved Quotation</label>
            <select className="input-field w-full" value={selectedApprovalId} onChange={handleApprovalSelection} required>
              <option value="">-- Select --</option>
              {approvedQuotations.map(a => (
                <option key={a.id} value={a.id}>
                  {a.rfq.title} - {a.vendor.companyName} (Approval: {a.id})
                </option>
              ))}
            </select>
          </div>
        </Card>

        {selectedApprovalId && (
          <div className="po-form-grid" style={{marginTop: '1.5rem'}}>
            <Card>
              <h3 className="section-title">General Information</h3>
              <div className="form-row-2">
                <Input label="PO Number" value={poData.id} disabled />
                <Input label="Issue Date" type="date" value={poData.issueDate} onChange={(e) => setPoData({...poData, issueDate: e.target.value})} required />
              </div>
              <div className="form-row-2">
                <Input label="Expected Delivery" type="date" value={poData.expectedDelivery} onChange={(e) => setPoData({...poData, expectedDelivery: e.target.value})} required />
              </div>
            </Card>

            <Card>
              <h3 className="section-title">Line Items</h3>
              {poData.items.map((item, index) => (
                <div key={item.id} className="po-line-item">
                  <Input 
                    placeholder="Description" 
                    value={item.description} 
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)} 
                    required 
                    style={{flex: 2}}
                  />
                  <Input 
                    type="number" 
                    placeholder="Qty" 
                    value={item.quantity} 
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} 
                    required 
                    style={{flex: 0.5}}
                  />
                  <Input 
                    type="number" 
                    placeholder="Unit Price" 
                    value={item.unitPrice} 
                    onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} 
                    required 
                    style={{flex: 1}}
                  />
                  <Button type="button" variant="secondary" onClick={() => removeItem(index)} className="text-danger">X</Button>
                </div>
              ))}
              <Button type="button" variant="secondary" size="sm" onClick={addItem} style={{marginTop: '0.5rem'}}>+ Add Item</Button>

              <div className="financial-summary" style={{marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem'}}>
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>${totals.subtotal.toLocaleString()}</span>
                </div>
                <div className="summary-row" style={{alignItems: 'center'}}>
                  <span>Tax Amount:</span>
                  <input type="number" className="input-field" style={{width: '100px', padding: '0.25rem'}} value={poData.tax} onChange={(e) => setPoData({...poData, tax: e.target.value})} />
                </div>
                <div className="summary-row" style={{alignItems: 'center'}}>
                  <span>Discount:</span>
                  <input type="number" className="input-field" style={{width: '100px', padding: '0.25rem'}} value={poData.discount} onChange={(e) => setPoData({...poData, discount: e.target.value})} />
                </div>
                <div className="summary-row final-total">
                  <span>Grand Total:</span>
                  <span>${totals.total.toLocaleString()}</span>
                </div>
              </div>
            </Card>

            <Card className="full-width">
              <h3 className="section-title">Additional Notes</h3>
              <textarea className="input-field w-full" rows={3} value={poData.notes} onChange={(e) => setPoData({...poData, notes: e.target.value})}></textarea>
            </Card>
          </div>
        )}

        <div style={{marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end'}}>
          <Button type="submit" variant="primary" disabled={!selectedApprovalId}>
            <Save size={18} /> Issue Purchase Order
          </Button>
        </div>
      </form>
    </div>
  );
};

export default POForm;
