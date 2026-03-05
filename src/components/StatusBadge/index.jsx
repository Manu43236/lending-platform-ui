import { Tag } from 'antd'
import {
  loanStatusColors,
  emiStatusColors,
  documentStatusColors,
  paymentStatusColors,
} from '../../theme/colors'

// Loan Status Badge
export const LoanStatusBadge = ({ status }) => {
  if (!status) return <Tag>—</Tag>
  const config = loanStatusColors[status] || { color: '#595959', bg: '#f5f5f5', border: '#d9d9d9' }
  return (
    <Tag
      style={{
        color: config.color,
        background: config.bg,
        borderColor: config.border,
        fontWeight: 500,
        fontSize: 12,
      }}
    >
      {status.replace(/_/g, ' ')}
    </Tag>
  )
}

// EMI Status Badge
export const EmiStatusBadge = ({ status }) => {
  if (!status) return <Tag>—</Tag>
  const config = emiStatusColors[status] || { color: '#595959', bg: '#f5f5f5' }
  return (
    <Tag
      style={{
        color: config.color,
        background: config.bg,
        fontWeight: 500,
        fontSize: 12,
      }}
    >
      {status.replace(/_/g, ' ')}
    </Tag>
  )
}

// Document Status Badge
export const DocumentStatusBadge = ({ status }) => {
  if (!status) return <Tag>—</Tag>
  const config = documentStatusColors[status] || { color: '#595959', bg: '#f5f5f5' }
  return (
    <Tag
      style={{
        color: config.color,
        background: config.bg,
        fontWeight: 500,
        fontSize: 12,
      }}
    >
      {status.replace(/_/g, ' ')}
    </Tag>
  )
}

// Payment Status Badge
export const PaymentStatusBadge = ({ status }) => {
  if (!status) return <Tag>—</Tag>
  const config = paymentStatusColors[status] || { color: '#595959', bg: '#f5f5f5' }
  return (
    <Tag
      style={{
        color: config.color,
        background: config.bg,
        fontWeight: 500,
        fontSize: 12,
      }}
    >
      {status}
    </Tag>
  )
}
