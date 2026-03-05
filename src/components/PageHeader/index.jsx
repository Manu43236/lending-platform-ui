import { Breadcrumb, Typography, Space, Divider } from 'antd'
import { HomeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { ui } from '../../theme/colors'

const { Title, Text } = Typography

const PageHeader = ({
  title,
  subtitle,
  breadcrumbs = [],  // [{ label: 'Customers', path: '/customers' }, { label: 'Detail' }]
  actions,           // React node — buttons on the right
  extra,             // React node — below title (e.g. status badge)
}) => {
  const navigate = useNavigate()

  const breadcrumbItems = [
    {
      title: <HomeOutlined onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }} />,
    },
    ...breadcrumbs.map((b) => ({
      title: b.path ? (
        <span
          onClick={() => navigate(b.path)}
          style={{ cursor: 'pointer', color: ui.textSecondary }}
        >
          {b.label}
        </span>
      ) : (
        <span style={{ color: ui.textPrimary }}>{b.label}</span>
      ),
    })),
  ]

  return (
    <div style={{ marginBottom: 24 }}>
      {breadcrumbs.length > 0 && (
        <Breadcrumb items={breadcrumbItems} style={{ marginBottom: 8 }} />
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <Title level={4} style={{ margin: 0, color: ui.textPrimary }}>
            {title}
          </Title>
          {subtitle && (
            <Text type="secondary" style={{ fontSize: 13 }}>
              {subtitle}
            </Text>
          )}
          {extra && <div style={{ marginTop: 8 }}>{extra}</div>}
        </div>
        {actions && (
          <Space wrap>
            {actions}
          </Space>
        )}
      </div>
      <Divider style={{ margin: '16px 0 0 0' }} />
    </div>
  )
}

export default PageHeader
