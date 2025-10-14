import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { CreateJobPage } from './pages/CreateJobPage';
import { MyJobsPage } from './pages/MyJobsPage';
import { EditJobPage } from './pages/EditJobPage';
import { JobDetailsPage } from './pages/JobDetailsPage';
import { AccountSettingsPage } from './pages/AccountSettingsPage';
import { AdminPage } from './pages/AdminPage';
import { CategoryPage } from './pages/CategoryPage';
import { LocationPage } from './pages/LocationPage';
import { CVBuilderPage } from './pages/CVBuilderPage';
import { PromoteJobPage } from './pages/PromoteJobPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { PaymentCancelPage } from './pages/PaymentCancelPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { CityJobsPage } from './pages/CityJobsPage';
import { BlogPage } from './pages/BlogPage';
import { BlogPostPage } from './pages/BlogPostPage';
import { BlogCreatePage } from './pages/BlogCreatePage';
import { LiveSupportWidget } from './components/support/LiveSupportWidget';
import { NotFoundPage } from './pages/NotFoundPage';
import { useDailyBlogScheduler } from './hooks/useDailyBlogScheduler';

export function App() {
  // Günlük blog scheduler'ı başlat
  useDailyBlogScheduler();

  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/sayfa/:pageNumber" element={<HomePage />} />
                <Route path="/giris" element={<LoginPage />} />
                <Route path="/kayit" element={<RegisterPage />} />
                <Route path="/sifremi-unuttum" element={<ForgotPasswordPage />} />
                <Route path="/cv-olustur" element={<CVBuilderPage />} />
                <Route path="/gizlilik-politikasi" element={<PrivacyPolicyPage />} />
                
                {/* Blog routes */}
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/yeni" element={<BlogCreatePage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/kariyer-rehberi" element={<BlogPage />} />
                <Route path="/is-arama-rehberi" element={<BlogPage />} />
                
                {/* New competitor-inspired routes */}
                <Route path="/sirketler" element={<CategoryPage />} />
                <Route path="/maas-rehberi" element={<CategoryPage />} />
                
                {/* Payment routes */}
                <Route path="/odeme/basarili" element={<PaymentSuccessPage />} />
                <Route path="/odeme/iptal" element={<PaymentCancelPage />} />
                
                {/* SEO-friendly job routes */}
                <Route path="/is-ilanlari/:category" element={<CategoryPage />} />
                <Route path="/is-ilanlari/:category/sayfa/:pageNumber" element={<CategoryPage />} />
                <Route path="/is-ilanlari/:location/:category?" element={<LocationPage />} />
                <Route path="/is-ilanlari/:location/:category/sayfa/:pageNumber" element={<LocationPage />} />
                <Route path="/yeni-is-ilanlari" element={<HomePage />} />
                <Route path="/yeni-is-ilanlari/sayfa/:pageNumber" element={<HomePage />} />
                <Route path="/guncel-is-ilanlari" element={<HomePage />} />
                <Route path="/guncel-is-ilanlari/sayfa/:pageNumber" element={<HomePage />} />
                <Route path="/part-time-is-ilanlari" element={<CategoryPage />} />
                <Route path="/part-time-is-ilanlari/sayfa/:pageNumber" element={<CategoryPage />} />
                <Route path="/remote-is-ilanlari" element={<CategoryPage />} />
                <Route path="/remote-is-ilanlari/sayfa/:pageNumber" element={<CategoryPage />} />
                <Route path="/freelance-is-ilanlari" element={<CategoryPage />} />
                <Route path="/freelance-is-ilanlari/sayfa/:pageNumber" element={<CategoryPage />} />
                <Route path="/home-office-is-ilanlari" element={<CategoryPage />} />
                <Route path="/home-office-is-ilanlari/sayfa/:pageNumber" element={<CategoryPage />} />
                
                {/* City-based routes */}
                <Route path="/istanbul-is-ilanlari" element={<CityJobsPage />} />
                <Route path="/istanbul-is-ilanlari/sayfa/:pageNumber" element={<CityJobsPage />} />
                <Route path="/ankara-is-ilanlari" element={<CityJobsPage />} />
                <Route path="/ankara-is-ilanlari/sayfa/:pageNumber" element={<CityJobsPage />} />
                <Route path="/izmir-is-ilanlari" element={<CityJobsPage />} />
                <Route path="/izmir-is-ilanlari/sayfa/:pageNumber" element={<CityJobsPage />} />
                <Route path="/bursa-is-ilanlari" element={<CityJobsPage />} />
                <Route path="/bursa-is-ilanlari/sayfa/:pageNumber" element={<CityJobsPage />} />
                <Route path="/antalya-is-ilanlari" element={<CityJobsPage />} />
                <Route path="/antalya-is-ilanlari/sayfa/:pageNumber" element={<CityJobsPage />} />
                <Route path="/adana-is-ilanlari" element={<CityJobsPage />} />
                <Route path="/adana-is-ilanlari/sayfa/:pageNumber" element={<CityJobsPage />} />
                <Route path="/konya-is-ilanlari" element={<CityJobsPage />} />
                <Route path="/konya-is-ilanlari/sayfa/:pageNumber" element={<CityJobsPage />} />
                <Route path="/gaziantep-is-ilanlari" element={<CityJobsPage />} />
                <Route path="/gaziantep-is-ilanlari/sayfa/:pageNumber" element={<CityJobsPage />} />
                
                {/* Additional major cities */}
                <Route path="/mersin-is-ilanlari" element={<CityJobsPage />} />
                <Route path="/diyarbakir-is-ilanlari" element={<CityJobsPage />} />
                <Route path="/kayseri-is-ilanlari" element={<CityJobsPage />} />
                <Route path="/eskisehir-is-ilanlari" element={<CityJobsPage />} />
                <Route path="/samsun-is-ilanlari" element={<CityJobsPage />} />
                <Route path="/denizli-is-ilanlari" element={<CityJobsPage />} />
                <Route path="/sanliurfa-is-ilanlari" element={<CityJobsPage />} />
                <Route path="/malatya-is-ilanlari" element={<CityJobsPage />} />
                <Route path="/trabzon-is-ilanlari" element={<CityJobsPage />} />
                <Route path="/van-is-ilanlari" element={<CityJobsPage />} />
                
                {/* Job type specific routes */}
                <Route path="/yeni-mezun-is-ilanlari" element={<CategoryPage />} />
                <Route path="/yeni-mezun-is-ilanlari/sayfa/:pageNumber" element={<CategoryPage />} />
                <Route path="/deneyimsiz-is-ilanlari" element={<CategoryPage />} />
                <Route path="/deneyimsiz-is-ilanlari/sayfa/:pageNumber" element={<CategoryPage />} />
                <Route path="/staj-ilanlari" element={<CategoryPage />} />
                <Route path="/staj-ilanlari/sayfa/:pageNumber" element={<CategoryPage />} />
                
                {/* Job details with SEO-friendly URL */}
                <Route path="/ilan/:id/:slug" element={<JobDetailsPage />} />
                
                {/* Protected routes */}
                <Route 
                  path="/hesap-ayarlari" 
                  element={
                    <ProtectedRoute>
                      <AccountSettingsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/ilan-ver" 
                  element={
                    <ProtectedRoute>
                      <CreateJobPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/ilanlarim" 
                  element={
                    <ProtectedRoute>
                      <MyJobsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/ilan-duzenle/:id" 
                  element={
                    <ProtectedRoute>
                      <EditJobPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/ilan-one-cikar/:jobId" 
                  element={
                    <ProtectedRoute>
                      <PromoteJobPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute>
                      <AdminPage />
                    </ProtectedRoute>
                  } 
                />

                {/* 404 Page */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </div>
          </main>
          <Footer />
          
          {/* Live Support Widget */}
          <LiveSupportWidget />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
