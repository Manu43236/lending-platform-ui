import { useState, useEffect, useCallback } from 'react'
import { Table, Tag, Input, Button, Space, Card } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { authApi } from '../../api/authApi'
import PageHeader from '../../components/PageHeader'
import { formatDateTime } from '../../utils/formatters'
import { DEFAULT_PAGE_SIZE } from '../../utils/constants'

const LoginHistory = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [searchUsername, setSearchUsername] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      let res
      if (searchUsername) {
        res = await authApi.getLoginHistoryByUsername(searchUsername, { page, size: pageSize })
      } else {
        res = await authApi.getLoginHistory({ page, size: pageSize })
      }
      const paged = res.data.data
      setData(paged.content)
      setTotal(paged.totalElements)
    } catch {
      // error handled globally
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, searchUsername])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const handleSearch = () => {
    setPage(0)
    setSearchUsername(searchInput.trim())
  }

  const handleReset = () => {
    setSearchInput('')
    setSearchUsername('')
    setPage(0)
  }

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      width: 150,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'SUCCESS' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
    {
      title: 'Login At',
      dataIndex: 'loginAt',
      key: 'loginAt',
      width: 180,
      render: (v) => formatDateTime(v),
    },
    {
      title: 'Logout At',
      dataIndex: 'logoutAt',
      key: 'logoutAt',
      width: 180,
      render: (v) => (v ? formatDateTime(v) : <Tag color="orange">Active / Not recorded</Tag>),
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 140,
      render: (v) => v || '—',
    },
    {
      title: 'Failure Reason',
      dataIndex: 'failureReason',
      key: 'failureReason',
      render: (v) => v || '—',
    },
  ]

  return (
    <>
      <PageHeader title="Login History" subtitle="Audit trail of all user logins and logouts" />

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="Search by username"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 220 }}
            allowClear
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>Search</Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>Reset</Button>
        </Space>
      </Card>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: page + 1,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `Total ${t} records`,
          onChange: (p, ps) => { setPage(p - 1); setPageSize(ps) },
        }}
        scroll={{ x: 900 }}
      />
    </>
  )
}

export default LoginHistory
