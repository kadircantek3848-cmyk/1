import React from 'react';
import { useNavigate } from 'react-router-dom';
import { JobForm } from '../components/JobForm';
import { useCreateJob } from '../hooks/useCreateJob';
import { useAuth } from '../hooks/useAuth';
import { JobScraperControls } from '../components/admin/JobScraperControls';
import type { JobFormData } from '../types';
import { Toaster } from 'react-hot-toast';

export function CreateJobPage() {
  const navigate = useNavigate();
  const { createJob, error, isLoading } = useCreateJob();
  const { isAdmin } = useAuth();

  const handleSubmit = async (data: JobFormData) => {
    const success = await createJob(data);
    if (success) {
      // ✅ YENI: Google'a sitemap güncellemesini bildir (arka planda, non-blocking)
      fetch('/.netlify/functions/ping-sitemap', { 
        method: 'POST' 
      }).catch(err => {
        // Hata olsa bile devam et - kritik değil
        console.log('Sitemap ping (non-critical):', err);
      });
      
      // ✅ İlan başarıyla oluşturulduktan sonra ana sayfaya yönlendir
      // Kullanıcı kendi ilanını en üstte görebilsin
      setTimeout(() => {
        navigate('/', { 
          replace: true,
          state: { 
            newJobCreated: true,
            scrollToTop: true 
          }
        });
      }, 2000); // Toast mesajının görünmesi için 2 saniye bekle
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#10B981',
            color: '#FFFFFF',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500'
          },
        }}
      />
      
      <h1 className="text-2xl font-bold mb-6">Yeni İş İlanı Oluştur</h1>
      
      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      {isAdmin && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Admin Kontrolleri</h2>
          <JobScraperControls />
        </div>
      )}

      <JobForm 
        onSubmit={handleSubmit}
        isSubmitting={isLoading}
      />
    </div>
  );
}
