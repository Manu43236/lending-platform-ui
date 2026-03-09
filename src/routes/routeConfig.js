import { ROLES, APPROVER_ROLES, MANAGEMENT_ROLES } from '../utils/constants'

// null allowedRoles = accessible to all logged-in users
const routeConfig = [
  { path: '/dashboard', label: 'Dashboard', allowedRoles: null },

  // Customers
  { path: '/customers', label: 'Customers', allowedRoles: null },
  { path: '/customers/new', label: 'New Customer', allowedRoles: [ROLES.LOAN_OFFICER, ROLES.ADMIN] },
  { path: '/customers/:id', label: 'Customer Detail', allowedRoles: null },

  // LOS
  { path: '/los/applications', label: 'Loan Applications', allowedRoles: null },
  { path: '/los/applications/new', label: 'New Loan', allowedRoles: [ROLES.LOAN_OFFICER, ROLES.ADMIN] },
  { path: '/los/applications/:loanNumber', label: 'Loan Detail', allowedRoles: null },
  { path: '/los/credit-assessments', label: 'Credit Assessments', allowedRoles: [ROLES.CREDIT_ANALYST, ROLES.CREDIT_MANAGER, ROLES.ADMIN] },
  { path: '/los/approvals', label: 'Approvals', allowedRoles: APPROVER_ROLES },
  { path: '/los/documents', label: 'Documents', allowedRoles: null },
  { path: '/los/collaterals', label: 'Collaterals', allowedRoles: [ROLES.CREDIT_ANALYST, ROLES.RISK_MANAGER, ROLES.OPERATIONS_MANAGER, ROLES.ADMIN] },

  // LMS
  { path: '/lms/active-loans', label: 'Active Loans', allowedRoles: null },
  { path: '/lms/emi-schedule', label: 'EMI Schedule', allowedRoles: null },
  { path: '/lms/payments', label: 'Payments', allowedRoles: null },
  { path: '/lms/closure', label: 'Loan Closure', allowedRoles: MANAGEMENT_ROLES },

  // Disbursements
  { path: '/disbursements', label: 'Disbursements', allowedRoles: [ROLES.OPERATIONS_MANAGER, ROLES.ADMIN] },

  // Collections
  { path: '/collections/overdue', label: 'Overdue Loans', allowedRoles: null },
  { path: '/collections/dpd-buckets', label: 'DPD Buckets', allowedRoles: null },
  { path: '/collections/penalties', label: 'Penalties', allowedRoles: [ROLES.OPERATIONS_MANAGER, ROLES.RISK_MANAGER, ...MANAGEMENT_ROLES] },
  { path: '/collections/npa', label: 'NPA Accounts', allowedRoles: null },

  // Advices
  { path: '/advices/receivables', label: 'Receivables', allowedRoles: null },
  { path: '/advices/payables', label: 'Payables', allowedRoles: null },

  // Fees
  { path: '/fees', label: 'Fees & Charges', allowedRoles: null },

  // EOD
  { path: '/eod', label: 'EOD', allowedRoles: [ROLES.ADMIN] },

  // Reports
  { path: '/reports/disbursement', label: 'Disbursement Report', allowedRoles: [ROLES.RISK_MANAGER, ROLES.COMPLIANCE_OFFICER, ...MANAGEMENT_ROLES] },
  { path: '/reports/collection', label: 'Collection Report', allowedRoles: [ROLES.RISK_MANAGER, ROLES.COMPLIANCE_OFFICER, ...MANAGEMENT_ROLES] },
  { path: '/reports/outstanding', label: 'Outstanding Report', allowedRoles: [ROLES.RISK_MANAGER, ROLES.COMPLIANCE_OFFICER, ...MANAGEMENT_ROLES] },
  { path: '/reports/dpd-npa', label: 'DPD / NPA Report', allowedRoles: [ROLES.RISK_MANAGER, ROLES.COMPLIANCE_OFFICER, ...MANAGEMENT_ROLES] },
  { path: '/reports/mis', label: 'MIS Report', allowedRoles: [ROLES.RISK_MANAGER, ROLES.COMPLIANCE_OFFICER, ...MANAGEMENT_ROLES] },

  // Admin
  { path: '/admin/users', label: 'User Management', allowedRoles: [ROLES.ADMIN] },
  { path: '/admin/roles', label: 'Role Management', allowedRoles: [ROLES.ADMIN] },
  { path: '/admin/masters', label: 'Master Configuration', allowedRoles: [ROLES.ADMIN] },
]

export default routeConfig
