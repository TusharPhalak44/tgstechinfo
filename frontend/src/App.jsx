import React, { useEffect, useState } from 'react';

import { Routes, Route, useLocation } from 'react-router-dom';

import { Layout, ConfigProvider, App as AntApp } from 'antd';

import { CookieProvider } from './context/CookieContext';

import { TrackingProvider } from './context/TrackingContext';

import { ThemeProvider, useTheme } from './context/ThemeContext';

import { AuthProvider } from './context/AuthContext';

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

import About from './pages/About';
import Audience from './pages/Audience';
import AudienceIntelligence from './pages/AudienceIntelligence';
import SharedAudienceView from './pages/SharedAudienceView';
import AdminAudienceDashboard from './components/admin/audience/AdminAudienceDashboard';

 



import axios from 'axios';



import CategoryList from './components/public/CategoryList';

import Newsletter from './components/public/Newsletter';

import Dashboard from './components/user/Dashboard';

import CreateContent from './components/user/CreateContent';

import MyContent from './components/user/MyContent';

import UserSubmissions from './components/user/UserSubmissions';

import ArticlePreview from './components/user/ArticlePreview';

import UserProfile from './components/user/UserProfile';

import AdminDashboard from './components/admin/AdminDashboard';

import UserManagement from './components/admin/UserManagement';

import ArticleReviewPage from './components/admin/ArticleReviewPage';

import AdminEditContent from './components/admin/AdminEditContent';

import AdminSubmissions from './components/admin/AdminSubmissions';

import PrivateRoute from './components/common/PrivateRoute';

import AdminRoute from './components/common/AdminRoute';

import DashboardLayout from './components/admin/DashboardLayout';

import UserDashboardLayout from './components/user/UserDashboardLayout';

import DashboardHome from './components/admin/DashboardHome';

import Analytics from './components/admin/Analytics';

import ContentListing from './components/admin/ContentListing';

import AdminContent from './components/admin/AdminContent';

import ContentReview from './components/admin/ContentReview';

import MediaLibrary from './components/admin/MediaLibrary';

import Uploads from './components/admin/Uploads';

import Categories from './components/admin/Categories';

import Integrations from './components/admin/Integrations';

import AuditLogs from './components/admin/AuditLogs';

import Forms from './components/admin/Forms';

import SEO from './components/admin/SEO';

import Roles from './components/admin/Roles';

import Permissions from './components/admin/Permissions';

import SessionManagement from './components/admin/SessionManagement';

import Settings from './components/admin/Settings';

import EmailTemplates from './components/admin/EmailTemplates';

import Tags from './components/admin/Tags';

import SearchResults from './components/public/SearchResults';

import ContactUs from './pages/ContactUs';

import StandaloneLandingPage from './pages/StandaloneLandingPage';

import CaseStudyPage from './pages/CaseStudyPage';

import Unsubscribe from './components/public/Unsubscribe';

import ResetPassword from './pages/ResetPassword';

import { Navigate } from 'react-router-dom';

import { ChatProvider } from './context/ChatContext';

import ChatWidget from './components/common/chatbot/ChatWidget';

import { SiteSettingsProvider, useSiteSettings } from './context/SiteSettingsContext';



const { Content } = Layout;



const ScrollToTop = () => {

  const { pathname } = useLocation();

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return null;

};



// Simple 404 page

