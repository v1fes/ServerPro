import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, message } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await register(values);
      navigate('/client/orders');
    } catch (err) {
      message.error(err.response?.data?.message || 'Помилка реєстрації');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <Title level={2}>🔧 СервісПро</Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
          Реєстрація клієнта
        </Text>
        <Form onFinish={onFinish} layout="vertical" size="large">
          <Form.Item name="firstName" rules={[{ required: true, message: "Введіть ім'я" }]}>
            <Input prefix={<UserOutlined />} placeholder="Ім'я" />
          </Form.Item>
          <Form.Item name="lastName" rules={[{ required: true, message: 'Введіть прізвище' }]}>
            <Input prefix={<UserOutlined />} placeholder="Прізвище" />
          </Form.Item>
          <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Введіть коректний email' }]}>
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>
          <Form.Item name="phone">
            <Input prefix={<PhoneOutlined />} placeholder="Телефон (необов'язково)" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, min: 6, message: 'Мінімум 6 символів' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Пароль" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Зареєструватися
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          <Text>Вже є акаунт? <Link to="/login">Увійти</Link></Text>
        </div>
      </div>
    </div>
  );
};

export default Register;
