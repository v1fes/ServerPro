import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Select, Typography, Card, Space } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { ordersAPI } from '../../api';
import { STATUS_LABELS, STATUS_TAG_COLORS, DEVICE_TYPE_LABELS } from '../../utils/constants';

const { Title } = Typography;

const MasterOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data } = await ordersAPI.getAll({ page, limit: 15, status: statusFilter || undefined });
        setOrders(data.orders);
        setTotal(data.total);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [page, statusFilter]);

  const columns = [
    { title: '№ Заявки', dataIndex: 'orderNumber', width: 140 },
    {
      title: 'Пристрій', key: 'device',
      render: (_, r) => r.device ? `${r.device.brand} ${r.device.model}` : '-',
    },
    {
      title: 'Клієнт', key: 'client',
      render: (_, r) => r.client ? `${r.client.firstName} ${r.client.lastName}` : '-',
    },
    { title: 'Опис', dataIndex: 'description', ellipsis: true },
    {
      title: 'Статус', dataIndex: 'status',
      render: (s) => <Tag color={STATUS_TAG_COLORS[s]}>{STATUS_LABELS[s]}</Tag>,
    },
    {
      title: 'Дата', dataIndex: 'createdAt',
      render: (d) => new Date(d).toLocaleDateString('uk-UA'),
    },
    {
      title: 'Дії', key: 'actions', width: 80,
      render: (_, r) => <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/master/orders/${r.id}`)} />,
    },
  ];

  return (
    <div className="page-container">
      <Title level={3}>Мої заявки</Title>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Select placeholder="Фільтр за статусом" value={statusFilter || undefined}
            onChange={(v) => { setStatusFilter(v || ''); setPage(1); }} allowClear style={{ width: 200 }}
            options={Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
        </Space>
      </Card>
      <Table columns={columns} dataSource={orders} rowKey="id" loading={loading}
        pagination={{ current: page, total, pageSize: 15, onChange: setPage }} scroll={{ x: 800 }} />
    </div>
  );
};

export default MasterOrders;
