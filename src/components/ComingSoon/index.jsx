import { Result } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import { brand } from '../../theme/colors'

const ComingSoon = ({ title, description }) => {
  return (
    <Result
      icon={<ClockCircleOutlined style={{ color: brand.primary }} />}
      title={title || 'Coming Soon'}
      subTitle={description || 'This module is under development.'}
    />
  )
}

export default ComingSoon
