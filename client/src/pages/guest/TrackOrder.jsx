import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input, Button, Card, Timeline, Tag, Typography, Descriptions, Space, message, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { ordersAPI } from '../../api';
import { STATUS_LABELS, STATUS_TAG_COLORS } from '../../utils/constants';

const { Title, Text, Paragraph } = Typography;

const TrackOrder = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleTrack = async () => {
    if (!orderNumber.trim()) {
      message.warning('Введіть номер заявки');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await ordersAPI.track(orderNumber.trim());
      setOrder(data.order);
    } catch {
      setOrder(null);
      message.error('Заявку не знайдено');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="guest-track-container">
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>🔧 СервісПро</Title>
          <Paragraph type="secondary">Перевірте статус вашої заявки на ремонт</Paragraph>
        </div>

        <Space.Compact style={{ width: '100%', marginBottom: 24 }}>
          <Input
            size="large"
            placeholder="Введіть номер заявки (напр. SR2401-0001)"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            onPressEnter={handleTrack}
          />
          <Button type="primary" size="large" icon={<SearchOutlined />} loading={loading} onClick={handleTrack}>
            Пошук
          </Button>
        </Space.Compact>

        {searched && !order && !loading && (
          <Empty description="Заявку з таким номером не знайдено" />
        )}

        {order && (
          <>
            <Descriptions column={1} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Номер заявки">{order.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="Статус">
                <Tag color={STATUS_TAG_COLORS[order.status]} style={{ fontSize: 14 }}>
                  {STATUS_LABELS[order.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Пристрій">
                {order.device ? `${order.device.brand} ${order.device.model}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Опис проблеми">{order.description}</Descriptions.Item>
              <Descriptions.Item label="Дата створення">
                {new Date(order.createdAt).toLocaleDateString('uk-UA')}
              </Descriptions.Item>
              {order.completedAt && (
                <Descriptions.Item label="Дата завершення">
                  {new Date(order.completedAt).toLocaleDateString('uk-UA')}
                </Descriptions.Item>
              )}
            </Descriptions>

            {order.statusHistory?.length > 0 && (
              <Card title="Хід виконання" size="small">
                <Timeline
                  items={order.statusHistory.map((h) => ({
                    color: STATUS_TAG_COLORS[h.status] === 'processing' ? 'blue' : STATUS_TAG_COLORS[h.status] || 'blue',
                    children: (
                      <div>
                        <Tag color={STATUS_TAG_COLORS[h.status]}>{STATUS_LABELS[h.status] || h.status}</Tag>
                        <Text type="secondary"> {new Date(h.createdAt).toLocaleString('uk-UA')}</Text>
                        {h.comment && <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>{h.comment}</Paragraph>}
                      </div>
                    ),
                  }))}
                />
              </Card>
            )}
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/login">Увійти до системи</Link>
        </div>
      </Card>
    </div>
  );
};

export default TrackOrder;
