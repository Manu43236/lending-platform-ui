import { Modal, Typography, Space } from 'antd'
import { ExclamationCircleFilled, WarningFilled } from '@ant-design/icons'

const { Text } = Typography

const ConfirmModal = ({
  open,
  title,
  message,
  subMessage,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmDanger = false,
  loading = false,
  type = 'warning',   // 'warning' | 'danger'
}) => {
  const icon =
    type === 'danger' ? (
      <WarningFilled style={{ fontSize: 22, color: '#ff4d4f' }} />
    ) : (
      <ExclamationCircleFilled style={{ fontSize: 22, color: '#faad14' }} />
    )

  return (
    <Modal
      open={open}
      title={
        <Space>
          {icon}
          <span>{title}</span>
        </Space>
      }
      onOk={onConfirm}
      onCancel={onCancel}
      okText={confirmText}
      cancelText={cancelText}
      okButtonProps={{
        danger: confirmDanger || type === 'danger',
        loading,
      }}
      centered
      width={420}
    >
      <div style={{ paddingTop: 8 }}>
        <Text>{message}</Text>
        {subMessage && (
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {subMessage}
            </Text>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default ConfirmModal
