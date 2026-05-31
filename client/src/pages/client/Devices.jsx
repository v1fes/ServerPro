import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Modal, Form, Input, Select, DatePicker, Typography, Card, Space, message } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { devicesAPI } from '../../api';
import { DEVICE_TYPE_LABELS } from '../../utils/constants';
import dayjs from 'dayjs';

const { Title } = Typography;

const ClientDevices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const { data } = await devicesAPI.getAll({ limit: 50 });
      setDevices(data.devices);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDevices(); }, []);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      if (values.purchaseDate) values.purchaseDate = values.purchaseDate.format('YYYY-MM-DD');
      await devicesAPI.create(values);
      message.success('Пристрій додано');
      setModalOpen(false);
      form.resetFields();
      fetchDevices();
    } catch (err) {
      if (err.response) message.error(err.response?.data?.message || 'Помилка');
    }
  };

  const columns = [
    { title: 'Тип', dataIndex: 'deviceType', render: (v) => DEVICE_TYPE_LABELS[v] || v },
    { title: 'Бренд', dataIndex: 'brand' },
    { title: 'Модель', dataIndex: 'model' },
    { title: 'Серійний номер', dataIndex: 'serialNumber', render: (v) => v || '-' },
    { title: 'Дата покупки', dataIndex: 'purchaseDate', render: (v) => v ? new Date(v).toLocaleDateString('uk-UA') : '-' },
    {
      title: 'Дії', key: 'actions', width: 80,
      render: (_, r) => <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/client/devices/${r.id}`)} />,
    },
  ];

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Мої пристрої</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>Додати пристрій</Button>
      </div>

      <Table columns={columns} dataSource={devices} rowKey="id" loading={loading} scroll={{ x: 700 }} />

      <Modal title="Додати пристрій" open={modalOpen} onOk={handleCreate} onCancel={() => setModalOpen(false)} okText="Додати">
        <Form form={form} layout="vertical">
          <Form.Item name="deviceType" label="Тип пристрою" rules={[{ required: true }]}>
            <Select options={Object.entries(DEVICE_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          </Form.Item>
          <Form.Item name="brand" label="Бренд" rules={[{ required: true }]}>
            <Input placeholder="Apple, Samsung, Xiaomi..." />
          </Form.Item>
          <Form.Item name="model" label="Модель" rules={[{ required: true }]}>
            <Input placeholder="iPhone 14, Galaxy S23..." />
          </Form.Item>
          <Form.Item name="serialNumber" label="Серійний номер">
            <Input placeholder="Необов'язково" />
          </Form.Item>
          <Form.Item name="purchaseDate" label="Дата покупки">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClientDevices;
