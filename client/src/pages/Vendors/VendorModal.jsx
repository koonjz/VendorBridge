import React, { useState, useEffect } from 'react';
import Modal from '../../components/UI/Modal';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';

const VendorModal = ({ isOpen, onClose, vendor, onSave }) => {
  const initialForm = {
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    gst: '',
    address: '',
    category: '',
    country: '',
    notes: '',
    status: 'Pending',
    rating: 0
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    if (vendor) {
      setFormData(vendor);
    } else {
      setFormData(initialForm);
    }
  }, [vendor, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={vendor ? "Edit Vendor" : "Add New Vendor"}>
      <form onSubmit={handleSubmit} className="vendor-form">
        <div className="form-row">
          <Input label="Company Name" name="companyName" value={formData.companyName} onChange={handleChange} required />
          <Input label="Contact Person" name="contactPerson" value={formData.contactPerson} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} required />
          <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <Input label="GST Number" name="gst" value={formData.gst} onChange={handleChange} required />
          <Input label="Category" name="category" value={formData.category} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <Input label="Country" name="country" value={formData.country} onChange={handleChange} required />
          <div className="input-group">
            <label className="input-label">Status</label>
            <select name="status" className="input-field" value={formData.status} onChange={handleChange}>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
        <Input label="Address" name="address" value={formData.address} onChange={handleChange} />
        <div className="input-group">
          <label className="input-label">Notes</label>
          <textarea className="input-field" name="notes" rows={3} value={formData.notes} onChange={handleChange}></textarea>
        </div>
        
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">{vendor ? "Update Vendor" : "Save Vendor"}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default VendorModal;
