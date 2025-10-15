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
  const { id, slug } = useParams<{ id: string; slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [job, setJob] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isModalView = location.state?.modal;
  const passedJobData = location.state?.jobData as JobListing | undefined;

  useEffect(() => {
    if (!isModalView) {
      window.scrollTo(0, 0);
    }
    
    const fetchJob = async () => {
      try {
        if (!id || !slug) {
          setError('Geçersiz ilan URL\'si');
          setLoading(false);
          return;
        }

        if (passedJobData && passedJobData.id === id) {
          setJob(passedJobData);
          updateMetaTags(passedJobData);
          setLoading(false);
          
          jobCache.set(id, {
            job: passedJobData,
            timestamp: Date.now()
          });
          return;
        }

        const cachedJob = getCachedJob(id);
        if (cachedJob) {
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

        const foundJob = await fetchJobFromFirebase(id);
        
        if (foundJob) {
          const correctSlug = generateSlug(foundJob.title);
          if (slug !== correctSlug) {
            console.log('🔄 Redirecting to correct slug:', correctSlug);
            navigate(`/ilan/${id}/${correctSlug}`, { replace: true });
            return;
          }
          
          setJob(foundJob);
          updateMetaTags(foundJob);
          
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

  const getCachedJob = (jobId: string): JobListing | null => {
    const cached = jobCache.get(jobId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('🎯 Job loaded from cache:', jobId);
      return cached.job;
    }
    return null;
  };

  const fetchJobFromFirebase = async (jobId: string): Promise<JobListing | null> => {
    console.log('🔥 Fetching job from Firebase (by ID):', jobId);
    
    try {
      const directJobRef = ref(db, `jobs/${jobId}`);
      const snapshot = await get(directJobRef);
      
      if (snapshot.exists()) {
        const jobData = snapshot.val();
        
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

  // ✅ DÜZELTILMIŞ: Meta tags + JobPosting Schema güncelle
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

    // ✅ YENİ: JobPosting Schema'sını dinamik ekle
    updateJobPostingSchema(job);
  };

  // ✅ YENİ FONKSİYON: Dinamik JobPosting Schema
  const updateJobPostingSchema = (job: JobListing) => {
    // Eski schema varsa sil
    const existingSchema = document.getElementById('jobposting-schema');
    if (existingSchema) {
      existingSchema.remove();
    }

    // Yeni schema oluştur
    const schema = {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      "title": job.title,
      "description": job.description,
      
      // ✅ KRİTİK: datePosted - İlanın yayın tarihi
      "datePosted": job.createdAt || new Date().toISOString().split('T')[0],
      
      // ✅ Son başvuru tarihi (30 gün sonra)
      "validThrough": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      
      // ✅ Çalışma tipi
      "employmentType": job.type === "Tam Zamanlı" ? "FULL_TIME" : 
                       job.type === "Yarı Zamanlı" ? "PART_TIME" : 
                       job.type === "Stajyer" ? "INTERN" : "FULL_TIME",
      
      // ✅ Firma bilgisi
      "hiringOrganization": {
        "@type": "Organization",
        "name": job.company,
        "sameAs": "https://isilanlarim.org"
      },
      
      // ✅ KRİTİK: Lokasyon detayı
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": job.location.split(',')[0].trim(), // İlçe
          "addressRegion": job.location.split(',')[1]?.trim() || job.location, // Şehir
          "addressCountry": "TR"
        }
      },
      
      // ✅ Maaş bilgisi (varsa)
      ...(job.salary && {
        "baseSalary": {
          "@type": "MonetaryAmount",
          "currency": "TRY",
          "value": {
            "@type": "QuantitativeValue",
            "value": parseSalary(job.salary),
            "unitText": "MONTH"
          }
        }
      }),
      
      // ✅ İlan URL'si
      "url": window.location.href,
      
      // ✅ ID
      "identifier": {
        "@type": "PropertyValue",
        "name": "job-id",
        "value": job.id
      }
    };

    // Schema'yı head'e ekle
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'jobposting-schema';
    script.textContent = JSON.stringify(schema, null, 2);
    document.head.appendChild(script);
    
    console.log('✅ JobPosting Schema updated:', job.title);
  };

  // ✅ YENİ FONKSİYON: Maaş parse helper
  const parseSalary = (salary: string): number => {
    // Sayıları çıkar
    const numbers = salary.match(/\d+/g);
    if (!numbers || numbers.length === 0) return 0;
    
    // Eğer aralık varsa (örn: 15.000 - 20.000) ortalama al
    if (numbers.length >= 2) {
      const min = parseInt(numbers[0]);
      const max = parseInt(numbers[1]);
      return (min + max) / 2;
    }
    
    // Tek sayı varsa onu kullan
    return parseInt(numbers[0]);
  };

  const handleClose = () => {
    const previousPath = sessionStorage.getItem('previousPath') || '/';
    const scrollPosition = sessionStorage.getItem('scrollPosition');
    
    navigate(previousPath, { 
      replace: true,
      state: { 
        restoreScroll: true
      }
    });
    
    if (scrollPosition) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          const position = parseInt(scrollPosition, 10);
          window.scrollTo({
            top: position,
            behavior: 'instant'
          });
          console.log('📍 Scroll restored to:', position);
        }, 50);
      });
    }
  };

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
