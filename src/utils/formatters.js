import dayjs from 'dayjs'

// Currency — Indian Rupee format
export const formatCurrency = (amount, decimals = 2) => {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

// Short currency — e.g. ₹1.2L, ₹3.5Cr
export const formatCurrencyShort = (amount) => {
  if (amount === null || amount === undefined) return '—'
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${amount}`
}

// Number with Indian comma formatting
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '—'
  return new Intl.NumberFormat('en-IN').format(num)
}

// Percentage
export const formatPercent = (value, decimals = 2) => {
  if (value === null || value === undefined) return '—'
  return `${Number(value).toFixed(decimals)}%`
}

// Date — DD MMM YYYY (e.g. 05 Mar 2026)
export const formatDate = (date) => {
  if (!date) return '—'
  return dayjs(date).format('DD MMM YYYY')
}

// Date Time — DD MMM YYYY, hh:mm A
export const formatDateTime = (date) => {
  if (!date) return '—'
  return dayjs(date).format('DD MMM YYYY, hh:mm A')
}

// Relative time — e.g. "2 days ago"
export const formatRelativeTime = (date) => {
  if (!date) return '—'
  return dayjs(date).fromNow()
}

// Tenure — months to readable
export const formatTenure = (months) => {
  if (!months) return '—'
  if (months < 12) return `${months} Months`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0 ? `${years} Yr ${rem} Mo` : `${years} Year${years > 1 ? 's' : ''}`
}

// Loan number display — truncate if needed
export const formatLoanNumber = (loanNumber) => {
  if (!loanNumber) return '—'
  return loanNumber.toUpperCase()
}

// File size — KB to readable
export const formatFileSize = (kb) => {
  if (!kb) return '—'
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`
  return `${kb} KB`
}

// DPD display
export const formatDPD = (dpd) => {
  if (dpd === null || dpd === undefined) return '—'
  if (dpd === 0) return 'Current'
  return `${dpd} Days`
}

// Mask PAN — show only last 4 chars
export const maskPan = (pan) => {
  if (!pan) return '—'
  return `XXXXXX${pan.slice(-4)}`
}

// Mask Aadhaar — show only last 4 digits
export const maskAadhaar = (aadhar) => {
  if (!aadhar) return '—'
  return `XXXX XXXX ${aadhar.slice(-4)}`
}
