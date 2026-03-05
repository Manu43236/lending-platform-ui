import { Typography, Space, Divider } from 'antd'
import { ui } from '../../theme/colors'

const { Title, Text } = Typography

const PageHeader = ({
  title,
  subtitle,
  actions,
  extra,
}) => {
  return (
    <div style={{ marginBottom: 24 }}>
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
