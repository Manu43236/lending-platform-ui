// Brand Colors
export const brand = {
  primary: '#1B3A6B',
  primaryLight: '#2E5FA3',
  primaryDark: '#122848',
  secondary: '#F0A500',
  secondaryLight: '#FFB930',
}

// Loan Status Colors — matches LoanStatusEnums from backend
export const loanStatusColors = {
  INITIATED: { color: '#595959', bg: '#f5f5f5', border: '#d9d9d9' },
  UNDER_ASSESSMENT: { color: '#d46b08', bg: '#fff7e6', border: '#ffd591' },
  UNDER_REVIEW: { color: '#d46b08', bg: '#fff7e6', border: '#ffd591' },
  MANUAL_REVIEW: { color: '#ad6800', bg: '#fffbe6', border: '#ffe58f' },
  DOCUMENTS_PENDING: { color: '#d46b08', bg: '#fff7e6', border: '#ffd591' },
  DOCUMENTS_VERIFIED: { color: '#389e0d', bg: '#f6ffed', border: '#b7eb8f' },
  APPROVED: { color: '#096dd9', bg: '#e6f4ff', border: '#91caff' },
  DISBURSED: { color: '#531dab', bg: '#f9f0ff', border: '#d3adf7' },
  ACTIVE: { color: '#237804', bg: '#f6ffed', border: '#95de64' },
  OVERDUE: { color: '#cf1322', bg: '#fff1f0', border: '#ffa39e' },
  NPA: { color: '#fff', bg: '#a8071a', border: '#a8071a' },
  REJECTED: { color: '#434343', bg: '#f0f0f0', border: '#bfbfbf' },
  CLOSED: { color: '#434343', bg: '#f0f0f0', border: '#bfbfbf' },
}

// EMI Status Colors
export const emiStatusColors = {
  PENDING: { color: '#595959', bg: '#f5f5f5' },
  PAID: { color: '#237804', bg: '#f6ffed' },
  PARTIALLY_PAID: { color: '#d46b08', bg: '#fff7e6' },
  OVERDUE: { color: '#cf1322', bg: '#fff1f0' },
}

// Document Status Colors
export const documentStatusColors = {
  UPLOADED: { color: '#096dd9', bg: '#e6f4ff' },
  PENDING_VERIFICATION: { color: '#d46b08', bg: '#fff7e6' },
  VERIFIED: { color: '#237804', bg: '#f6ffed' },
  REJECTED: { color: '#cf1322', bg: '#fff1f0' },
}

// Payment Status Colors
export const paymentStatusColors = {
  SUCCESS: { color: '#237804', bg: '#f6ffed' },
  PENDING: { color: '#d46b08', bg: '#fff7e6' },
  FAILED: { color: '#cf1322', bg: '#fff1f0' },
  BOUNCED: { color: '#a8071a', bg: '#fff1f0' },
}

// DPD Bucket Colors
export const dpdBucketColors = {
  current: '#52c41a',   // 0 DPD
  dpd30: '#faad14',     // 1-30
  dpd60: '#fa8c16',     // 31-60
  dpd90: '#f5222d',     // 61-90
  npa: '#820014',       // 90+
}

// General UI Colors
export const ui = {
  background: '#f4f6f9',
  cardBg: '#ffffff',
  border: '#e8e8e8',
  textPrimary: '#1a1a2e',
  textSecondary: '#666',
  textMuted: '#999',
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1677ff',
}
