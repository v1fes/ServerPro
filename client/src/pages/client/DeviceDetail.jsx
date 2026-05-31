import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Table, Tag, Typography, Button, Spin, Divider, message, Progress, Row, Col, Alert } from 'antd';
import { WarningOutlined, CheckCircleOutlined, ExclamationCircleOutlined, RobotOutlined } from '@ant-design/icons';
import { devicesAPI, predictionsAPI } from '../../api';
import { DEVICE_TYPE_LABELS, STATUS_LABELS, STATUS_TAG_COLORS } from '../../utils/constants';

const { Title, Text, Paragraph } = Typography;

const DeviceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [orders, setOrders] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [devRes, histRes, predRes] = await Promise.all([
          devicesAPI.getById(id),
          devicesAPI.getHistory(id),
          predictionsAPI.getDevicePredictions(id),
        ]);
        setDevice(devRes.data.device);
        setOrders(histRes.data.orders);
        setPredictions(predRes.data.predictions);
      } catch (err) {
        message.error('Пристрій не знайдено');
        navigate('/client/devices');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!device) return null;

  const latestPrediction = predictions[0];
  let parsedRecs = null;
  if (latestPrediction?.recommendations) {
    try { parsedRecs = JSON.parse(latestPrediction.recommendations); } catch {}
  }

  const handlePredict = async () => {
    setPredicting(true);
    try {
      await predictionsAPI.predictCombined(id);
      const predRes = await predictionsAPI.getDevicePredictions(id);
      setPredictions(predRes.data.predictions);
      message.success('Прогноз оновлено');
    } catch (err) {
      message.error(err?.response?.data?.message || 'Помилка при отриманні прогнозу');
    } finally {
      setPredicting(false);
    }
  };

  return (
    <div className="page-container">
      <Button onClick={() => navigate('/client/devices')} style={{ marginBottom: 16 }}>← Назад</Button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>{device.brand} {device.model}</Title>
        <Button type="primary" icon={<RobotOutlined />} loading={predicting} onClick={handlePredict}>
          {latestPrediction ? 'Оновити AI прогноз' : 'Отримати AI прогноз'}
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2 }} bordered>
          <Descriptions.Item label="Тип">{DEVICE_TYPE_LABELS[device.deviceType]}</Descriptions.Item>
          <Descriptions.Item label="Бренд">{device.brand}</Descriptions.Item>
          <Descriptions.Item label="Модель">{device.model}</Descriptions.Item>
          <Descriptions.Item label="Серійний номер">{device.serialNumber || '-'}</Descriptions.Item>
          <Descriptions.Item label="Дата покупки">{device.purchaseDate ? new Date(device.purchaseDate).toLocaleDateString('uk-UA') : '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Prediction card */}
      {latestPrediction && (
        <Card
          title={<span><RobotOutlined /> Прогноз стану пристрою (AI)</span>}
          style={{ marginBottom: 16, borderLeft: `4px solid ${parsedRecs?.riskLevel === 'high' ? '#ff4d4f' : parsedRecs?.riskLevel === 'medium' ? '#faad14' : '#52c41a'}` }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <div style={{ textAlign: 'center' }}>
                <Progress
                  type="dashboard"
                  percent={Math.round((latestPrediction.probability || 0) * 100)}
                  strokeColor={parsedRecs?.riskLevel === 'high' ? '#ff4d4f' : parsedRecs?.riskLevel === 'medium' ? '#faad14' : '#52c41a'}
                  format={(p) => <span style={{ fontSize: 20 }}>{p}%</span>}
                />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">Ймовірність поломки</Text>
                </div>
                {parsedRecs?.riskLevel && (
                  <Tag
                    icon={parsedRecs.riskLevel === 'high' ? <WarningOutlined /> : parsedRecs.riskLevel === 'medium' ? <ExclamationCircleOutlined /> : <CheckCircleOutlined />}
                    color={parsedRecs.riskLevel === 'high' ? 'red' : parsedRecs.riskLevel === 'medium' ? 'orange' : 'green'}
                    style={{ marginTop: 8, fontSize: 14, padding: '4px 12px' }}
                  >
                    {parsedRecs.riskLevel === 'high' ? 'Високий ризик' : parsedRecs.riskLevel === 'medium' ? 'Середній ризик' : 'Низький ризик'}
                  </Tag>
                )}
              </div>
            </Col>
            <Col xs={24} sm={16}>
              {latestPrediction.predictedFailureType && (
                <Alert
                  message={<Text strong>Прогнозована поломка</Text>}
                  description={latestPrediction.predictedFailureType}
                  type={parsedRecs?.riskLevel === 'high' ? 'error' : parsedRecs?.riskLevel === 'medium' ? 'warning' : 'info'}
                  showIcon
                  style={{ marginBottom: 12 }}
                />
              )}
              {latestPrediction.geminiAnalysis && (
                <Card size="small" style={{ marginBottom: 12, background: '#fafafa' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Аналіз Gemini AI:</Text>
                  <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>{latestPrediction.geminiAnalysis}</Paragraph>
                </Card>
              )}
              {parsedRecs?.recommendations?.length > 0 && (
                <>
                  <Text strong>Рекомендації:</Text>
                  <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                    {parsedRecs.recommendations.map((r, i) => <li key={i} style={{ marginBottom: 4 }}>{r}</li>)}
                  </ul>
                </>
              )}
              <Text type="secondary" style={{ fontSize: 12 }}>
                Дата прогнозу: {new Date(latestPrediction.createdAt).toLocaleDateString('uk-UA')}
              </Text>
            </Col>
          </Row>
        </Card>
      )}

      {/* Repair history */}
      <Card title="Історія ремонтів">
        <Table
          dataSource={orders}
          rowKey="id"
          pagination={false}
          columns={[
            { title: 'Дата', dataIndex: 'createdAt', render: (d) => new Date(d).toLocaleDateString('uk-UA') },
            { title: 'Опис', dataIndex: 'description', ellipsis: true },
            { title: 'Діагноз', dataIndex: 'diagnosis', ellipsis: true, render: (v) => v || '-' },
            { title: 'Статус', dataIndex: 'status', render: (s) => <Tag color={STATUS_TAG_COLORS[s]}>{STATUS_LABELS[s]}</Tag> },
            { title: 'Вартість', dataIndex: 'totalCost', render: (v) => v ? `${parseFloat(v).toFixed(0)} грн` : '-' },
          ]}
        />
      </Card>
    </div>
  );
};

export default DeviceDetail;
