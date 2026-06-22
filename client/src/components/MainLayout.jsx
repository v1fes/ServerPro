import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout, Menu, Badge, Dropdown, Avatar, Space, Typography,
  Popover, List, Button, Empty, Spin,
} from 'antd';
import {
  DashboardOutlined, FileTextOutlined, UserOutlined, ToolOutlined,
  AppstoreOutlined, LaptopOutlined, PlusOutlined, BellOutlined,
  LogoutOutlined, SearchOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../api';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const fetchNotifications = async (unreadOnly = false) => {
    try {
      if (!unreadOnly) setNotificationsLoading(true);
      const { data } = await notificationsAPI.getAll(
        unreadOnly ? { unreadOnly: 'true' } : undefined
      );
      setUnreadCount(data.unreadCount);
      if (!unreadOnly) setNotifications(data.notifications);
    } catch {
      // Notifications should not block the rest of the interface.
    } finally {
      if (!unreadOnly) setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    const refreshUnreadCount = () => fetchNotifications(true);
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationsOpen = (open) => {
    setNotificationsOpen(open);
    if (open) fetchNotifications();
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await notificationsAPI.markAsRead(notification.id);
        setNotifications((items) => items.map((item) => (
          item.id === notification.id ? { ...item, isRead: true } : item
        )));
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch {
        // Keep the dropdown usable if the request temporarily fails.
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Keep the dropdown usable if the request temporarily fails.
    }
  };

  const menuItems = {
    admin: [
      { key: '/admin/dashboard', icon: <DashboardOutlined />, label: 'Дашборд' },
      { key: '/admin/orders', icon: <FileTextOutlined />, label: 'Заявки' },
      { key: '/admin/users', icon: <UserOutlined />, label: 'Користувачі' },
      { key: '/admin/parts', icon: <ToolOutlined />, label: 'Запчастини' },
    ],
    master: [
      { key: '/master/orders', icon: <FileTextOutlined />, label: 'Мої заявки' },
    ],
    client: [
      { key: '/client/orders', icon: <FileTextOutlined />, label: 'Мої заявки' },
      { key: '/client/devices', icon: <LaptopOutlined />, label: 'Мої пристрої' },
      { key: '/client/orders/new', icon: <PlusOutlined />, label: 'Нова заявка' },
    ],
  };

  const userMenuItems = [
    { key: 'track', icon: <SearchOutlined />, label: 'Відстеження заявки' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Вийти', danger: true },
  ];

  const handleUserMenu = ({ key }) => {
    if (key === 'logout') logout();
    if (key === 'track') navigate('/track');
  };

  const notificationsContent = (
    <div style={{ width: 360, maxWidth: '80vw' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 8,
      }}>
        <Text strong>Сповіщення</Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={handleMarkAllRead}>
            Прочитати всі
          </Button>
        )}
      </div>
      {notificationsLoading ? (
        <div style={{ padding: 24, textAlign: 'center' }}><Spin /></div>
      ) : notifications.length > 0 ? (
        <List
          dataSource={notifications}
          style={{ maxHeight: 360, overflowY: 'auto' }}
          renderItem={(notification) => (
            <List.Item
              onClick={() => handleNotificationClick(notification)}
              style={{
                cursor: 'pointer',
                padding: '10px 8px',
                background: notification.isRead ? '#fff' : '#f0f7ff',
                borderRadius: 6,
                marginBottom: 4,
              }}
            >
              <List.Item.Meta
                title={
                  <Space size={6}>
                    {!notification.isRead && <Badge status="processing" />}
                    <Text strong={!notification.isRead}>{notification.title}</Text>
                  </Space>
                }
                description={
                  <>
                    <div>{notification.message}</div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {new Date(notification.createdAt).toLocaleString('uk-UA')}
                    </Text>
                  </>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Сповіщень немає" />
      )}
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="logo-text" style={{ color: 'white' }}>
            {collapsed ? 'СП' : 'СервісПро'}
          </span>
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          items={menuItems[user?.role] || []}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
          <Popover
            content={notificationsContent}
            trigger="click"
            placement="bottomRight"
            open={notificationsOpen}
            onOpenChange={handleNotificationsOpen}
          >
            <Badge count={unreadCount} size="small">
              <Button
                type="text"
                aria-label="Відкрити сповіщення"
                icon={<BellOutlined style={{ fontSize: 18 }} />}
              />
            </Badge>
          </Popover>
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenu }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <Text>{user?.firstName} {user?.lastName}</Text>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
