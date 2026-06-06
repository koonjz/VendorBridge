import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import Dashboard from './pages/Dashboard/Dashboard';
import VendorList from './pages/Vendors/VendorList';
import VendorDetails from './pages/Vendors/VendorDetails';
import RfqList from './pages/RFQs/RfqList';
import RfqForm from './pages/RFQs/RfqForm';
import RfqDetails from './pages/RFQs/RfqDetails';
import QuotationList from './pages/Quotations/QuotationList';
import QuotationForm from './pages/Quotations/QuotationForm';
import ComparisonMatrix from './pages/Approvals/ComparisonMatrix';
import ApprovalList from './pages/Approvals/ApprovalList';
import ApprovalDetails from './pages/Approvals/ApprovalDetails';
import POList from './pages/PurchaseOrders/POList';
import POForm from './pages/PurchaseOrders/POForm';
import PODetails from './pages/PurchaseOrders/PODetails';
import InvoiceList from './pages/Invoices/InvoiceList';
import InvoiceForm from './pages/Invoices/InvoiceForm';
import InvoiceDetails from './pages/Invoices/InvoiceDetails';
import Reports from './pages/Reports/Reports';
import Notifications from './pages/Notifications/Notifications';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Auth Route Wrapper (redirects to dashboard if already logged in)
const AuthRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Temporary Placeholder Component
const Placeholder = ({ title }) => (
  <div style={{ padding: '2rem' }}>
    <h2>{title}</h2>
    <p>This module is not yet implemented.</p>
  </div>
);

function AppContent() {
  return (
    <Routes>
      {/* Public / Auth Routes */}
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />

      {/* Protected ERP Routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="vendors" element={<VendorList />} />
        <Route path="vendors/:id" element={<VendorDetails />} />
        <Route path="rfqs" element={<RfqList />} />
        <Route path="rfqs/new" element={<RfqForm />} />
        <Route path="rfqs/:id" element={<RfqDetails />} />
        <Route path="rfqs/:id/edit" element={<RfqForm />} />
        <Route path="quotations" element={<QuotationList />} />
        <Route path="quotations/new/:rfqId" element={<QuotationForm />} />
        <Route path="rfqs/:id/compare" element={<ComparisonMatrix />} />
        <Route path="approvals" element={<ApprovalList />} />
        <Route path="approvals/:id" element={<ApprovalDetails />} />
        <Route path="purchase-orders" element={<POList />} />
        <Route path="purchase-orders/new" element={<POForm />} />
        <Route path="purchase-orders/:id" element={<PODetails />} />
        <Route path="invoices" element={<InvoiceList />} />
        <Route path="invoices/new/:poId" element={<InvoiceForm />} />
        <Route path="invoices/:id" element={<InvoiceDetails />} />
        <Route path="logs" element={<Notifications />} />
        <Route path="reports" element={<Reports />} />
      </Route>
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
