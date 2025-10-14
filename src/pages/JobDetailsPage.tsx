import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { db } from '../lib/firebase';
import { JobDetailsModal } from '../components/job/JobDetailsModal';
import { JobDetails } from '../components/job/JobDetails';
import { generateMetaTags, generateSlug } from '../utils/seoUtils';
import type { JobListing } from '../types';

// Job cache to avoid repeated Firebase calls
const jobCache = new Map<string, { job: JobListing; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function JobDetailsPage() {
  // ✅ DÜZELTME: Artık hem id hem slug alıyoruz
  const { id, slug } = useParams<{ id: string; slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [job, setJob] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if we navigated here from the job list
  const isModalView = location.state?.modal;
  
  // Check if job data was passed from the listing page
  const passedJobData = location.state?.jobData as JobListing | undefined;

  useEffect(() => {
    // Scroll to top only for full page view
    if (!isModalView) {
      window.scrollTo(0, 0);
    }
    
    const fetchJob = async () => {
      try {
        // ✅ DÜZELTME: ID kontrolü
        if (!id || !slug) {
          setError('Geçersiz ilan URL\'si');
          setLoading(false);
          return;
        }

        // 1. ÖNCE: Eğer job data router state'den geliyorsa onu kullan
        if (passedJobData && passedJobData.id === id) {
          setJob(passedJobData);
          updateMetaTags(passedJobData);
          setLoading(false);
          
          // ✅ DÜZELTME: Cache key artık ID
          jobCache.set(id, {
            job: passedJobData,
            timestamp: Date.now()
          });
          return;
        }

        // 2. CACHE KONTROL: Önce cache'den bak (ID ile)
        const cachedJob = getCachedJob(id);
        if (cachedJob) {
          // ✅ Slug doğrulaması - Yanlış slug varsa doğru URL'e yönlendir
          const correctSlug = generateSlug(cachedJob.title);
          if (slug !== correctSlug) {
            console.log('🔄 Redirecting to correct slug:', correctSlug);
            navigate(`/ilan/${id}/${correctSlug}`, { replace: true });
            return;
          }
          
          setJob(cachedJob);
          updateMetaTags(cachedJob);
          setLoading(false);
          return;
        }

        // 3. FIREBASE'DEN ÇEK: ID ile direkt erişim (ÇOK HIZLI! 🚀)
        const foundJob = await fetchJobFromFirebase(id);
        
        if (foundJob) {
          // ✅ Slug doğrulaması
          const correctSlug = generateSlug(foundJob.title);
          if (slug !== correctSlug) {
            console.log('🔄 Redirecting to correct slug:', correctSlug);
            navigate(`/ilan/${id}/${correctSlug}`, { replace: true });
            return;
          }
          
          setJob(foundJob);
          updateMetaTags(foundJob);
          
          // ✅ DÜZELTME: Cache'e kaydet (ID ile)
          jobCache.set(id, {
            job: foundJob,
            timestamp: Date.now()
          });
        } else {
          setError('İlan bulunamadı veya artık aktif değil');
        }
      } catch (err) {
        console.error('Job fetch error:', err);
        setError('İlan yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id, slug, passedJobData, isModalView, navigate]);

  // ✅ DÜZELTME: Cache artık ID bazlı
  const getCachedJob = (jobId: string): JobListing | null => {
    const cached = jobCache.get(jobId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('🎯 Job loaded from cache:', jobId);
      return cached.job;
    }
    return null;
  };

  // ✅ DÜZELTME: Firebase'den direkt ID ile fetch (ÇOK HIZLI!)
  const fetchJobFromFirebase = async (jobId: string): Promise<JobListing | null> => {
    console.log('🔥 Fetching job from Firebase (by ID):', jobId);
    
    try {
      // ✅ Direkt ID ile erişim - En hızlı yöntem!
      const directJobRef = ref(db, `jobs/${jobId}`);
      const snapshot = await get(directJobRef);
      
      if (snapshot.exists()) {
        const jobData = snapshot.val();
        
        // Status kontrolü - aktif ilanları kabul et
        if (jobData.status === 'active' || jobData.status === 'approved' || jobData.status === 'published' || !jobData.status) {
          console.log('✅ Job found:', jobData.title);
          return { id: jobId, ...jobData } as JobListing;
        } else {
          console.warn('⚠️ Job found but not active:', jobData.status);
        }
      } else {
        console.warn('⚠️ Job not found in Firebase:', jobId);
      }
    } catch (error) {
      console.error('❌ Firebase fetch error:', error);
    }
    
    return null;
  };

  // Meta tags güncelle
  const updateMetaTags = (job: JobListing) => {
    generateMetaTags({
      title: `${job.title} - ${job.company}, ${job.location} İş İlanı | İsilanlarim.org`,
      description: `${job.title} pozisyonu için ${job.company} şirketi ${job.location}'da eleman arıyor. ${job.description.substring(0, 100)}... ${job.salary ? `Maaş: ${job.salary}.` : ''} Hemen başvuru yapın!`,
      keywords: [
        job.title.toLowerCase(),
        `${job.title.toLowerCase()} iş ilanı`,
        `${job.title.toLowerCase()} ${job.location.toLowerCase()}`,
        `${job.location.toLowerCase()} ${job.title.toLowerCase()}`,
        `${job.company.toLowerCase()} iş ilanları`,
        `${job.company.toLowerCase()} kariyer`,
        job.category, 
        job.type, 
        job.location, 
        'iş ilanı', 
        'kariyer',
        `${job.location} iş ilanları`,
        `${job.location.toLowerCase()} iş fırsatları`,
        `${job.category} pozisyonu`,
        'güncel iş ilanları',
        'iş fırsatları',
        'eleman ilanları',
        `${job.location.toLowerCase()} eleman ilanları`,
        `${job.category} iş ilanları ${job.location.toLowerCase()}`,
        `${job.location.toLowerCase()} iş ara`,
        `${job.category} iş ilanları`
      ],
      url: window.location.href,
      jobData: job
    });
  };

  // ✅ SCROLL POZİSYONU DÜZELTİLMİŞ handleClose
  const handleClose = () => {
    const previousPath = sessionStorage.getItem('previousPath') || '/';
    const scrollPosition = sessionStorage.getItem('scrollPosition');
    
    // Önce navigate et
    navigate(previousPath, { 
      replace: true,
      state: { 
        restoreScroll: true // Bu flag HomePage'e scroll restore için sinyal verir
      }
    });
    
    // Navigate sonrası scroll pozisyonunu geri yükle
    if (scrollPosition) {
      // requestAnimationFrame kullanarak DOM render olduktan sonra scroll yap
      requestAnimationFrame(() => {
        setTimeout(() => {
          const position = parseInt(scrollPosition, 10);
          window.scrollTo({
            top: position,
            behavior: 'instant' // Anında scroll, smooth değil
          });
          console.log('📍 Scroll restored to:', position);
        }, 50); // Küçük delay - DOM'un render olması için
      });
    }
  };

  // Loading state'i daha hızlı göster
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">İlan detayları yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !job) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">!</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">İlan Bulunamadı</h2>
          <p className="text-gray-600 mb-4">{error || 'Bu ilan artık mevcut değil'}</p>
          <button
            onClick={() => {
              // Ana sayfaya dönerken scroll pozisyonunu temizle
              sessionStorage.removeItem('scrollPosition');
              sessionStorage.removeItem('previousPath');
              navigate('/');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  // Render modal or full page
  return isModalView ? (
    <JobDetailsModal job={job} onClose={handleClose} />
  ) : (
    <JobDetails job={job} />
  );
}

// Cache temizleme utility
export const clearJobCache = () => {
  jobCache.clear();
  console.log('Job cache cleared');
};

// Cache stats utility (debugging için)
export const getJobCacheStats = () => {
  return {
    size: jobCache.size,
    keys: Array.from(jobCache.keys())
  };
};
