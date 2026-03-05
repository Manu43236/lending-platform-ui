import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Typography, Space, Tag } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  BankOutlined,
  DollarOutlined,
  WarningOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ClockCircleOutlined,
  AuditOutlined,
  CreditCardOutlined,
} from '@ant-design/icons'
import useAuthStore from '../../store/authStore'

const { Header, Sider, Content } = Layout
const { Text } = Typography

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const userRoles = user?.roles?.map((r) => r.roleCode) || []

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/customers',
      icon: <UserOutlined />,
      label: 'Customers',
    },
    {
      key: 'los',
      icon: <FileTextOutlined />,
      label: 'LOS',
      children: [
        { key: '/los/applications',         label: 'Loan Applications'    },
        { key: '/los/credit-assessments',   label: 'Credit Assessments'  },
        { key: '/los/approvals',            label: 'Approvals / Rejections' },
        { key: '/los/disbursements',        label: 'Disbursements'        },
        { key: '/los/documents',            label: 'Documents'            },
        { key: '/los/collaterals',          label: 'Collaterals'          },
      ],
    },
    {
      key: 'lms',
      icon: <BankOutlined />,
      label: 'LMS',
      children: [
        { key: '/lms/active-loans', label: 'Active Loans' },
        { key: '/lms/emi-schedule', label: 'EMI Schedule' },
        { key: '/lms/payments', label: 'Payments' },
        { key: '/lms/closure', label: 'Loan Closure' },
      ],
    },
    {
      key: '/disbursements',
      icon: <DollarOutlined />,
      label: 'Disbursements',
    },
    {
      key: 'collections',
      icon: <WarningOutlined />,
      label: 'Collections',
      children: [
        { key: '/collections/overdue', label: 'Overdue Loans' },
        { key: '/collections/dpd-buckets', label: 'DPD Buckets' },
        { key: '/collections/penalties', label: 'Penalties' },
        { key: '/collections/npa', label: 'NPA Accounts' },
      ],
    },
    {
      key: '/advices',
      icon: <CreditCardOutlined />,
      label: 'Advices',
      children: [
        { key: '/advices/receivables', label: 'Receivables' },
        { key: '/advices/payables', label: 'Payables' },
      ],
    },
    {
      key: '/fees',
      icon: <AuditOutlined />,
      label: 'Fees & Charges',
    },
    {
      key: '/eod',
      icon: <ClockCircleOutlined />,
      label: 'EOD',
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
      children: [
        { key: '/reports/disbursement', label: 'Disbursement' },
        { key: '/reports/collection', label: 'Collection' },
        { key: '/reports/outstanding', label: 'Outstanding' },
        { key: '/reports/dpd-npa', label: 'DPD / NPA' },
        { key: '/reports/mis', label: 'MIS' },
      ],
    },
    {
      key: 'admin',
      icon: <SettingOutlined />,
      label: 'Admin',
      children: [
        { key: '/admin/users', label: 'Users' },
        { key: '/admin/roles', label: 'Roles' },
        { key: '/admin/masters', label: 'Masters' },
      ],
    },
  ]

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ]

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  const handleUserMenu = ({ key }) => {
    if (key === 'logout') {
      logout()
      navigate('/login')
    }
  }

  const selectedKey = location.pathname

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={240}
        style={{
          background: '#1B3A6B',
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '0' : '0 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <BankOutlined style={{ fontSize: 24, color: '#fff' }} />
          {!collapsed && (
            <Text strong style={{ color: '#fff', marginLeft: 10, fontSize: 16 }}>
              Money Moment
            </Text>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={['los', 'lms', 'collections', 'reports', 'admin', 'advices']}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ background: '#1B3A6B', borderRight: 0, marginTop: 8 }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'all 0.2s' }}>
        {/* Header */}
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
          position: 'sticky',
          top: 0,
          zIndex: 99,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}>
          <Space>
            {collapsed
              ? <MenuUnfoldOutlined onClick={() => setCollapsed(false)} style={{ fontSize: 18, cursor: 'pointer' }} />
              : <MenuFoldOutlined onClick={() => setCollapsed(true)} style={{ fontSize: 18, cursor: 'pointer' }} />
            }
          </Space>

          <Space size={16}>
            {user?.branchCode && (
              <Tag color="blue">{user.branchCode}</Tag>
            )}
            {userRoles[0] && (
              <Tag color="geekblue">{userRoles[0]}</Tag>
            )}
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenu }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ backgroundColor: '#1B3A6B' }} icon={<UserOutlined />} />
                {!collapsed && (
                  <Text strong style={{ fontSize: 13 }}>{user?.fullName || user?.username}</Text>
                )}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Page Content */}
        <Content style={{
          margin: '24px',
          minHeight: 'calc(100vh - 112px)',
          minWidth: 0,
          overflow: 'hidden',
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AppLayout
