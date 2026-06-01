import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Timeline, Select, Button, Input, Space, Typography, Spin, Table, Divider, message } from 'antd';
import { ordersAPI, partsAPI, predictionsAPI } from '../../api';
import { STATUS_LABELS, STATUS_TAG_COLORS, DEVICE_TYPE_LABELS } from '../../utils/constants';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const MasterOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [parts, setParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);

  const fetchOrder = async () => {
    try {
      const { data } = await ordersAPI.getById(id);
      setOrder(data.order);
      setDiagnosis(data.order.diagnosis || '');
    } catch {
      navigate('/master/orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    partsAPI.getAll({ limit: 100 }).then(({ data }) => setParts(data.parts)).catch(() => {});
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

  const handleDiagnosis = async () => {
    try {
      await ordersAPI.update(id, { diagnosis });
      message.success('Діагноз збережено');
    } catch {
      message.error('Помилка');
    }
  };

  const handleAddPart = async () => {
    if (!selectedPart) return;
    try {
      await ordersAPI.addPart(id, { partId: selectedPart, quantity: 1 });
      message.success('Запчастину додано');
      setSelectedPart(null);
      fetchOrder();
    } catch (err) {
      message.error(err.response?.data?.message || 'Помилка');
    }
  };

  const handlePredict = async () => {
    setPredicting(true);
    try {
      const { data } = await predictionsAPI.predictCombined(order.deviceId);
      setPrediction(data);
      message.success('Прогноз отримано');
    } catch {
      message.error('Помилка прогнозування');
    } finally {
      setPredicting(false);
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!order) return null;

  return (
    <div className="page-container">
      <Button onClick={() => navigate('/master/orders')} style={{ marginBottom: 16 }}>← Назад</Button>
      <Title level={3}>Заявка {order.orderNumber}</Title>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2 }} bordered>
          <Descriptions.Item label="Статус"><Tag color={STATUS_TAG_COLORS[order.status]}>{STATUS_LABELS[order.status]}</Tag></Descriptions.Item>
          <Descriptions.Item label="Клієнт">{order.client?.firstName} {order.client?.lastName} ({order.client?.phone})</Descriptions.Item>
          <Descriptions.Item label="Пристрій">{order.device?.brand} {order.device?.model}</Descriptions.Item>
          <Descriptions.Item label="Вартість">{parseFloat(order.totalCost || 0).toFixed(0)} грн</Descriptions.Item>
          <Descriptions.Item label="Опис" span={2}>{order.description}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Diagnosis */}
      <Card title="Діагноз" style={{ marginBottom: 16 }}>
        <TextArea rows={3} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Введіть результат діагностики" />
        <Button type="primary" style={{ marginTop: 8 }} onClick={handleDiagnosis}>Зберегти діагноз</Button>
      </Card>

      {/* Status change */}
      <Card title="Змінити статус" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select placeholder="Новий статус" value={newStatus || undefined} onChange={setNewStatus} style={{ width: 200 }}
            options={Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          <TextArea placeholder="Коментар" value={statusComment} onChange={(e) => setStatusComment(e.target.value)} rows={1} style={{ width: 280 }} />
          <Button type="primary" onClick={handleStatusChange} disabled={!newStatus}>Оновити</Button>
        </Space>
      </Card>

      {/* Add parts */}
      <Card title="Запчастини" style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 12 }}>
          <Select placeholder="Оберіть запчастину" value={selectedPart} onChange={setSelectedPart}
            style={{ width: 350 }} showSearch optionFilterProp="label"
            options={parts.map((p) => ({ value: p.id, label: `${p.name} — ${p.price} грн (${p.quantityInStock} шт)` }))} />
          <Button onClick={handleAddPart} disabled={!selectedPart}>Додати</Button>
        </Space>
        {order.orderParts?.length > 0 && (
          <Table dataSource={order.orderParts} rowKey="id" pagination={false} size="small"
            columns={[
              { title: 'Назва', render: (_, r) => r.part?.name },
              { title: 'Кількість', dataIndex: 'quantity' },
              { title: 'Ціна', dataIndex: 'priceAtUse', render: (v) => `${parseFloat(v).toFixed(0)} грн` },
            ]} />
        )}
      </Card>

      {/* Prediction */}
      <Card title="🤖 AI-прогнозування" style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handlePredict} loading={predicting}>Отримати прогноз</Button>
        {prediction?.geminiAnalysis && (
          <div style={{ marginTop: 16 }}>
            <Paragraph strong>Аналіз:</Paragraph>
            <Paragraph>{prediction.geminiAnalysis.analysis}</Paragraph>
            {prediction.geminiAnalysis.riskLevel && (
              <Tag color={prediction.geminiAnalysis.riskLevel === 'high' ? 'red' : prediction.geminiAnalysis.riskLevel === 'medium' ? 'orange' : 'green'}>
                Ризик: {prediction.geminiAnalysis.riskLevel}
              </Tag>
            )}
            {prediction.geminiAnalysis.recommendations?.map((r, i) => <Paragraph key={i}>• {r}</Paragraph>)}
          </div>
        )}
      </Card>

      {/* Timeline */}
      <Card title="Історія">
        <Timeline
          items={(order.statusHistory || []).map((h) => ({
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
    </div>
  );
};

export default MasterOrderDetail;