const NotFound = () => (

  <div style={{ textAlign: 'center', padding: '80px 24px', background: '#f8f9fa', minHeight: '100vh' }}>

    <h1 style={{ fontSize: 72, fontWeight: 900, color: 'var(--color-primary)', margin: 0 }}>404</h1>

    <p style={{ fontSize: 20, color: 'var(--color-muted)', marginBottom: 32 }}>Page not found</p>

    <a href="/" style={{ background: 'var(--color-accent)', color: '#fff', padding: '12px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 600 }}>

      Back to Home

    </a>

  </div>

);



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

  const { darkMode } = useTheme();

  const { favicon } = useSiteSettings();

  // All URL prefixes that render as a full-screen standalone landing page (no Navbar/Footer)

  // All URL prefixes that render as a full-screen standalone landing page (no Navbar/Footer)

  const STANDALONE_PREFIXES = [
    '/content/',
    '/lp/',
    '/landing-page/',
    '/audience-intelligence',
    '/audience/view/',
    '/audience-intelligence/view/'
  ];

  const dashboardRoutes = ['/dashboard', '/admin', '/user-dashboard'];

  // Auth pages (login/register) are accessed via new tab — hide navbar/footer for them

  const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

  const location = useLocation();

  const isAuthRoute = authRoutes.includes(location.pathname);

  const isStandaloneRoute = STANDALONE_PREFIXES.some(prefix =>

    location.pathname.startsWith(prefix)

  );

  const isDashboardRoute = dashboardRoutes.some(route => {

    if (route.includes(':')) {

      return location.pathname.startsWith(route.split(':')[0]);

    }

    return location.pathname === route || location.pathname.startsWith(route + '/');

  });



  // Apply website favicon from CMS settings

  useEffect(() => {

    if (favicon) {

      let link = document.querySelector("link[rel~='icon']");

      if (!link) {

        link = document.createElement('link');

        link.rel = 'icon';

        link.sizes = '64x64';

        document.head.appendChild(link);

      }

      link.href = favicon;

    }

  }, [favicon]);



  // Load SEO settings and set document title

  useEffect(() => {

    const loadSeoSettings = async () => {

      try {

        const response = await axios.get('/api/seo/settings');

        const seoSettings = response.data;

        if (seoSettings && seoSettings.siteTitle) {

          document.title = seoSettings.siteTitle;

        }

      } catch (error) {

        console.error('Failed to load SEO settings:', error);

        // Set default title if API fails

        document.title = 'TgsTechInfo - Technology Solutions';

      }

    };

    loadSeoSettings();

  }, []);



  return (

    <>

      <ScrollToTop />



      {/* Standalone pages — no Navbar/Footer — served at /content/:slug, /lp/:slug, /landing-page/:slug, /audience-intelligence, or shared audience links */}

      {isStandaloneRoute ? (

        <Routes>

          <Route path="/content/:slug" element={<StandaloneLandingPage />} />

          <Route path="/lp/:slug" element={<StandaloneLandingPage />} />

          <Route path="/landing-page/:slug" element={<StandaloneLandingPage />} />

          <Route path="/audience-intelligence" element={<AudienceIntelligence />} />

          <Route path="/audience/view/:token" element={<SharedAudienceView />} />

          <Route path="/audience-intelligence/view/:token" element={<SharedAudienceView />} />

        </Routes>

      ) : (

        <Layout className="app-layout" style={{ background: darkMode ? '#0f172a' : '#f8f9fa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

          {!isAuthRoute && !isDashboardRoute && <Navbar />}

          <Content className="app-content" style={{

            minHeight: isAuthRoute || isDashboardRoute ? '100vh' : 'auto',

            background: isAuthRoute || isDashboardRoute ? 'transparent' : (darkMode ? '#0f172a' : '#f8f9fa'),

            flex: 1,

            display: 'flex',

            flexDirection: 'column',

            paddingTop: isAuthRoute || isDashboardRoute ? 0 : 61

          }}>

            <Routes>

              {/* Public Routes */}

              <Route path="/" element={<Home />} />

              <Route path="/login" element={<Login />} />

              <Route path="/register" element={<Register />} />

              <Route path="/forgot-password" element={<ForgotPassword />} />

              <Route path="/article/:slug" element={<div style={{ padding: '24px' }}><ArticleDetail /></div>} />

              <Route path="/blog/:slug" element={<div style={{ padding: '24px' }}><ArticleDetail /></div>} />

              <Route path="/news/:slug" element={<div style={{ padding: '24px' }}><ArticleDetail /></div>} />

              <Route path="/interview/:slug" element={<div style={{ padding: '24px' }}><ArticleDetail /></div>} />

              <Route path="/webinar/:slug" element={<div style={{ padding: '24px' }}><ArticleDetail /></div>} />

              <Route path="/event/:slug" element={<div style={{ padding: '24px' }}><ArticleDetail /></div>} />

              <Route path="/ebook/:slug" element={<div style={{ padding: '24px' }}><ArticleDetail /></div>} />

              <Route path="/whitepaper/:slug" element={<div style={{ padding: '24px' }}><ArticleDetail /></div>} />

              <Route path="/report/:slug" element={<div style={{ padding: '24px' }}><ArticleDetail /></div>} />

              <Route path="/whitepapers" element={<CategoryList />} />

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

              <Route path="/unsubscribe" element={<Unsubscribe />} />

              <Route path="/contact" element={<ContactUs />} />

              <Route path="/about" element={<About />} />

              <Route path="/case-study/:slug" element={<CaseStudyPage />} />

              <Route path="/case-studies" element={<CategoryList />} />

              {/* Landing pages listing + direct access */}

              <Route path="/landing-pages" element={<CategoryList />} />

              <Route path="/lp/:slug" element={<StandaloneLandingPage />} />

              <Route path="/landing-page/:slug" element={<StandaloneLandingPage />} />

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

              <Route path="/reset-password" element={<ResetPassword />} />

              <Route path="/audience" element={<Audience />} />

              <Route path="/audience-intelligence" element={<AudienceIntelligence />} />

              <Route path="/audience/view/:token" element={<SharedAudienceView />} />



              {/* Dashboard — Admin gets DashboardLayout */}

              <Route path="/dashboard" element={

                <PrivateRoute>

                  <AdminRoute>

                    <DashboardLayout />

                  </AdminRoute>

                </PrivateRoute>

              }>

                <Route path="analytics" element={<Analytics />} />

                <Route path="content" element={<AdminContent />} />

                <Route path="pending-review" element={<ContentReview />} />

               <Route path="drafts" element={

                  <AdminRoute fallback={<MyContent />}>

                    <ContentListing />

                  </AdminRoute>

                } />

                <Route path="media-library" element={<MediaLibrary />} />

                <Route path="create-post" element={<CreateContent />} />

                <Route path="tags" element={<Tags />} />

                <Route path="media-library" element={<MediaLibrary />} />

                <Route path="uploads" element={<Uploads />} />

                <Route path="categories" element={<Categories />} />

                <Route path="forms" element={<Forms />} />

                <Route path="seo" element={<SEO />} />

                <Route path="users" element={<UserManagement />} />

                <Route path="roles" element={<Roles />} />

                <Route path="permissions" element={<Permissions />} />

                <Route path="audit-logs" element={<AuditLogs />} />

                <Route path="integrations" element={<Integrations />} />

                <Route path="sessions" element={<SessionManagement />} />

                <Route path="profile" element={<UserProfile />} />

                <Route path="settings" element={<Settings />} />

                <Route path="email-templates" element={<EmailTemplates />} />

                <Route index element={<DashboardHome />} />

                <Route path="overview" element={<DashboardHome />} />

                <Route path="my-content" element={<MyContent />} />

                <Route path="my-submissions" element={<UserSubmissions />} />

                <Route path="scheduled" element={<MyContent />} />

              </Route>



              {/* User Dashboard — Regular users get UserDashboardLayout with sidebar+header */}

              <Route path="/user-dashboard" element={

                <PrivateRoute>

                  <UserDashboardLayout />

                </PrivateRoute>

              }>

                <Route index element={<Dashboard />} />

                <Route path="my-content" element={<MyContent />} />

                <Route path="my-submissions" element={<UserSubmissions />} />

                <Route path="create-post" element={<CreateContent />} />

                <Route path="media-library" element={<MediaLibrary />} />

                <Route path="drafts" element={<ContentListing />} />

                <Route path="profile" element={<UserProfile />} />

                <Route path="scheduled" element={<MyContent />} />

              </Route>



              {/* Admin Routes - dedicated admin dashboard route */}

              <Route path="/admin" element={

                <AdminRoute>

                  <DashboardLayout />

                </AdminRoute>

              }>

                <Route index element={<DashboardHome />} />

                <Route path="analytics" element={<Analytics />} />

                <Route path="content" element={<AdminContent />} />

                <Route path="pending-review" element={<ContentReview />} />

                <Route path="drafts" element={<ContentListing />} />

                <Route path="create-post" element={<CreateContent />} />

                <Route path="tags" element={<Tags />} />

                <Route path="media-library" element={<MediaLibrary />} />

                <Route path="uploads" element={<Uploads />} />

                <Route path="categories" element={<Categories />} />

                <Route path="forms" element={<Forms />} />

                <Route path="seo" element={<SEO />} />

                <Route path="users" element={<UserManagement />} />

                <Route path="roles" element={<Roles />} />

                <Route path="permissions" element={<Permissions />} />

                <Route path="audit-logs" element={<AuditLogs />} />

                <Route path="integrations" element={<Integrations />} />

                <Route path="sessions" element={<SessionManagement />} />

                <Route path="profile" element={<UserProfile />} />

                <Route path="settings" element={<Settings />} />

                <Route path="email-templates" element={<EmailTemplates />} />

                <Route path="submissions" element={<AdminSubmissions />} />

                <Route path="review/:id" element={<ArticleReviewPage />} />

                <Route path="edit/:id" element={<AdminEditContent />} />

                <Route path="audience" element={<AdminAudienceDashboard />} />

              </Route>



              {/* Legacy routes - redirect to user-dashboard */}

              <Route path="/create-content" element={<Navigate to="/user-dashboard/create-post" replace />} />

              <Route path="/my-content" element={<Navigate to="/user-dashboard/my-content" replace />} />

              <Route path="/my-submissions" element={<Navigate to="/user-dashboard/my-submissions" replace />} />

              <Route path="/edit-content/:id" element={

                <PrivateRoute>

                  <CreateContent />

                </PrivateRoute>

              } />

              <Route path="/:type-preview/:id" element={

                <PrivateRoute>

                  <ArticlePreview />

                </PrivateRoute>

              } />



              {/* 404 catch-all */}

              <Route path="*" element={<NotFound />} />

            </Routes>

          </Content>

          {!isAuthRoute && !isDashboardRoute && <Footer />}

          <CookieBanner />

        </Layout>

      )}

    </>

  );

}



function App() {

 return (

    <ConfigProvider theme={theme}>

      <AuthProvider>

        <ThemeProvider>

          <SiteSettingsProvider>

            <CookieProvider>

              <TrackingProvider>

                <ChatProvider>

                  <AntApp>

                    <AppContent />

                    <ChatWidget />

                  </AntApp>

                </ChatProvider>

              </TrackingProvider>

            </CookieProvider>

          </SiteSettingsProvider>

        </ThemeProvider>

      </AuthProvider>

    </ConfigProvider>

  );

}



export default App;

