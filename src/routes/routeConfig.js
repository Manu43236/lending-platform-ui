import { ROLES } from '../utils/constants'

// null allowedRoles = accessible to all logged-in users
const routeConfig = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    allowedRoles: null,
  },

  // Customers
  { path: '/customers', label: 'Customers', allowedRoles: null },
  { path: '/customers/new', label: 'New Customer', allowedRoles: null },
  { path: '/customers/:id', label: 'Customer Detail', allowedRoles: null },

  // LOS
  {
    path: '/los/applications',
    label: 'Loan Applications',
    allowedRoles: null,
  },
  {
    path: '/los/new',
    label: 'New Loan Application',
    allowedRoles: [
      ROLES.LOAN_OFFICER,
      ROLES.BRANCH_MANAGER,
      ROLES.ADMIN,
    ],
  },
  {
    path: '/los/loans/:loanNumber',
    label: 'Loan Detail',
    allowedRoles: null,
  },

  // LMS
  { path: '/lms/active', label: 'Active Loans', allowedRoles: null },
  { path: '/lms/emi-schedule', label: 'EMI Schedule', allowedRoles: null },
  { path: '/lms/payments', label: 'Payments', allowedRoles: null },
  {
    path: '/lms/closure',
    label: 'Loan Closure',
    allowedRoles: [
      ROLES.OPERATIONS,
      ROLES.BRANCH_MANAGER,
      ROLES.ADMIN,
    ],
  },

  // Disbursements
  {
    path: '/disbursements',
    label: 'Disbursements',
    allowedRoles: [ROLES.OPERATIONS, ROLES.BRANCH_MANAGER, ROLES.ADMIN],
  },

  // Collections
  { path: '/collections/overdue', label: 'Overdue Loans', allowedRoles: null },
  { path: '/collections/dpd', label: 'DPD Buckets', allowedRoles: null },
  {
    path: '/collections/penalties',
    label: 'Penalties',
    allowedRoles: [ROLES.COLLECTIONS, ROLES.BRANCH_MANAGER, ROLES.ADMIN],
  },
  { path: '/collections/npa', label: 'NPA Accounts', allowedRoles: null },

  // Advices
  { path: '/advices/receivables', label: 'Receivables', allowedRoles: null },
  { path: '/advices/payables', label: 'Payables', allowedRoles: null },

  // Fees
  { path: '/fees', label: 'Fees & Charges', allowedRoles: null },

  // EOD
  {
    path: '/eod',
    label: 'EOD',
    allowedRoles: [ROLES.OPERATIONS, ROLES.ADMIN],
  },

  // Reports
  { path: '/reports/disbursement', label: 'Disbursement Report', allowedRoles: null },
  { path: '/reports/collection', label: 'Collection Report', allowedRoles: null },
  { path: '/reports/outstanding', label: 'Outstanding Report', allowedRoles: null },
  { path: '/reports/dpd-npa', label: 'DPD / NPA Report', allowedRoles: null },
  { path: '/reports/mis', label: 'MIS Report', allowedRoles: null },

  // Admin
  {
    path: '/admin/users',
    label: 'User Management',
    allowedRoles: [ROLES.ADMIN],
  },
  {
    path: '/admin/roles',
    label: 'Role Management',
    allowedRoles: [ROLES.ADMIN],
  },
  {
    path: '/admin/masters',
    label: 'Master Configuration',
    allowedRoles: [ROLES.ADMIN],
  },
]

export default routeConfig
