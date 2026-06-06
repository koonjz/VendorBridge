import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { invoiceService } from '../../services/invoices';
import { poService } from '../../services/purchaseOrders';
import { vendorService } from '../../services/vendors';
import { activityLogService } from '../../services/activityLogs';
import { generateDocumentNumber } from '../../utils/finance';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import { ArrowLeft, Save } from 'lucide-react';

const InvoiceForm = () => {
  const { poId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [po, setPo] = useState(null);
  const [vendor, setVendor] = useState(null);
  
  const [formData, setFormData] = useState({
    invoiceNumber: generateDocumentNumber('INV'),
    billingDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0], // 30 days default
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const targetPo = await poService.getById(poId);
        if (!targetPo) return navigate('/purchase-orders');
        
        setPo(targetPo);
        const vendorData = await vendorService.getById(targetPo.vendorId);
        setVendor(vendorData);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, [poId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newInvoice = {
      invoiceNumber: formData.invoiceNumber,
      purchaseOrderId: po.id,
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      billingDate: formData.billingDate,
      dueDate: formData.dueDate,
      items: po.items, // auto-populating items from PO
      subtotal: po.subtotal,
      tax: po.tax,
      discount: po.discount,
      grandTotal: po.total,
      status: 'Draft',
      sent: false,
      createdAt: new Date().toISOString()
    };

    try {
      const createdInv = await invoiceService.create(newInvoice);
      await activityLogService.create({ action: 'Invoice Generated', details: `Invoice ${createdInv.invoiceNumber} generated for PO ${po.id}.`, status: 'info', module: 'Invoices', role: user.role, userId: user.id, ipAddress: '127.0.0.1' });
      navigate(`/invoices/${createdInv.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  if (!po) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <Button variant="secondary" onClick={() => navigate('/purchase-orders')}><ArrowLeft size={18} /></Button>
          <div>
            <h1>Generate Invoice</h1>
            <p className="text-muted">Auto-populating from PO: {po.id}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <h3 className="section-title">Invoice Details</h3>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem'}}>
            <Input label="Invoice Number" value={formData.invoiceNumber} onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})} required />
            <Input label="Vendor" value={po.vendorName} disabled />
          </div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem'}}>
            <Input label="Billing Date" type="date" value={formData.billingDate} onChange={(e) => setFormData({...formData, billingDate: e.target.value})} required />
            <Input label="Due Date" type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} required />
          </div>

          <div style={{background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
            <h4 style={{marginBottom: '1rem', color: 'var(--text-primary)'}}>Auto-populated Totals</h4>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
              <span>Subtotal:</span>
              <span>${po.subtotal.toLocaleString()}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
              <span>Tax:</span>
              <span>${po.tax.toLocaleString()}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
              <span>Discount:</span>
              <span>${po.discount.toLocaleString()}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--success)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem'}}>
              <span>Grand Total:</span>
              <span>${po.total.toLocaleString()}</span>
            </div>
          </div>

          <div style={{marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end'}}>
            <Button type="submit" variant="primary">
              <Save size={18} /> Generate & Preview Invoice
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default InvoiceForm;
