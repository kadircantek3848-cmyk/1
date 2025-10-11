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
  const { slug } = useParams<{ slug: string }>();
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
        if (!slug) {
          setError('Geçersiz ilan URL\'si');
          setLoading(false);
          return;
        }

        // 1. ÖNCE: Eğer job data router state'den geliyorsa onu kullan
        if (passedJobData && generateSlug(passedJobData.title) === slug) {
          setJob(passedJobData);
          updateMetaTags(passedJobData);
          setLoading(false);
          
          // Cache'e de ekle
          jobCache.set(slug, {
            job: passedJobData,
            timestamp: Date.now()
          });
          return;
        }

        // 2. CACHE KONTROL: Önce cache'den bak
        const cachedJob = getCachedJob(slug);
        if (cachedJob) {
          setJob(cachedJob);
          updateMetaTags(cachedJob);
          setLoading(false);
          return;
        }

        // 3. FIREBASE'DEN ÇEK: Son çare olarak Firebase'den çek
        const foundJob = await fetchJobFromFirebase(slug);
        
        if (foundJob) {
          setJob(foundJob);
          updateMetaTags(foundJob);
          
          // Cache'e kaydet
          jobCache.set(slug, {
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
  }, [slug, passedJobData, isModalView]);

  // Cache'den job getir
  const getCachedJob = (slug: string): JobListing | null => {
    const cached = jobCache.get(slug);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('🎯 Job loaded from cache:', slug);
      return cached.job;
    }
    return null;
  };

  // Firebase'den optimized job fetch
  const fetchJobFromFirebase = async (slug: string): Promise<JobListing | null> => {
    console.log('🔥 Fetching job from Firebase:', slug);
    
    try {
      // Strategi 1: Job ID'si URL'de varsa (örn: /jobs/job-title-JOB123)
      const jobIdMatch = slug.match(/-([A-Za-z0-9-_]{10,})$/);
      if (jobIdMatch) {
        const jobId = jobIdMatch[1];
        const directJobRef = ref(db, `jobs/${jobId}`);
        const directSnapshot = await get(directJobRef);
        
        if (directSnapshot.exists()) {
          const jobData = directSnapshot.val();
          // Status kontrolünü esnetleyelim - farklı status değerlerini kabul et
          if (jobData.status === 'active' || jobData.status === 'approved' || jobData.status === 'published' || !jobData.status) {
            return { id: jobId, ...jobData } as JobListing;
          }
        }
      }

      // Strategi 2: Son çare - tüm aktif ilanları çek (limit ile)
      const jobsRef = ref(db, 'jobs');
      const snapshot = await get(jobsRef);
      
      if (snapshot.exists()) {
        const allJobs = snapshot.val();
        
        // Sadece aktif ilanları kontrol et
        for (const [jobId, jobData] of Object.entries(allJobs)) {
          const job = jobData as any;
          // Status kontrolünü esnetleyelim - farklı status değerlerini kabul et
          if (job.status === 'active' || job.status === 'approved' || job.status === 'published' || !job.status) {
            const jobSlug = generateSlug(job.title);
            if (jobSlug === slug) {
              return { id: jobId, ...job } as JobListing;
            }
          }
        }
      }
    } catch (error) {
      console.error('Firebase fetch error:', error);
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
