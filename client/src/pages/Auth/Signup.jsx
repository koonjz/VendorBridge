import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import './Auth.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Vendor',
    vendorId: '' // Will be generated if Vendor
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const roles = ['Admin', 'Procurement Officer', 'Manager', 'Vendor'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Auto-generate vendor ID if role is vendor
    const dataToSubmit = { ...formData };
    if (dataToSubmit.role === 'Vendor') {
      dataToSubmit.vendorId = 'v_' + Math.random().toString(36).substr(2, 6);
    } else {
      delete dataToSubmit.vendorId;
    }

    const result = await register(dataToSubmit);
    if (result.success) {
      alert('Registration successful! Please login.');
      navigate('/login');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-background"></div>
      <Card className="auth-card">
        <div className="auth-header">
          <div className="logo-icon-large">VB</div>
          <h2>Create Account</h2>
          <p>Join VendorBridge Procurement ERP</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <Input 
            label="Full Name" 
            name="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <Input 
            label="Email Address" 
            name="email"
            type="email" 
            placeholder="name@company.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
          
          <div className="input-group">
            <label className="input-label">Role</label>
            <select 
              name="role" 
              className="input-field" 
              value={formData.role} 
              onChange={handleChange}
            >
              {roles.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <Input 
            label="Password" 
            name="password"
            type="password" 
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
          />
          
          <Button type="submit" className="w-full mt-4" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </Button>
          
          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Sign in here</Link></p>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Signup;
