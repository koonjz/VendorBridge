import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { rfqService } from '../../services/rfqs';
import { vendorService } from '../../services/vendors';
import { activityLogService } from '../../services/activityLogs';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Badge from '../../components/UI/Badge';
import { ArrowLeft, Save } from 'lucide-react';
import './RFQs.css';

const RfqForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    quantity: '',
    unit: '',
    budget: '',
    priority: 'Medium',
    deadline: '',
    status: 'Draft',
    assignedVendorIds: [],
    notes: ''
  });

  const [activeVendors, setActiveVendors] = useState([]);
  const [vendorSearch, setVendorSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allVendors = await vendorService.getAll();
        setActiveVendors(allVendors.filter(v => v.status === 'Active'));

        if (isEditMode) {
          const foundRfq = await rfqService.getById(id);
          if (foundRfq) {
            setFormData(foundRfq);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVendorToggle = (vendorId) => {
    const isSelected = formData.assignedVendorIds.includes(vendorId);
    let updatedVendors;
    if (isSelected) {
      updatedVendors = formData.assignedVendorIds.filter(vId => vId !== vendorId);
    } else {
      updatedVendors = [...formData.assignedVendorIds, vendorId];
    }
    setFormData({ ...formData, assignedVendorIds: updatedVendors });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await rfqService.update(id, formData);
        await activityLogService.create({ action: 'RFQ Updated', details: `RFQ ${id} (${formData.title}) was updated by ${user.name}.`, status: 'info', module: 'RFQs', role: 'System', userId: 'System', ipAddress: '127.0.0.1' });
      } else {
        const newRfq = {
          ...formData,
          createdAt: new Date().toISOString(),
          createdBy: user.id,
        };
        const createdRfq = await rfqService.create(newRfq);
        await activityLogService.create({ action: 'RFQ Created', details: `${createdRfq.title} was created by ${user.name}.`, status: 'success', module: 'RFQs', role: 'System', userId: 'System', ipAddress: '127.0.0.1' });
      }
      navigate('/rfqs');
    } catch (e) {
      console.error(e);
    }
  };

  const filteredVendorOptions = activeVendors.filter(v => 
    v.companyName.toLowerCase().includes(vendorSearch.toLowerCase()) || 
    v.category.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <Button variant="secondary" onClick={() => navigate('/rfqs')}><ArrowLeft size={18} /></Button>
          <div>
            <h1>{isEditMode ? `Edit RFQ: ${formData.id}` : 'Create New RFQ'}</h1>
            <p className="text-muted">Fill out the request details and assign vendors.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rfq-form-layout">
        <div className="rfq-form-main">
          <Card>
            <h3 className="section-title">General Information</h3>
            <div className="form-group-vertical">
              <Input label="RFQ Title" name="title" value={formData.title} onChange={handleChange} required />
              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea className="input-field" name="description" rows={4} value={formData.description} onChange={handleChange} required></textarea>
              </div>
              <div className="form-row-3">
                <Input label="Category" name="category" value={formData.category} onChange={handleChange} required />
                <Input label="Quantity" type="number" name="quantity" value={formData.quantity} onChange={handleChange} required />
                <Input label="Unit" name="unit" placeholder="e.g., Laptops, Kg, Pieces" value={formData.unit} onChange={handleChange} required />
              </div>
            </div>
          </Card>

          <Card style={{marginTop: '1.5rem'}}>
            <h3 className="section-title">Procurement Requirements</h3>
            <div className="form-row-3">
              <Input label="Estimated Budget ($)" type="number" name="budget" value={formData.budget} onChange={handleChange} required />
              <div className="input-group">
                <label className="input-label">Priority</label>
                <select name="priority" className="input-field" value={formData.priority} onChange={handleChange}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <Input label="Deadline" type="date" name="deadline" value={formData.deadline} onChange={handleChange} required />
            </div>
            <div className="input-group" style={{marginTop: '1rem'}}>
              <label className="input-label">Additional Notes</label>
              <textarea className="input-field" name="notes" rows={3} value={formData.notes} onChange={handleChange}></textarea>
            </div>
          </Card>
        </div>

        <div className="rfq-form-sidebar">
          <Card>
            <h3 className="section-title">Status</h3>
            <div className="input-group">
              <select name="status" className="input-field" value={formData.status} onChange={handleChange}>
                <option value="Draft">Draft</option>
                <option value="Open">Open</option>
              </select>
            </div>
          </Card>

          <Card style={{marginTop: '1.5rem'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
              <h3 className="section-title" style={{margin: 0}}>Assign Vendors</h3>
              <Badge variant="info">{formData.assignedVendorIds.length} Selected</Badge>
            </div>
            <Input 
              placeholder="Search active vendors..." 
              value={vendorSearch} 
              onChange={(e) => setVendorSearch(e.target.value)} 
            />
            <div className="vendor-selection-list">
              {filteredVendorOptions.map(vendor => (
                <div 
                  key={vendor.id} 
                  className={`vendor-select-card ${formData.assignedVendorIds.includes(vendor.id) ? 'selected' : ''}`}
                  onClick={() => handleVendorToggle(vendor.id)}
                >
                  <div className="vendor-select-info">
                    <span className="vendor-select-name">{vendor.companyName}</span>
                    <span className="vendor-select-cat">{vendor.category}</span>
                  </div>
                  <div className={`vendor-checkbox ${formData.assignedVendorIds.includes(vendor.id) ? 'checked' : ''}`}>
                    {formData.assignedVendorIds.includes(vendor.id) && <div className="check-mark"></div>}
                  </div>
                </div>
              ))}
              {filteredVendorOptions.length === 0 && <p className="text-muted" style={{fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0'}}>No active vendors found.</p>}
            </div>
          </Card>

          <Button type="submit" variant="primary" className="w-full" style={{marginTop: '1.5rem'}}>
            <Save size={18} /> {isEditMode ? 'Save Changes' : 'Publish RFQ'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RfqForm;
