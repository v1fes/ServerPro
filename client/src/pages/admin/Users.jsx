import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, Typography, Card, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { usersAPI } from '../../api';
import { ROLE_LABELS } from '../../utils/constants';

const { Title } = Typography;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await usersAPI.getAll({ page, limit: 15, role: roleFilter || undefined, search: search || undefined });
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page, roleFilter]);

  const openModal = (user = null) => {
    setEditingUser(user);
    if (user) {
      form.setFieldsValue(user);
    } else {
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        await usersAPI.update(editingUser.id, values);
        message.success('Користувача оновлено');
      } else {
        await usersAPI.create(values);
        message.success('Користувача створено');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      if (err.response) message.error(err.response?.data?.message || 'Помилка');
    }
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: 'Деактивувати користувача?',
      onOk: async () => {
        await usersAPI.delete(id);
        message.success('Користувача деактивовано');
        fetchUsers();
      },
    });
  };

  const columns = [
    { title: "Ім'я", render: (_, r) => `${r.firstName} ${r.lastName}` },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Телефон', dataIndex: 'phone', render: (v) => v || '-' },
    { title: 'Роль', dataIndex: 'role', render: (r) => <Tag>{ROLE_LABELS[r]}</Tag> },
    { title: 'Спеціалізація', dataIndex: 'specialization', render: (v) => v || '-' },
    {
      title: 'Статус', dataIndex: 'isActive',
      render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? 'Активний' : 'Неактивний'}</Tag>,
    },
    {
      title: 'Дії', key: 'actions', width: 100,
      render: (_, r) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openModal(r)} />
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Користувачі</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Додати</Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input.Search placeholder="Пошук" value={search} onChange={(e) => setSearch(e.target.value)} onSearch={fetchUsers} style={{ width: 250 }} allowClear />
          <Select placeholder="Роль" value={roleFilter || undefined} onChange={(v) => { setRoleFilter(v || ''); setPage(1); }} allowClear style={{ width: 180 }}
            options={Object.entries(ROLE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
        </Space>
      </Card>

      <Table columns={columns} dataSource={users} rowKey="id" loading={loading}
        pagination={{ current: page, total, pageSize: 15, onChange: setPage }} scroll={{ x: 800 }} />

      <Modal title={editingUser ? 'Редагувати' : 'Новий користувач'} open={modalOpen}
        onOk={handleSubmit} onCancel={() => setModalOpen(false)} okText="Зберегти">
        <Form form={form} layout="vertical">
          <Form.Item name="firstName" label="Ім'я" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="lastName" label="Прізвище" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          {!editingUser && (
            <Form.Item name="password" label="Пароль" rules={[{ required: true, min: 6 }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="phone" label="Телефон">
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Роль" rules={[{ required: true }]}>
            <Select options={Object.entries(ROLE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          </Form.Item>
          <Form.Item name="specialization" label="Спеціалізація">
            <Input placeholder="Для майстрів" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;
