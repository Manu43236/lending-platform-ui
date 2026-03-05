import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import AuthLayout from './layouts/AuthLayout'

// Auth
import Login from './pages/auth/Login'

// Dashboard
import Dashboard from './pages/dashboard'

// Customers
import Customers from './pages/customers'
import NewCustomer from './pages/customers/NewCustomer'
import CustomerDetail from './pages/customers/CustomerDetail'

// LOS
import Applications from './pages/los/Applications'
import NewLoan from './pages/los/NewLoan'
import LoanDetail from './pages/los/LoanDetail'
import CreditAssessments from './pages/los/CreditAssessments'
import Approvals from './pages/los/Approvals'
import LOSDisbursements from './pages/los/Disbursements'
import LOSDocuments from './pages/los/Documents'
import LOSCollaterals from './pages/los/Collaterals'

// LMS
import ActiveLoans from './pages/lms/ActiveLoans'
import EmiSchedule from './pages/lms/EmiSchedule'
import Payments from './pages/lms/Payments'
import LoanClosure from './pages/lms/LoanClosure'

// Disbursements
import Disbursements from './pages/disbursements'

// Collections
import OverdueLoans from './pages/collections/OverdueLoans'
import DPDBuckets from './pages/collections/DPDBuckets'
import Penalties from './pages/collections/Penalties'
import NPA from './pages/collections/NPA'

// Advices
import Receivables from './pages/advices/Receivables'
import Payables from './pages/advices/Payables'

// Fees
import Fees from './pages/fees'

// EOD
import EOD from './pages/eod'

// Reports
import DisbursementReport from './pages/reports/Disbursement'
import CollectionReport from './pages/reports/Collection'
import OutstandingReport from './pages/reports/Outstanding'
import DPDNpaReport from './pages/reports/DPDnpa'
import MISReport from './pages/reports/MIS'

// Admin
import AdminUsers from './pages/admin/Users'
import AdminRoles from './pages/admin/Roles'
import AdminMasters from './pages/admin/Masters'

const App = () => {
  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* App routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Customers */}
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/new" element={<NewCustomer />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />

        {/* LOS - Loan Origination */}
        <Route path="/los/applications" element={<Applications />} />
        <Route path="/los/applications/new" element={<NewLoan />} />
        <Route path="/los/applications/:loanNumber" element={<LoanDetail />} />
        <Route path="/los/credit-assessments" element={<CreditAssessments />} />
        <Route path="/los/approvals" element={<Approvals />} />
        <Route path="/los/disbursements" element={<LOSDisbursements />} />
        <Route path="/los/documents" element={<LOSDocuments />} />
        <Route path="/los/collaterals" element={<LOSCollaterals />} />

        {/* LMS - Loan Management */}
        <Route path="/lms/active-loans" element={<ActiveLoans />} />
        <Route path="/lms/emi-schedule" element={<EmiSchedule />} />
        <Route path="/lms/payments" element={<Payments />} />
        <Route path="/lms/closure" element={<LoanClosure />} />

        {/* Disbursements */}
        <Route path="/disbursements" element={<Disbursements />} />

        {/* Collections */}
        <Route path="/collections/overdue" element={<OverdueLoans />} />
        <Route path="/collections/dpd-buckets" element={<DPDBuckets />} />
        <Route path="/collections/penalties" element={<Penalties />} />
        <Route path="/collections/npa" element={<NPA />} />

        {/* Advices */}
        <Route path="/advices/receivables" element={<Receivables />} />
        <Route path="/advices/payables" element={<Payables />} />

        {/* Fees */}
        <Route path="/fees" element={<Fees />} />

        {/* EOD */}
        <Route path="/eod" element={<EOD />} />

        {/* Reports */}
        <Route path="/reports/disbursement" element={<DisbursementReport />} />
        <Route path="/reports/collection" element={<CollectionReport />} />
        <Route path="/reports/outstanding" element={<OutstandingReport />} />
        <Route path="/reports/dpd-npa" element={<DPDNpaReport />} />
        <Route path="/reports/mis" element={<MISReport />} />

        {/* Admin */}
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/roles" element={<AdminRoles />} />
        <Route path="/admin/masters" element={<AdminMasters />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
