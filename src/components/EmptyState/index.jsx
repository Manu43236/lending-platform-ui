import { Empty, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

const EmptyState = ({
  title = 'No data found',
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div style={{ padding: '48px 0', textAlign: 'center' }}>
      <Empty
        image={icon || Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div>
            <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 4 }}>{title}</div>
            {description && (
              <div style={{ color: '#999', fontSize: 13 }}>{description}</div>
            )}
          </div>
        }
      >
        {actionLabel && onAction && (
          <Button type="primary" icon={<PlusOutlined />} onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </Empty>
    </div>
  )
}

export default EmptyState
