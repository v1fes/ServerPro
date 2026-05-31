import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Typography, Card, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, WarningOutlined, FileExcelOutlined } from '@ant-design/icons';
import { partsAPI } from '../../api';
import { DEVICE_TYPE_LABELS } from '../../utils/constants';
import { exportToExcel } from '../../utils/export';

const { Title } = Typography;

const Parts = () => {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [form] = Form.useForm();

  const fetchParts = async () => {
    setLoading(true);
    try {
      const { data } = await partsAPI.getAll({ page, limit: 15, search: search || undefined });
      setParts(data.parts);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchParts(); }, [page]);

  const openModal = (part = null) => {
    setEditingPart(part);
    if (part) {
      form.setFieldsValue(part);
    } else {
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingPart) {
        await partsAPI.update(editingPart.id, values);
        message.success('Оновлено');
      } else {
        await partsAPI.create(values);
        message.success('Створено');
      }
      setModalOpen(false);
      fetchParts();
    } catch (err) {
      if (err.response) message.error(err.response?.data?.message || 'Помилка');
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Видалити запчастину?',
      onOk: async () => {
        await partsAPI.delete(id);
        message.success('Видалено');
        fetchParts();
      },
    });
  };

  const columns = [
    { title: 'Назва', dataIndex: 'name', ellipsis: true },
    { title: 'Категорія', dataIndex: 'category', render: (v) => v || '-' },
    { title: 'Тип техніки', dataIndex: 'compatibleDeviceType', render: (v) => DEVICE_TYPE_LABELS[v] || v || 'Всі' },
    { title: 'Бренд', dataIndex: 'compatibleBrand', render: (v) => v || 'Всі' },
    { title: 'Ціна', dataIndex: 'price', render: (v) => `${parseFloat(v).toFixed(0)} грн`, sorter: (a, b) => a.price - b.price },
    {
      title: 'На складі', dataIndex: 'quantityInStock',
      render: (v, r) => (
        <span>
          {v <= r.minStockLevel ? <Tag color="red" icon={<WarningOutlined />}>{v}</Tag> : <Tag color="green">{v}</Tag>}
        </span>
      ),
      sorter: (a, b) => a.quantityInStock - b.quantityInStock,
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
        <Title level={3} style={{ margin: 0 }}>Запчастини</Title>
        <Space>
          <Button icon={<FileExcelOutlined />} onClick={() => exportToExcel(parts, [
            { title: 'Назва', dataIndex: 'name' },
            { title: 'Артикул', dataIndex: 'sku' },
            { title: 'Ціна (грн)', dataIndex: 'price' },
            { title: 'Кількість', dataIndex: 'quantity' },
            { title: 'Мін. запас', dataIndex: 'minStockLevel' },
          ], 'parts')}>Excel</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Додати</Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Input.Search placeholder="Пошук запчастин" value={search} onChange={(e) => setSearch(e.target.value)} onSearch={fetchParts} style={{ width: 300 }} allowClear />
      </Card>

      <Table columns={columns} dataSource={parts} rowKey="id" loading={loading}
        pagination={{ current: page, total, pageSize: 15, onChange: setPage }} scroll={{ x: 800 }} />

      <Modal title={editingPart ? 'Редагувати' : 'Нова запчастина'} open={modalOpen}
        onOk={handleSubmit} onCancel={() => setModalOpen(false)} okText="Зберегти" width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Назва" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="category" label="Категорія"><Input /></Form.Item>
          <Form.Item name="compatibleDeviceType" label="Тип техніки">
            <Select allowClear placeholder="Всі" options={Object.entries(DEVICE_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          </Form.Item>
          <Form.Item name="compatibleBrand" label="Бренд"><Input /></Form.Item>
          <Form.Item name="compatibleModel" label="Модель"><Input /></Form.Item>
          <Form.Item name="price" label="Ціна (грн)" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="quantityInStock" label="Кількість на складі" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="minStockLevel" label="Мінімальний запас"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Parts;
