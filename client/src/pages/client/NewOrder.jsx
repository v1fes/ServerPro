import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, Button, Typography, Card, message } from 'antd';
import { devicesAPI, ordersAPI } from '../../api';
import { DEVICE_TYPE_LABELS } from '../../utils/constants';

const { Title } = Typography;
const { TextArea } = Input;

const NewOrder = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  useEffect(() => {
    devicesAPI.getAll({ limit: 100 }).then(({ data }) => setDevices(data.devices)).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const values = await form.validateFields();
      await ordersAPI.create(values);
      message.success('Заявку створено!');
      navigate('/client/orders');
    } catch (err) {
      if (err.response) message.error(err.response?.data?.message || 'Помилка створення заявки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Title level={3}>Нова заявка на ремонт</Title>
      <Card style={{ maxWidth: 600 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="deviceId" label="Пристрій" rules={[{ required: true, message: 'Оберіть пристрій' }]}>
            <Select placeholder="Оберіть пристрій"
              options={devices.map((d) => ({
                value: d.id,
                label: `${DEVICE_TYPE_LABELS[d.deviceType]} ${d.brand} ${d.model}`,
              }))} />
          </Form.Item>
          <Form.Item name="description" label="Опис проблеми" rules={[{ required: true, message: 'Опишіть проблему' }]}>
            <TextArea rows={4} placeholder="Детально опишіть проблему з вашим пристроєм" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} size="large">
              Створити заявку
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default NewOrder;
