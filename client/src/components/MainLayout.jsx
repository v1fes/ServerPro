import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Badge, Dropdown, Avatar, Space, Typography } from 'antd';
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

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await notificationsAPI.getAll({ unreadOnly: 'true' });
        setUnreadCount(data.unreadCount);
      } catch {
        // ignore
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

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
          <Badge count={unreadCount} size="small">
            <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
          </Badge>
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
