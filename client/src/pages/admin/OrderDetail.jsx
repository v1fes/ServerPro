import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Timeline, Select, Button, Input, Space, Typography, Spin, Table, Divider, message, Modal } from 'antd';
import { ordersAPI, usersAPI, partsAPI, predictionsAPI } from '../../api';
import { STATUS_LABELS, STATUS_TAG_COLORS, DEVICE_TYPE_LABELS } from '../../utils/constants';
import PredictionResults from '../../components/PredictionResults';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [masters, setMasters] = useState([]);
  const [newStatus, setNewStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);

  const fetchOrder = async () => {
    try {
      const { data } = await ordersAPI.getById(id);
      setOrder(data.order);
    } catch (err) {
      message.error('Заявку не знайдено');
      navigate('/admin/orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    usersAPI.getMasters().then(({ data }) => setMasters(data.masters)).catch(() => {});
  }, [id]);

  const handleStatusChange = async () => {
    if (!newStatus) return;
    try {
      await ordersAPI.updateStatus(id, { status: newStatus, comment: statusComment });
      message.success('Статус оновлено');
      setNewStatus('');
      setStatusComment('');
      fetchOrder();
    } catch (err) {
      message.error(err.response?.data?.message || 'Помилка');
    }
  };

  const handleAssignMaster = async (masterId) => {
    try {
      await ordersAPI.update(id, { masterId });
      message.success('Майстра призначено');
      fetchOrder();
    } catch (err) {
      message.error('Помилка');
    }
  };

  const handlePredict = async () => {
    setPredicting(true);
    try {
      const { data } = await predictionsAPI.predictCombined(order.deviceId);
      setPrediction(data);
      message.success('Прогноз отримано');
    } catch (err) {
      message.error('Помилка прогнозування');
    } finally {
      setPredicting(false);
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!order) return null;

  return (
    <div className="page-container">
      <Button onClick={() => navigate('/admin/orders')} style={{ marginBottom: 16 }}>← Назад</Button>
      <Title level={3}>Заявка {order.orderNumber}</Title>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered>
          <Descriptions.Item label="Статус">
            <Tag color={STATUS_TAG_COLORS[order.status]}>{STATUS_LABELS[order.status]}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Клієнт">
            {order.client?.firstName} {order.client?.lastName} ({order.client?.phone})
          </Descriptions.Item>
          <Descriptions.Item label="Пристрій">
            {DEVICE_TYPE_LABELS[order.device?.deviceType]} {order.device?.brand} {order.device?.model}
          </Descriptions.Item>
          <Descriptions.Item label="Майстер">
            {order.master ? `${order.master.firstName} ${order.master.lastName}` : 'Не призначено'}
          </Descriptions.Item>
          <Descriptions.Item label="Вартість">{parseFloat(order.totalCost || 0).toFixed(0)} грн</Descriptions.Item>
          <Descriptions.Item label="Створено">{new Date(order.createdAt).toLocaleDateString('uk-UA')}</Descriptions.Item>
          <Descriptions.Item label="Опис" span={3}>{order.description}</Descriptions.Item>
          {order.diagnosis && <Descriptions.Item label="Діагноз" span={3}>{order.diagnosis}</Descriptions.Item>}
        </Descriptions>
      </Card>

      {/* Actions */}
      <Card title="Управління" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space wrap>
            <Text strong>Призначити майстра:</Text>
            <Select
              placeholder="Оберіть майстра"
              value={order.masterId || undefined}
              onChange={handleAssignMaster}
              style={{ width: 250 }}
              options={masters.map((m) => ({ value: m.id, label: `${m.firstName} ${m.lastName} (${m.specialization || ''})` }))}
            />
          </Space>
          <Divider />
          <Space wrap align="start">
            <Text strong>Змінити статус:</Text>
            <Select
              placeholder="Новий статус"
              value={newStatus || undefined}
              onChange={setNewStatus}
              style={{ width: 200 }}
              options={Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            />
            <TextArea
              placeholder="Коментар (необов'язково)"
              value={statusComment}
              onChange={(e) => setStatusComment(e.target.value)}
              rows={1}
              style={{ width: 300 }}
            />
            <Button type="primary" onClick={handleStatusChange} disabled={!newStatus}>
              Оновити
            </Button>
          </Space>
        </Space>
      </Card>

      {/* Timeline */}
      <Card title="Історія статусів" style={{ marginBottom: 16 }}>
        <Timeline
          items={(order.statusHistory || []).map((h) => ({
            color: STATUS_TAG_COLORS[h.status] === 'processing' ? 'blue' : STATUS_TAG_COLORS[h.status] || 'blue',
            children: (
              <div>
                <Tag color={STATUS_TAG_COLORS[h.status]}>{STATUS_LABELS[h.status] || h.status}</Tag>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {new Date(h.createdAt).toLocaleString('uk-UA')}
                </Text>
                {h.changedByUser && <Text style={{ marginLeft: 8 }}>— {h.changedByUser.firstName} {h.changedByUser.lastName}</Text>}
                {h.comment && <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>{h.comment}</Paragraph>}
              </div>
            ),
          }))}
        />
      </Card>

      {/* Parts */}
      {order.orderParts?.length > 0 && (
        <Card title="Запчастини" style={{ marginBottom: 16 }}>
          <Table
            dataSource={order.orderParts}
            rowKey="id"
            pagination={false}
            columns={[
              { title: 'Назва', render: (_, r) => r.part?.name },
              { title: 'Кількість', dataIndex: 'quantity' },
              { title: 'Ціна', dataIndex: 'priceAtUse', render: (v) => `${parseFloat(v).toFixed(0)} грн` },
            ]}
          />
        </Card>
      )}

      {/* Prediction */}
      <Card title="Прогнозування поломок (AI)" style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handlePredict} loading={predicting}>
          🤖 Отримати прогноз від AI
        </Button>
        {prediction && (
          <div style={{ marginTop: 16 }}>
            {prediction.geminiAnalysis && (
              <>
                <Paragraph strong>Аналіз Gemini AI:</Paragraph>
                <Paragraph>{prediction.geminiAnalysis.analysis}</Paragraph>
                {prediction.geminiAnalysis.riskLevel && (
                  <Tag color={prediction.geminiAnalysis.riskLevel === 'high' ? 'red' : prediction.geminiAnalysis.riskLevel === 'medium' ? 'orange' : 'green'}>
                    Рівень ризику: {prediction.geminiAnalysis.riskLevel}
                  </Tag>
                )}
                {prediction.geminiAnalysis.recommendations?.length > 0 && (
                  <>
                    <Paragraph strong style={{ marginTop: 12 }}>Рекомендації:</Paragraph>
                    <ul>{prediction.geminiAnalysis.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
                  </>
                )}
                {prediction.geminiAnalysis.predictedFailures?.length > 0 && (
                  <>
                    <Paragraph strong style={{ marginTop: 12 }}>Прогнозовані поломки:</Paragraph>
                    {prediction.geminiAnalysis.predictedFailures.map((f, i) => (
                      <Card key={i} size="small" style={{ marginBottom: 8 }}>
                        <Text strong>{f.type}</Text> — ймовірність: {(f.probability * 100).toFixed(0)}%
                        <br /><Text type="secondary">Часовий горизонт: {f.timeframe}</Text>
                        <br /><Text>{f.reason}</Text>
                      </Card>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default OrderDetail;
