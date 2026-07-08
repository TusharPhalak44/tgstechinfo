import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};
import { Layout, ConfigProvider, App as AntApp } from 'antd'; // ✅ Import App from antd
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Home from './components/public/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import ArticleDetail from './components/public/ArticleDetail';
import CategoryList from './components/public/CategoryList';
import Newsletter from './components/public/Newsletter';
import Dashboard from './components/user/Dashboard';
import CreateContent from './components/user/CreateContent';
import MyContent from './components/user/MyContent';
import UserSubmissions from './components/user/UserSubmissions';
import ArticlePreview from './components/user/ArticlePreview';
import AdminDashboard from './components/admin/AdminDashboard';
import UserManagement from './components/admin/UserManagement';
import ArticleReviewPage from './components/admin/ArticleReviewPage';
import AdminEditContent from './components/admin/AdminEditContent';
import AdminSubmissions from './components/admin/AdminSubmissions';
import PrivateRoute from './components/common/PrivateRoute';
import AdminRoute from './components/common/AdminRoute';
import SearchResults from './components/public/SearchResults';

const { Content } = Layout;

// Ant Design Theme Configuration
const theme = {
  token: {
    colorPrimary: '#4a7cff',
    colorSuccess: '#2b8a3e',
    colorWarning: '#e67700',
    colorError: '#c92a2a',
    colorInfo: '#1864ab',
    borderRadius: 8,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    colorText: '#212529',
    colorTextSecondary: '#495057',
    colorBgContainer: '#ffffff',
    colorBorder: '#e9ecef',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    controlHeight: 36,
    controlHeightLG: 40,
    controlHeightSM: 28,
  },
  components: {
    Button: {
      borderRadius: 16,
      controlHeight: 36,
      fontWeight: 500,
    },
    Card: {
      borderRadius: 8,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    },
    Input: {
      borderRadius: 8,
      controlHeight: 36,
    },
    Select: {
      borderRadius: 8,
      controlHeight: 36,
    },
    Table: {
      borderRadius: 8,
    },
    Menu: {
      itemHeight: 40,
      itemFontSize: 13,
      itemColor: '#495057',
    },
    Typography: {
      titleMarginBottom: 16,
    },
  },
};

function AppContent() {
  return (
    <Layout className="app-layout" style={{ background: '#f8f9fa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ScrollToTop />
      <Navbar />
      <Content className="app-content" style={{ 
        minHeight: 'calc(100vh - 120px)',
        background: '#f8f9fa',
        flex: 1,
        paddingTop: 61
      }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/article/:slug" element={<div style={{ padding: '24px' }}><ArticleDetail /></div>} />
          <Route path="/category/:slug" element={<CategoryList />} />
          <Route path="/articles" element={<CategoryList />} />
          <Route path="/blogs" element={<CategoryList />} />
          <Route path="/news" element={<CategoryList />} />
          <Route path="/interviews" element={<CategoryList />} />
          <Route path="/webinars" element={<CategoryList />} />
          <Route path="/events" element={<CategoryList />} />
          <Route path="/search" element={<div style={{ padding: '24px' }}><SearchResults /></div>} />
          <Route path="/newsletter" element={<div style={{ padding: '24px' }}><Newsletter /></div>} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-use" element={<TermsOfUse />} />

          {/* User Routes */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/create-content" element={
            <PrivateRoute>
              <CreateContent />
            </PrivateRoute>
          } />
          <Route path="/edit-content/:id" element={
            <PrivateRoute>
              <CreateContent />
            </PrivateRoute>
          } />
          <Route path="/article-preview/:id" element={
            <PrivateRoute>
              <ArticlePreview />
            </PrivateRoute>
          } />
          <Route path="/my-content" element={
            <PrivateRoute>
              <MyContent />
            </PrivateRoute>
          } />
          <Route path="/my-submissions" element={
            <PrivateRoute>
              <UserSubmissions />
            </PrivateRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/review/:id" element={
            <AdminRoute>
              <ArticleReviewPage />
            </AdminRoute>
          } />
          <Route path="/admin/edit/:id" element={
            <AdminRoute>
              <AdminEditContent />
            </AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          } />
          <Route path="/admin/submissions" element={
            <AdminRoute>
              <AdminSubmissions />
            </AdminRoute>
          } />
        </Routes>
      </Content>
      <Footer />
    </Layout>
  );
}

function App() {
  return (
    <ConfigProvider theme={theme}>
      <AntApp>
        <AppContent />
      </AntApp>
    </ConfigProvider>
  );
}

export default App;