// Role Codes — must match backend RoleEntity.roleCode
export const ROLES = {
  LOAN_OFFICER: 'LOAN_OFFICER',
  CREDIT_ANALYST: 'CREDIT_ANALYST',
  CREDIT_MANAGER: 'CREDIT_MANAGER',
  BRANCH_MANAGER: 'BRANCH_MANAGER',
  REGIONAL_MANAGER: 'REGIONAL_MANAGER',
  CHIEF_CREDIT_OFFICER: 'CHIEF_CREDIT_OFFICER',
  RISK_MANAGER: 'RISK_MANAGER',
  COMPLIANCE_OFFICER: 'COMPLIANCE_OFFICER',
  OPERATIONS_MANAGER: 'OPERATIONS_MANAGER',
  ADMIN: 'ADMIN',
}

// Convenience group: all roles that can approve loans
export const APPROVER_ROLES = [
  ROLES.CREDIT_MANAGER,
  ROLES.BRANCH_MANAGER,
  ROLES.REGIONAL_MANAGER,
  ROLES.CHIEF_CREDIT_OFFICER,
]

// Convenience group: senior management (branch and above)
export const MANAGEMENT_ROLES = [
  ROLES.BRANCH_MANAGER,
  ROLES.REGIONAL_MANAGER,
  ROLES.CHIEF_CREDIT_OFFICER,
  ROLES.ADMIN,
]

// Loan Status Codes — must match LoanStatusEnums from backend
export const LOAN_STATUS = {
  INITIATED: 'INITIATED',
  UNDER_ASSESSMENT: 'UNDER_ASSESSMENT',
  UNDER_REVIEW: 'UNDER_REVIEW',
  MANUAL_REVIEW: 'MANUAL_REVIEW',
  DOCUMENTS_PENDING: 'DOCUMENTS_PENDING',
  DOCUMENTS_VERIFIED: 'DOCUMENTS_VERIFIED',
  APPROVED: 'APPROVED',
  DISBURSED: 'DISBURSED',
  ACTIVE: 'ACTIVE',
  OVERDUE: 'OVERDUE',
  NPA: 'NPA',
  REJECTED: 'REJECTED',
  CLOSED: 'CLOSED',
}

// EMI Status Codes
export const EMI_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  OVERDUE: 'OVERDUE',
}

// Document Status Codes
export const DOCUMENT_STATUS = {
  UPLOADED: 'UPLOADED',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
}

// Payment Status Codes
export const PAYMENT_STATUS = {
  SUCCESS: 'SUCCESS',
  PENDING: 'PENDING',
  FAILED: 'FAILED',
  BOUNCED: 'BOUNCED',
}

// Payment Modes
export const PAYMENT_MODES = [
  { label: 'NACH', value: 'NACH' },
  { label: 'UPI', value: 'UPI' },
  { label: 'NEFT', value: 'NEFT' },
  { label: 'RTGS', value: 'RTGS' },
  { label: 'Cash', value: 'CASH' },
  { label: 'Cheque', value: 'CHEQUE' },
]

// Employment Types
export const EMPLOYMENT_TYPES = [
  { label: 'Salaried', value: 'SALARIED' },
  { label: 'Self Employed', value: 'SELF_EMPLOYED' },
]

// Collateral Types
export const COLLATERAL_TYPES = [
  { label: 'Property', value: 'PROPERTY' },
  { label: 'Vehicle', value: 'VEHICLE' },
  { label: 'Gold', value: 'GOLD' },
]

// Approval Actions
export const APPROVAL_ACTIONS = {
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
}

// DPD Bucket Labels
export const DPD_BUCKETS = [
  { key: 'current', label: 'Current (0 DPD)', range: '0' },
  { key: 'dpd30', label: '1-30 DPD', range: '1-30' },
  { key: 'dpd60', label: '31-60 DPD', range: '31-60' },
  { key: 'dpd90', label: '61-90 DPD', range: '61-90' },
  { key: 'npa', label: 'NPA (90+ DPD)', range: '90+' },
]

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100']
