import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import './Auth.css'; // Shared Auth CSS

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setError('');
      alert('If the email exists, a reset link has been sent.');
      setForgotMode(false);
    }, 1000);
  };

  return (
    <div className="auth-container">
      <div className="auth-background"></div>
      <Card className="auth-card">
        <div className="auth-header">
          <div className="logo-icon-large">VB</div>
          <h2>VendorBridge</h2>
          <p>{forgotMode ? 'Reset your password' : 'Sign in to your account'}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {!forgotMode ? (
          <form onSubmit={handleLogin} className="auth-form">
            <Input 
              label="Email Address" 
              type="email" 
              placeholder="name@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <div className="password-group">
              <Input 
                label="Password" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="button" className="forgot-link" onClick={() => setForgotMode(true)}>
                Forgot password?
              </button>
            </div>
            <Button type="submit" className="w-full mt-4" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <div className="auth-footer">
              <p>Don't have an account? <Link to="/signup">Register here</Link></p>
            </div>
            
            <div className="demo-credentials">
              <h4>Demo Credentials (pwd: password123)</h4>
              <p>Admin: admin@vendorbridge.com</p>
              <p>Officer: officer@vendorbridge.com</p>
              <p>Manager: manager@vendorbridge.com</p>
              <p>Vendor: contact@vendora.com</p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleForgotSubmit} className="auth-form">
            <Input 
              label="Email Address" 
              type="email" 
              placeholder="Enter your registered email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full mt-4" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
            <div className="auth-footer">
              <button type="button" className="forgot-link" onClick={() => setForgotMode(false)}>
                Back to login
              </button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default Login;
