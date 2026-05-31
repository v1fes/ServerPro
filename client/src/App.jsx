import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from './context/AuthContext';
import MainLayout from './components/MainLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminDashboard from './pages/admin/Dashboard';
import AdminOrders from './pages/admin/Orders';
import AdminUsers from './pages/admin/Users';
import AdminParts from './pages/admin/Parts';
import MasterOrders from './pages/master/Orders';
import MasterOrderDetail from './pages/master/OrderDetail';
import ClientOrders from './pages/client/Orders';
import ClientDevices from './pages/client/Devices';
import ClientNewOrder from './pages/client/NewOrder';
import DeviceDetail from './pages/client/DeviceDetail';
import GuestTrack from './pages/guest/TrackOrder';
import OrderDetail from './pages/admin/OrderDetail';
import NotFound from './pages/NotFound';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spin size="large" style={{ display: 'block', margin: '200px auto' }} />;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

const App = () => {
  const { user, loading } = useAuth();

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '200px auto' }} />;

  const getDefaultRoute = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin': return '/admin/dashboard';
      case 'master': return '/master/orders';
      case 'client': return '/client/orders';
      default: return '/login';
    }
  };

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={getDefaultRoute()} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={getDefaultRoute()} /> : <Register />} />
      <Route path="/track" element={<GuestTrack />} />

      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        {/* Admin routes */}
        <Route path="admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="admin/orders" element={<ProtectedRoute roles={['admin']}><AdminOrders /></ProtectedRoute>} />
        <Route path="admin/orders/:id" element={<ProtectedRoute roles={['admin']}><OrderDetail /></ProtectedRoute>} />
        <Route path="admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="admin/parts" element={<ProtectedRoute roles={['admin']}><AdminParts /></ProtectedRoute>} />

        {/* Master routes */}
        <Route path="master/orders" element={<ProtectedRoute roles={['master']}><MasterOrders /></ProtectedRoute>} />
        <Route path="master/orders/:id" element={<ProtectedRoute roles={['master']}><MasterOrderDetail /></ProtectedRoute>} />

        {/* Client routes */}
        <Route path="client/orders" element={<ProtectedRoute roles={['client']}><ClientOrders /></ProtectedRoute>} />
        <Route path="client/orders/new" element={<ProtectedRoute roles={['client']}><ClientNewOrder /></ProtectedRoute>} />
        <Route path="client/devices" element={<ProtectedRoute roles={['client']}><ClientDevices /></ProtectedRoute>} />
        <Route path="client/devices/:id" element={<ProtectedRoute roles={['client']}><DeviceDetail /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
