import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin, Typography, Table, Tag, Segmented } from 'antd';
import {
  FileTextOutlined, CheckCircleOutlined, UserOutlined,
  ToolOutlined, DollarOutlined, ClockCircleOutlined, LaptopOutlined,
} from '@ant-design/icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from 'recharts';
import { analyticsAPI } from '../../api';
import { STATUS_LABELS, STATUS_COLORS, DEVICE_TYPE_LABELS } from '../../utils/constants';

const { Title } = Typography;

const COLORS = ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'];

const CUSTOM_LABEL = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', padding: '10px 14px', border: '1px solid #e8e8e8', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <p style={{ margin: 0, fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: 0, color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [failureStats, setFailureStats] = useState(null);
  const [ordersByPeriod, setOrdersByPeriod] = useState([]);
  const [mastersPerf, setMastersPerf] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodGroup, setPeriodGroup] = useState('month');

  const fetchData = async (groupBy = 'month') => {
    try {
      const [dashRes, failRes, periodRes, mastersRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        analyticsAPI.getFailureStats(),
        analyticsAPI.getOrdersByPeriod({ groupBy }),
        analyticsAPI.getMastersPerformance(),
      ]);
      setStats(dashRes.data);
      setFailureStats(failRes.data);
      setOrdersByPeriod((periodRes.data.data || []).map(item => ({
        ...item,
        count: Number(item.count),
        revenue: Number(item.revenue),
      })));
      setMastersPerf(mastersRes.data.masters || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(periodGroup); }, []);

  const handlePeriodChange = (val) => {
    setPeriodGroup(val);
    fetchData(val);
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const deviceTypeData = (failureStats?.byDeviceType || []).map(item => ({
    ...item,
    name: DEVICE_TYPE_LABELS[item.device_type] || item.device_type,
    count: Number(item.count),
  }));

  const statusData = (failureStats?.byStatus || []).map(item => ({
    ...item,
    name: STATUS_LABELS[item.status] || item.status,
    count: Number(item.count),
  }));

  const brandData = (failureStats?.byBrand || []).map(item => ({
    ...item,
    count: Number(item.count),
  }));

  const repairTypeData = (failureStats?.byRepairType || []).slice(0, 8).map(item => ({
    ...item,
    count: Number(item.count),
  }));

  const monthlyTrends = (failureStats?.monthlyTrends || []).map(item => ({
    ...item,
    total: Number(item.total),
    completed: Number(item.completed),
    revenue: Number(item.revenue),
  }));

  const avgCostData = (failureStats?.avgCostByType || []).map(item => ({
    ...item,
    name: DEVICE_TYPE_LABELS[item.device_type] || item.device_type,
    avg_cost: Number(item.avg_cost),
  }));

  const statCards = [
    { title: 'Всього заявок', value: stats?.totalOrders, icon: <FileTextOutlined />, color: '#1677ff' },
    { title: 'Активні', value: stats?.activeOrders, icon: <ClockCircleOutlined />, color: '#faad14' },
    { title: 'Завершені', value: stats?.completedOrders, icon: <CheckCircleOutlined />, color: '#52c41a' },
    { title: 'Дохід', value: stats?.totalRevenue, icon: <DollarOutlined />, color: '#722ed1', suffix: ' грн', precision: 0 },
    { title: 'Клієнтів', value: stats?.totalClients, icon: <UserOutlined />, color: '#13c2c2' },
    { title: 'Майстрів', value: stats?.totalMasters, icon: <ToolOutlined />, color: '#eb2f96' },
    { title: 'Пристроїв', value: stats?.totalDevices, icon: <LaptopOutlined />, color: '#fa8c16' },
    { title: 'Сер. час ремонту', value: stats?.avgRepairDays, icon: <ClockCircleOutlined />, color: '#1677ff', suffix: ' дн' },
  ];

  const masterColumns = [
    { title: 'Майстер', key: 'name', render: (_, r) => `${r.first_name} ${r.last_name}` },
    { title: 'Спеціалізація', dataIndex: 'specialization', key: 'spec', render: v => v || '—' },
    { title: 'Виконано', dataIndex: 'completed_orders', key: 'completed', sorter: (a, b) => a.completed_orders - b.completed_orders, render: v => <Tag color="green">{v}</Tag> },
    { title: 'Активних', dataIndex: 'active_orders', key: 'active', render: v => <Tag color="orange">{v}</Tag> },
    { title: 'Сер. час (дн.)', dataIndex: 'avg_days', key: 'avg', render: v => Number(v).toFixed(1) },
    { title: 'Дохід (грн)', dataIndex: 'total_revenue', key: 'rev', render: v => Number(v).toLocaleString(), sorter: (a, b) => a.total_revenue - b.total_revenue },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Панель аналітики</Title>
      </div>

      {/* Stat Cards */}
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        {statCards.map((card, i) => (
          <Col xs={12} sm={8} md={6} key={i}>
            <Card hoverable style={{ borderRadius: 12, borderTop: `3px solid ${card.color}` }} styles={{ body: { padding: '16px 20px' } }}>
              <Statistic
                title={<span style={{ fontSize: 13 }}>{card.title}</span>}
                value={card.value}
                prefix={card.icon}
                suffix={card.suffix}
                precision={card.precision}
                valueStyle={{ color: card.color, fontSize: 24 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Row 1: Orders trend + Device type pie */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card
            title="Динаміка заявок"
            extra={
              <Segmented
                size="small"
                options={[
                  { label: 'Дні', value: 'day' },
                  { label: 'Тижні', value: 'week' },
                  { label: 'Місяці', value: 'month' },
                ]}
                value={periodGroup}
                onChange={handlePeriodChange}
              />
            }
            style={{ borderRadius: 12 }}
          >
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={ordersByPeriod}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1677ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1677ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#1677ff" fill="url(#colorCount)" strokeWidth={2} name="Заявки" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="За типом техніки" style={{ borderRadius: 12 }}>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={deviceTypeData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius={100}
                  innerRadius={55}
                  labelLine={false}
                  label={CUSTOM_LABEL}
                  strokeWidth={2}
                >
                  {deviceTypeData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} заявок`, '']} />
                <Legend wrapperStyle={{ fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Row 2: Revenue line + Status pie */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="Тренди по місяцях" style={{ borderRadius: 12 }}>
            {monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line yAxisId="left" type="monotone" dataKey="total" stroke="#1677ff" strokeWidth={2} dot={{ r: 4 }} name="Всього заявок" />
                  <Line yAxisId="left" type="monotone" dataKey="completed" stroke="#52c41a" strokeWidth={2} dot={{ r: 3 }} name="Завершено" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#722ed1" strokeWidth={2.5} dot={{ r: 4 }} name="Дохід (грн)" />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                Недостатньо даних для відображення
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Розподіл за статусами" style={{ borderRadius: 12 }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius={100}
                  innerRadius={55}
                  labelLine={false}
                  label={CUSTOM_LABEL}
                  strokeWidth={2}
                >
                  {statusData.map((item, i) => (
                    <Cell key={i} fill={STATUS_COLORS[item.status] || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} заявок`, '']} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Row 3: Top repairs + Brand stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Топ типів ремонту" style={{ borderRadius: 12 }}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={repairTypeData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#722ed1" name="Кількість" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="По брендах" style={{ borderRadius: 12 }}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={brandData} margin={{ bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="brand" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Кількість" radius={[4, 4, 0, 0]}>
                  {brandData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Row 4: Avg cost + Masters performance */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={8}>
          <Card title="Середня вартість ремонту" style={{ borderRadius: 12 }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={avgCostData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`${v.toLocaleString()} грн`, '']} />
                <Bar dataKey="avg_cost" name="Сер. вартість (грн)" radius={[6, 6, 0, 0]}>
                  {avgCostData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title="Продуктивність майстрів" style={{ borderRadius: 12 }}>
            <Table
              dataSource={mastersPerf}
              columns={masterColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
