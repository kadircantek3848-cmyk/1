import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useDailyBlogScheduler } from './hooks/useDailyBlogScheduler';

// ✅ Ana sayfa hemen yüklensin (LCP için kritik)
import { HomePage } from './pages/HomePage';

// ✅ Tüm diğer sayfalar lazy load edilsin
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const CreateJobPage = lazy(() => import('./pages/CreateJobPage'));
const MyJobsPage = lazy(() => import('./pages/MyJobsPage'));
const EditJobPage = lazy(() => import('./pages/EditJobPage'));
const JobDetailsPage = lazy(() => import('./pages/JobDetailsPage'));
const AccountSettingsPage = lazy(() => import('./pages/AccountSettingsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const LocationPage = lazy(() => import('./pages/LocationPage'));
const CVBuilderPage = lazy(() => import('./pages/CVBuilderPage'));
const PromoteJobPage = lazy(() => import('./pages/PromoteJobPage'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const PaymentCancelPage = lazy(() => import('./pages/PaymentCancelPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const CityJobsPage = lazy(() => import('./pages/CityJobsPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const BlogCreatePage = lazy(() => import('./pages/BlogCreatePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// ✅ Live Support Widget'ı lazy load et (kritik değil)
const LiveSupportWidget = lazy(() => import('./components/support/LiveSupportWidget').then(module => ({ default: module.LiveSupportWidget })));

// ✅ Loading komponenti - Minimal ve performanslı
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" role="status" aria-label="Yükleniyor">
        <span className="sr-only">Yükleniyor...</span>
      </div>
      <p className="mt-4 text-gray-600 text-sm">Yükleniyor...</p>
    </div>
  </div>
);

// ✅ Küçük loading komponenti (widget için)
const WidgetLoader = () => null; // Widget için loading göstermeye gerek yok

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
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Ana sayfa - Lazy load YOK (kritik) */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/sayfa/:pageNumber" element={<HomePage />} />
                  
                  {/* Auth pages - Lazy load */}
                  <Route path="/giris" element={<LoginPage />} />
                  <Route path="/kayit" element={<RegisterPage />} />
                  <Route path="/sifremi-unuttum" element={<ForgotPasswordPage />} />
                  
                  {/* Utility pages */}
                  <Route path="/cv-olustur" element={<CVBuilderPage />} />
                  <Route path="/gizlilik-politikasi" element={<PrivacyPolicyPage />} />
                  
                  {/* Blog routes */}
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/blog/yeni" element={<BlogCreatePage />} />
                  <Route path="/blog/:slug" element={<BlogPostPage />} />
                  <Route path="/kariyer-rehberi" element={<BlogPage />} />
                  <Route path="/is-arama-rehberi" element={<BlogPage />} />
                  
                  {/* Competitor-inspired routes */}
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
                  
                  {/* City-based routes - Büyük şehirler */}
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
              </Suspense>
            </div>
          </main>
          <Footer />
          
          {/* Live Support Widget - Lazy load */}
          <Suspense fallback={<WidgetLoader />}>
            <LiveSupportWidget />
          </Suspense>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
