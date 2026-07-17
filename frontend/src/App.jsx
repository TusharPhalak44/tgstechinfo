import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { CookieProvider } from './context/CookieContext';
import { TrackingProvider } from './context/TrackingContext';
 

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};
import { Layout, ConfigProvider, App as AntApp } from 'antd'; // ✅ Import App from antd
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Home from './components/public/Home';
import CookieBanner from './components/common/CookieBanner';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import CookiePolicy from './pages/CookiePolicy';
import DataPrivacyNotice from './pages/DataPrivacyNotice';
import DataRequests from './pages/DataRequests';
import Disclaimer from './pages/Disclaimer';
import AccessibilityStatement from './pages/AccessibilityStatement';
import AcceptableUsePolicy from './pages/AcceptableUsePolicy';
import SecurityStatement from './pages/SecurityStatement';
import VendorList from './pages/VendorList';
import ContactPrivacyOfficer from './pages/ContactPrivacyOfficer';
import ArticleDetail from './components/public/ArticleDetail';
import UserAccountPolicy from './pages/UserAccountPolicy';

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
import ContactUs from './pages/ContactUs';
import StandaloneLandingPage from './pages/StandaloneLandingPage';

const { Content } = Layout;

// Ant Design Theme Configuration
const theme = {
  token: {
    colorPrimary: '#0AAEEF',
    colorSuccess: '#5BBD2B',
    colorWarning: '#F7941D',
    colorError: '#c92a2a',
    colorInfo: '#0AAEEF',
    borderRadius: 8,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    colorText: '#0D2B4E',
    colorTextSecondary: '#2a5070',
    colorBgContainer: '#ffffff',
    colorBorder: '#d0eaf8',
    boxShadow: '0 1px 3px rgba(10,174,239,0.08)',
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
  const authRoutes = ['/login', '/register', '/forgot-password'];
  const standaloneRoutes = ['/content/:slug'];
  const dashboardRoutes = ['/dashboard', '/create-content', '/my-content', '/my-submissions', '/admin', '/admin/users', '/admin/submissions'];
  const location = useLocation();
  const isAuthRoute = authRoutes.includes(location.pathname);
  const isStandaloneRoute = standaloneRoutes.some(route => {
    if (route.includes(':slug')) {
      return location.pathname.startsWith('/content/');
    }
    return location.pathname === route;
  });
  const isDashboardRoute = dashboardRoutes.some(route => {
    if (route.includes(':')) {
      return location.pathname.startsWith(route.split(':')[0]);
    }
    return location.pathname === route;
  });

  return (
    <>
      <ScrollToTop />

      {/* Standalone landing page route - no Navbar/Footer */}
      <Routes>
        <Route path="/content/:slug" element={<StandaloneLandingPage />} />
      </Routes>

      {/* Regular routes with Navbar/Footer */}
      {!isStandaloneRoute && (
        <Layout className="app-layout" style={{ background: '#f8f9fa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {!isAuthRoute && <Navbar />}
          <Content className="app-content" style={{
            minHeight: isAuthRoute ? '100vh' : 'calc(100vh - 120px)',
            background: isAuthRoute ? 'transparent' : '#f8f9fa',
            flex: 1,
            paddingTop: isAuthRoute ? 0 : 61
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
              <Route path="/ebooks" element={<CategoryList />} />
              <Route path="/blogs" element={<CategoryList />} />
              <Route path="/news" element={<CategoryList />} />
              <Route path="/interviews" element={<CategoryList />} />
               <Route path="/user-account-policy" element={<UserAccountPolicy />} />

              <Route path="/webinars" element={<CategoryList />} />
              <Route path="/events" element={<CategoryList />} />
              <Route path="/search" element={<div style={{ padding: '24px' }}><SearchResults /></div>} />
              <Route path="/newsletter" element={<div style={{ padding: '24px' }}><Newsletter /></div>} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-use" element={<TermsOfUse />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/data-privacy-notice" element={<DataPrivacyNotice />} />
              <Route path="/data-requests" element={<DataRequests />} />
              <Route path="/do-not-sell" element={<DataRequests />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              <Route path="/accessibility" element={<AccessibilityStatement />} />
              <Route path="/acceptable-use" element={<AcceptableUsePolicy />} />
              <Route path="/security" element={<SecurityStatement />} />
              <Route path="/vendor-list" element={<VendorList />} />
              <Route path="/contact-privacy-officer" element={<ContactPrivacyOfficer />} />

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
          {!isAuthRoute && <Footer simplified={isDashboardRoute} />}
          <CookieBanner />
        </Layout>
      )}
    </>
  );
}

function App() {
 return (
    <ConfigProvider theme={theme}>
      <CookieProvider>
        <TrackingProvider>
          <AntApp>
            <AppContent />
          </AntApp>
        </TrackingProvider>
      </CookieProvider>
    </ConfigProvider>
  );
}

export default App;