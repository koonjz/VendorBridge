import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { invoiceService } from '../../services/invoices';
import { vendorService } from '../../services/vendors';
import { activityLogService } from '../../services/activityLogs';
import Card from '../../components/UI/Card';
import Badge from '../../components/UI/Badge';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import { ArrowLeft, Printer, Download, Mail, CheckCircle } from 'lucide-react';
import './Invoices.css';

const InvoiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [invoice, setInvoice] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const targetInv = await invoiceService.getById(id);
        if (!targetInv) return navigate('/invoices');
        
        const vId = user?.vendorId || user?.id;
        if (user?.role === 'Vendor' && targetInv.vendorId !== vId) {
          return navigate('/invoices');
        }
        
        setInvoice(targetInv);
        const vendorData = await vendorService.getById(targetInv.vendorId);
        setVendor(vendorData);
      } catch (e) {
        console.error(e);
        navigate('/invoices');
      }
    };
    fetchData();
  }, [id, user, navigate]);

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    setSending(true);
    try {
      await invoiceService.update(invoice.id, { status: 'Sent', sent: true, sentAt: new Date().toISOString() });
      await activityLogService.create({ action: 'Invoice Sent', details: `Invoice ${invoice.invoiceNumber} sent to ${vendor?.companyName}.`, status: 'success', module: 'Invoices', role: user.role, userId: user.id, ipAddress: '127.0.0.1' });
      setInvoice({ ...invoice, status: 'Sent', sent: true, sentAt: new Date().toISOString() });
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
      setShowEmailModal(false);
    }
  };

  const handleMarkPaid = async () => {
    if(window.confirm('Mark this invoice as Paid?')) {
      try {
        await invoiceService.update(invoice.id, { status: 'Paid' });
        await activityLogService.create({ action: 'Payment Received', details: `Invoice ${invoice.invoiceNumber} marked as Paid.`, status: 'success', module: 'Invoices', role: user.role, userId: user.id, ipAddress: '127.0.0.1' });
        setInvoice({ ...invoice, status: 'Paid' });
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (!invoice) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header no-print">
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <Button variant="secondary" onClick={() => navigate('/invoices')}><ArrowLeft size={18} /></Button>
          <div>
            <h1>Invoice: {invoice.invoiceNumber}</h1>
            <p className="text-muted">PO Reference: {invoice.purchaseOrderId}</p>
          </div>
        </div>
        <div className="invoice-actions" style={{display: 'flex', gap: '0.75rem'}}>
          {invoice.status === 'Draft' && user?.role !== 'Vendor' && (
            <Button variant="primary" onClick={() => setShowEmailModal(true)}>
              <Mail size={18} /> Send to Vendor
            </Button>
          )}
          {invoice.status === 'Sent' && user?.role !== 'Vendor' && (
            <Button variant="success" className="bg-success" onClick={handleMarkPaid}>
              <CheckCircle size={18} /> Mark as Paid
            </Button>
          )}
          <Button variant="secondary" onClick={handlePrint}><Printer size={18} /> Print</Button>
          <Button variant="secondary"><Download size={18} /> PDF</Button>
        </div>
      </div>

      <div className="invoice-document-wrapper printable-area">
        <div className="invoice-paper">
          
          <div className="invoice-header">
            <div className="company-logo-block">
              <div className="logo-placeholder">VB</div>
              <div className="company-info">
                <h2>VendorBridge Inc.</h2>
                <p>123 Enterprise Way, Tech District</p>
                <p>San Francisco, CA 94105</p>
                <p>contact@vendorbridge.com</p>
              </div>
            </div>
            <div className="invoice-meta-block">
              <h1 className="document-title">INVOICE</h1>
              <div className="meta-grid">
                <div className="meta-label">Invoice #</div>
                <div className="meta-value">{invoice.invoiceNumber}</div>
                
                <div className="meta-label">Date</div>
                <div className="meta-value">{new Date(invoice.billingDate).toLocaleDateString()}</div>
                
                <div className="meta-label">Due Date</div>
                <div className="meta-value">{new Date(invoice.dueDate).toLocaleDateString()}</div>
                
                <div className="meta-label">PO Ref</div>
                <div className="meta-value">{invoice.purchaseOrderId}</div>
              </div>
              <div style={{marginTop: '1rem', display: 'flex', justifyContent: 'flex-end'}}>
                <Badge variant={invoice.status === 'Paid' ? 'success' : invoice.status === 'Sent' ? 'info' : 'default'} style={{fontSize: '1rem', padding: '0.5rem 1rem'}}>
                  {invoice.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          <div className="invoice-addresses">
            <div className="address-block">
              <h3 className="address-title">Bill To:</h3>
              <p><strong>{vendor?.companyName}</strong></p>
              <p>{vendor?.contactPerson}</p>
              <p>{vendor?.address}</p>
              <p>{vendor?.country}</p>
              <p>{vendor?.email}</p>
            </div>
            <div className="address-block">
              <h3 className="address-title">Ship To:</h3>
              <p><strong>VendorBridge Headquarters</strong></p>
              <p>Attn: Procurement Department</p>
              <p>123 Enterprise Way</p>
              <p>San Francisco, CA 94105</p>
            </div>
          </div>

          <div className="invoice-items-section">
            <table className="invoice-table">
              <thead>
                <tr>
                  <th className="col-desc">Description</th>
                  <th className="col-qty">Qty</th>
                  <th className="col-price">Unit Price</th>
                  <th className="col-total">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items && invoice.items.map(item => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td className="center-text">{item.quantity}</td>
                    <td className="right-text">${Number(item.unitPrice).toLocaleString()}</td>
                    <td className="right-text">${(item.quantity * item.unitPrice).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="invoice-financials">
            <div className="qr-code-section">
              <div className="qr-placeholder">
                <span style={{fontSize: '0.6rem'}}>QR SCAN TO PAY</span>
              </div>
              <p className="payment-instructions">
                <strong>Payment Instructions:</strong><br/>
                Please make checks payable to VendorBridge Inc.<br/>
                Direct Transfer: Routing #123456789, Acct #987654321
              </p>
            </div>
            <div className="totals-section">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>${Number(invoice.subtotal).toLocaleString()}</span>
              </div>
              <div className="total-row">
                <span>Tax:</span>
                <span>${Number(invoice.tax).toLocaleString()}</span>
              </div>
              <div className="total-row">
                <span>Discount:</span>
                <span>-${Number(invoice.discount).toLocaleString()}</span>
              </div>
              <div className="total-row grand-total">
                <span>Total Due:</span>
                <span>${Number(invoice.grandTotal).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="invoice-footer">
            <div className="signature-section">
              <div className="signature-line"></div>
              <p>Authorized Signature</p>
            </div>
            <p className="footer-text">Thank you for your business! For any inquiries regarding this invoice, please contact procurement@vendorbridge.com.</p>
          </div>

        </div>
      </div>

      <Modal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} title="Send Invoice via Email">
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <div className="input-group">
            <label className="input-label">To:</label>
            <input type="text" className="input-field" value={vendor?.email || 'vendor@example.com'} readOnly />
          </div>
          <div className="input-group">
            <label className="input-label">Subject:</label>
            <input type="text" className="input-field" value={`Invoice ${invoice.invoiceNumber} from VendorBridge`} readOnly />
          </div>
          <div className="input-group">
            <label className="input-label">Message:</label>
            <textarea className="input-field" rows={5} defaultValue={`Dear ${vendor?.contactPerson || 'Vendor'},\n\nPlease find attached Invoice ${invoice.invoiceNumber} for Purchase Order ${invoice.purchaseOrderId}.\n\nTotal Due: $${invoice.grandTotal.toLocaleString()}\nDue Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n\nThank you,\nVendorBridge Procurement Team`}></textarea>
          </div>
          <div style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem'}}>
            <Button variant="secondary" onClick={() => setShowEmailModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSendEmail} disabled={sending}>
              {sending ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default InvoiceDetails;
