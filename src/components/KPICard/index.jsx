import { Card, Statistic, Skeleton } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { ui } from '../../theme/colors'

const KPICard = ({
  title,
  value,
  prefix,
  suffix,
  icon,
  iconBg,
  trend,        // 'up' | 'down' | null
  trendValue,   // e.g. "12.5%"
  trendLabel,   // e.g. "vs last month"
  loading,
  onClick,
  formatter,
}) => {
  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      style={{
        borderRadius: 12,
        border: `1px solid ${ui.border}`,
        cursor: onClick ? 'pointer' : 'default',
      }}
      bodyStyle={{ padding: '20px 24px' }}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: ui.textSecondary, fontSize: 13, marginBottom: 8, fontWeight: 500 }}>
              {title}
            </div>
            <Statistic
              value={value}
              prefix={prefix}
              suffix={suffix}
              formatter={formatter}
              valueStyle={{ fontSize: 24, fontWeight: 700, color: ui.textPrimary, lineHeight: 1.2 }}
            />
            {(trend || trendValue) && (
              <div style={{ marginTop: 8, fontSize: 12, color: ui.textSecondary }}>
                {trend === 'up' && (
                  <span style={{ color: '#52c41a', fontWeight: 600 }}>
                    <ArrowUpOutlined /> {trendValue}
                  </span>
                )}
                {trend === 'down' && (
                  <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
                    <ArrowDownOutlined /> {trendValue}
                  </span>
                )}
                {trendLabel && (
                  <span style={{ marginLeft: 4 }}>{trendLabel}</span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: iconBg || '#e6f4ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              flexShrink: 0,
              marginLeft: 16,
            }}>
              {icon}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export default KPICard
