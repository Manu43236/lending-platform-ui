import { Table, Card } from 'antd'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../../utils/constants'

const DataTable = ({
  columns,
  dataSource,
  loading,
  pagination,          // PagedResponse meta from backend
  onPageChange,        // (page, size) => void
  rowKey = 'id',
  onRow,
  scroll,
  title,
  extra,
  size = 'middle',
  bordered = false,
  expandable,
}) => {
  const paginationConfig = pagination
    ? {
        current: (pagination.page ?? 0) + 1,   // backend is 0-indexed
        pageSize: pagination.size ?? DEFAULT_PAGE_SIZE,
        total: pagination.totalElements ?? 0,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} records`,
        showSizeChanger: true,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
        onChange: (page, size) => onPageChange && onPageChange(page - 1, size),
        onShowSizeChange: (_, size) => onPageChange && onPageChange(0, size),
      }
    : false

  const tableContent = (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        rowKey={rowKey}
        pagination={paginationConfig}
        onRow={onRow}
        scroll={scroll || { x: 'max-content' }}
        size={size}
        bordered={bordered}
        expandable={expandable}
        style={{ borderRadius: 8, minWidth: 600 }}
      />
    </div>
  )

  if (title || extra) {
    return (
      <Card
        title={title}
        extra={extra}
        bodyStyle={{ padding: 0 }}
        style={{ borderRadius: 12 }}
      >
        {tableContent}
      </Card>
    )
  }

  return tableContent
}

export default DataTable
