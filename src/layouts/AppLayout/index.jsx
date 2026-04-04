import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Typography, Space, Tag, Drawer, Grid } from 'antd'
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
import { authApi } from '../../api/authApi'
import { ROLES, APPROVER_ROLES, MANAGEMENT_ROLES } from '../../utils/constants'
import finpulseLogo from '../../assets/finpuls-logo.png'

const { Header, Sider, Content } = Layout
const { Text } = Typography
const { useBreakpoint } = Grid

const SIDER_WIDTH = 240
const SIDER_COLLAPSED_WIDTH = 80

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const screens = useBreakpoint()

  // md = 768px — below that we switch to Drawer mode
  const isMobile = !screens.md

  const userRoles = user?.roles?.map((r) => r.roleCode) || []

  const canAccess = (allowedRoles) =>
    !allowedRoles || allowedRoles.some((r) => userRoles.includes(r))

  const filterChildren = (children) =>
    children.filter((c) => canAccess(c.roles))

  const allMenuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      roles: null,
    },
    {
      key: '/customers',
      icon: <UserOutlined />,
      label: 'Customers',
      roles: null,
    },
    {
      key: 'los',
      icon: <FileTextOutlined />,
      label: 'LOS',
      children: [
        { key: '/los/applications',       label: 'Loan Applications',     roles: null },
        { key: '/los/credit-assessments', label: 'Credit Assessments',    roles: [ROLES.CREDIT_ANALYST, ROLES.CREDIT_MANAGER, ROLES.ADMIN] },
        { key: '/los/approvals',          label: 'Approvals / Rejections',roles: APPROVER_ROLES },
        { key: '/los/documents',          label: 'Documents',             roles: null },
        { key: '/los/collaterals',        label: 'Collaterals',           roles: [ROLES.CREDIT_ANALYST, ROLES.RISK_MANAGER, ROLES.OPERATIONS_MANAGER, ROLES.ADMIN] },
      ],
    },
    {
      key: 'lms',
      icon: <BankOutlined />,
      label: 'LMS',
      children: [
        { key: '/lms/active-loans', label: 'Active Loans',  roles: null },
        { key: '/lms/emi-schedule', label: 'EMI Schedule',  roles: null },
        { key: '/lms/payments',     label: 'Payments',      roles: null },
        { key: '/lms/closure',      label: 'Loan Closure',  roles: MANAGEMENT_ROLES },
      ],
    },
    {
      key: '/disbursements',
      icon: <DollarOutlined />,
      label: 'Disbursements',
      roles: [ROLES.OPERATIONS_MANAGER, ROLES.ADMIN],
    },
    {
      key: 'collections',
      icon: <WarningOutlined />,
      label: 'Collections',
      children: [
        { key: '/collections/overdue',      label: 'Overdue Loans', roles: null },
        { key: '/collections/dpd-buckets',  label: 'DPD Buckets',   roles: null },
        { key: '/collections/penalties',    label: 'Penalties',     roles: [ROLES.OPERATIONS_MANAGER, ROLES.RISK_MANAGER, ...MANAGEMENT_ROLES] },
        { key: '/collections/npa',          label: 'NPA Accounts',  roles: null },
      ],
    },
    {
      key: '/advices',
      icon: <CreditCardOutlined />,
      label: 'Advices',
      children: [
        { key: '/advices/receivables', label: 'Receivables', roles: null },
        { key: '/advices/payables',    label: 'Payables',    roles: null },
      ],
    },
    {
      key: '/fees',
      icon: <AuditOutlined />,
      label: 'Fees & Charges',
      roles: null,
    },
    {
      key: '/eod',
      icon: <ClockCircleOutlined />,
      label: 'EOD',
      roles: [ROLES.ADMIN],
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
      roles: [ROLES.RISK_MANAGER, ROLES.COMPLIANCE_OFFICER, ...MANAGEMENT_ROLES],
      children: [
        { key: '/reports/disbursement', label: 'Disbursement', roles: null },
        { key: '/reports/collection',   label: 'Collection',   roles: null },
        { key: '/reports/outstanding',  label: 'Outstanding',  roles: null },
        { key: '/reports/dpd-npa',      label: 'DPD / NPA',    roles: null },
        { key: '/reports/mis',          label: 'MIS',          roles: null },
      ],
    },
    {
      key: 'admin',
      icon: <SettingOutlined />,
      label: 'Admin',
      roles: [ROLES.ADMIN],
      children: [
        { key: '/admin/users',          label: 'Users',          roles: null },
        { key: '/admin/roles',          label: 'Roles',          roles: null },
        { key: '/admin/masters',        label: 'Masters',        roles: null },
        { key: '/admin/login-history',  label: 'Login History',  roles: null },
      ],
    },
  ]

  const menuItems = allMenuItems
    .filter((item) => canAccess(item.roles))
    .map((item) => {
      if (!item.children) return item
      const visibleChildren = filterChildren(item.children)
      if (visibleChildren.length === 0) return null
      return { ...item, children: visibleChildren }
    })
    .filter(Boolean)

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: 'Profile' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
  ]

  const handleMenuClick = ({ key }) => {
    navigate(key)
    if (isMobile) setDrawerOpen(false)
  }

  const handleUserMenu = ({ key }) => {
    if (key === 'logout') {
      authApi.logout().finally(() => {
        logout()
        navigate('/login')
      })
    } else if (key === 'profile') {
      navigate('/profile')
    }
  }

  const selectedKey = location.pathname

  // Shared menu content used in both Sider and Drawer
  const menuContent = (
    <>
      <div style={{
        height: 64,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px',
        borderBottom: '1px solid #e8e8e8',
        flexShrink: 0,
      }}>
        <img
          src={finpulseLogo}
          alt="FinPulse"
          style={{ height: 36, objectFit: 'contain', display: 'block' }}
        />
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
    </>
  )

  const contentMargin = isMobile ? '12px 8px' : '24px'
  const siderMarginLeft = isMobile ? 0 : (collapsed ? SIDER_COLLAPSED_WIDTH : SIDER_WIDTH)

  return (
    <Layout style={{ minHeight: '100vh' }}>

      {/* ── Desktop Sider ── */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
          width={SIDER_WIDTH}
          collapsedWidth={SIDER_COLLAPSED_WIDTH}
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
          <div style={{
            height: 64,
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
            borderBottom: '1px solid #e8e8e8',
          }}>
            <img
              src={finpulseLogo}
              alt="FinPulse"
              style={{ height: collapsed ? 30 : 36, objectFit: 'contain', display: 'block' }}
            />
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
      )}

      {/* ── Mobile Drawer ── */}
      {isMobile && (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          placement="left"
          width={SIDER_WIDTH}
          styles={{
            body: { padding: 0, background: '#1B3A6B', display: 'flex', flexDirection: 'column' },
            header: { display: 'none' },
          }}
          closable={false}
        >
          {menuContent}
        </Drawer>
      )}

      {/* ── Main layout ── */}
      <Layout style={{ marginLeft: siderMarginLeft, transition: 'margin-left 0.2s' }}>

        {/* Header */}
        <Header style={{
          background: '#fff',
          padding: '0 16px',
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
            {isMobile ? (
              <MenuUnfoldOutlined
                onClick={() => setDrawerOpen(true)}
                style={{ fontSize: 20, cursor: 'pointer' }}
              />
            ) : (
              collapsed
                ? <MenuUnfoldOutlined onClick={() => setCollapsed(false)} style={{ fontSize: 18, cursor: 'pointer' }} />
                : <MenuFoldOutlined onClick={() => setCollapsed(true)} style={{ fontSize: 18, cursor: 'pointer' }} />
            )}
          </Space>

          <Space size={12}>
            {!isMobile && user?.branchCode && (
              <Tag color="blue">{user.branchCode}</Tag>
            )}
            {!isMobile && userRoles[0] && (
              <Tag color="geekblue">{userRoles[0]}</Tag>
            )}
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenu }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ backgroundColor: '#1B3A6B' }} icon={<UserOutlined />} />
                {!isMobile && (
                  <Text strong style={{ fontSize: 13 }}>{user?.fullName || user?.username}</Text>
                )}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Page Content */}
        <Content style={{
          margin: contentMargin,
          minHeight: 'calc(100vh - 112px)',
          minWidth: 0,
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AppLayout
