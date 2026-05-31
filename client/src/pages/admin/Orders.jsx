import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Input, Select, Button, Space, Typography, Card } from 'antd';
import { SearchOutlined, EyeOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import { ordersAPI } from '../../api';
import { STATUS_LABELS, STATUS_TAG_COLORS, DEVICE_TYPE_LABELS } from '../../utils/constants';
import { exportToExcel, exportToPDF } from '../../utils/export';

const { Title } = Typography;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await ordersAPI.getAll({ page, limit: 15, search, status: statusFilter || undefined });
      setOrders(data.orders);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

  const columns = [
    { title: '№ Заявки', dataIndex: 'orderNumber', key: 'orderNumber', width: 140 },
    {
      title: 'Пристрій', key: 'device',
      render: (_, r) => r.device ? `${DEVICE_TYPE_LABELS[r.device.deviceType] || r.device.deviceType} ${r.device.brand} ${r.device.model}` : '-',
    },
    {
      title: 'Клієнт', key: 'client',
      render: (_, r) => r.client ? `${r.client.firstName} ${r.client.lastName}` : '-',
    },
    {
      title: 'Майстер', key: 'master',
      render: (_, r) => r.master ? `${r.master.firstName} ${r.master.lastName}` : 'Не призначено',
    },
    {
      title: 'Статус', dataIndex: 'status', key: 'status',
      render: (s) => <Tag color={STATUS_TAG_COLORS[s]}>{STATUS_LABELS[s]}</Tag>,
    },
    {
      title: 'Вартість', dataIndex: 'totalCost', key: 'totalCost',
      render: (v) => v ? `${parseFloat(v).toFixed(0)} грн` : '-',
    },
    {
      title: 'Дата', dataIndex: 'createdAt', key: 'createdAt',
      render: (d) => new Date(d).toLocaleDateString('uk-UA'),
    },
    {
      title: 'Дії', key: 'actions', width: 80,
      render: (_, r) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/admin/orders/${r.id}`)} />
      ),
    },
  ];

  const exportColumns = [
    { title: '№ Заявки', dataIndex: 'orderNumber' },
    { title: 'Пристрій', dataIndex: 'device', exportRender: (_, r) => r.device ? `${r.device.brand} ${r.device.model}` : '-' },
    { title: 'Клієнт', dataIndex: 'client', exportRender: (_, r) => r.client ? `${r.client.firstName} ${r.client.lastName}` : '-' },
    { title: 'Майстер', dataIndex: 'master', exportRender: (_, r) => r.master ? `${r.master.firstName} ${r.master.lastName}` : '-' },
    { title: 'Статус', dataIndex: 'status', exportRender: (v) => STATUS_LABELS[v] || v },
    { title: 'Вартість (грн)', dataIndex: 'totalCost', exportRender: (v) => v ? parseFloat(v).toFixed(0) : '0' },
    { title: 'Дата', dataIndex: 'createdAt', exportRender: (v) => new Date(v).toLocaleDateString('uk-UA') },
  ];

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Заявки на ремонт</Title>
        <Space>
          <Button icon={<FileExcelOutlined />} onClick={() => exportToExcel(orders, exportColumns, 'orders')}>Excel</Button>
          <Button icon={<FilePdfOutlined />} onClick={() => exportToPDF(orders, exportColumns, 'orders', 'Orders Report')}>PDF</Button>
        </Space>
      </div>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input.Search
            placeholder="Пошук за номером або описом"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={fetchOrders}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            placeholder="Статус"
            value={statusFilter || undefined}
            onChange={(v) => { setStatusFilter(v || ''); setPage(1); }}
            allowClear
            style={{ width: 200 }}
            options={Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          />
        </Space>
      </Card>
      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        pagination={{ current: page, total, pageSize: 15, onChange: setPage }}
        scroll={{ x: 900 }}
      />
    </div>
  );
};

export default Orders;
