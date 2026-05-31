import { useState, useEffect } from 'react';
import { Table, Tag, Typography, Card } from 'antd';
import { ordersAPI } from '../../api';
import { STATUS_LABELS, STATUS_TAG_COLORS } from '../../utils/constants';

const { Title } = Typography;

const ClientOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data } = await ordersAPI.getAll({ page, limit: 15 });
        setOrders(data.orders);
        setTotal(data.total);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [page]);

  const columns = [
    { title: '№ Заявки', dataIndex: 'orderNumber', width: 140 },
    { title: 'Пристрій', key: 'device', render: (_, r) => r.device ? `${r.device.brand} ${r.device.model}` : '-' },
    { title: 'Опис', dataIndex: 'description', ellipsis: true },
    { title: 'Статус', dataIndex: 'status', render: (s) => <Tag color={STATUS_TAG_COLORS[s]}>{STATUS_LABELS[s]}</Tag> },
    { title: 'Вартість', dataIndex: 'totalCost', render: (v) => v ? `${parseFloat(v).toFixed(0)} грн` : '-' },
    { title: 'Дата', dataIndex: 'createdAt', render: (d) => new Date(d).toLocaleDateString('uk-UA') },
  ];

  return (
    <div className="page-container">
      <Title level={3}>Мої заявки</Title>
      <Table columns={columns} dataSource={orders} rowKey="id" loading={loading}
        pagination={{ current: page, total, pageSize: 15, onChange: setPage }} scroll={{ x: 700 }} />
    </div>
  );
};

export default ClientOrders;
