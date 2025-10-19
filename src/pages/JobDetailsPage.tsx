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

  // ✅ Meta tags + JobPosting Schema güncelle
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

    // ✅ JobPosting Schema'sını ekle
    updateJobPostingSchema(job);
  };

  // ✅ YENİDEN YAZILDI: Firebase'den gelen schema verisini kullanır
  const updateJobPostingSchema = (job: JobListing) => {
    // Eski schema varsa sil
    const existingSchema = document.getElementById('jobposting-schema');
    if (existingSchema) {
      existingSchema.remove();
    }

    // ✅ FİREBASE'DEN GELEN SCHEMA VERİSİNİ KULLAN
    // Eğer job.schema yoksa (eski ilanlar), fallback değerler kullan
    const schema = job.schema || {};
    
    // Fallback fonksiyonlar (eski ilanlar için)
    const getFallbackDatePosted = (): string => {
      if (job.createdAt) {
        const timestamp = typeof job.createdAt === 'number' 
          ? (job.createdAt < 10000000000 ? job.createdAt * 1000 : job.createdAt)
          : Date.now();
        return new Date(timestamp).toISOString();
      }
      return new Date().toISOString();
    };

    const getFallbackValidThrough = (): string => {
      const now = new Date();
      now.setDate(now.getDate() + 90); // 90 gün sonrası
      return now.toISOString();
    };

    const getFallbackEmploymentType = (): string => {
      const typeMap: Record<string, string> = {
        'Tam Zamanlı': 'FULL_TIME',
        'Yarı Zamanlı': 'PART_TIME',
        'Freelance': 'CONTRACTOR',
        'Staj': 'INTERN',
        'Stajyer': 'INTERN',
        'Geçici': 'TEMPORARY',
        'Sezonluk': 'TEMPORARY',
        'Sözleşmeli': 'CONTRACTOR'
      };
      return typeMap[job.type] || 'FULL_TIME';
    };

    const getFallbackAddress = () => {
      const parts = job.location.split(',').map(p => p.trim());
      return {
        streetAddress: parts.length > 1 ? parts.slice(1).join(', ') : '',
        addressLocality: parts[0] || job.location,
        addressRegion: parts[0] || job.location,
        postalCode: '34000',
        addressCountry: 'TR'
      };
    };

    // ✅ MAAŞ PARSE (Schema'dan veya fallback)
    const getSalarySchema = () => {
      // Önce Firebase schema'sından al
      if (schema.salaryValue && schema.salaryValue > 0) {
        return {
          "@type": "MonetaryAmount",
          "currency": schema.salaryCurrency || "TRY",
          "value": {
            "@type": "QuantitativeValue",
            "value": schema.salaryValue,
            "unitText": schema.salaryUnit || "MONTH"
          }
        };
      }

      // Fallback: job.salary string'inden parse et
      if (!job.salary || job.salary === 'Belirtilmemiş' || job.salary === '0') {
        return null;
      }

      const salaryStr = job.salary.replace(/\./g, '').replace(/,/g, '');
      const numbers = salaryStr.match(/\d+/g);
      
      if (!numbers || numbers.length === 0) return null;

      // Aralık varsa
      if (numbers.length >= 2) {
        return {
          "@type": "MonetaryAmount",
          "currency": "TRY",
          "value": {
            "@type": "QuantitativeValue",
            "minValue": parseInt(numbers[0]),
            "maxValue": parseInt(numbers[1]),
            "unitText": "MONTH"
          }
        };
      }

      // Tek değer
      return {
        "@type": "MonetaryAmount",
        "currency": "TRY",
        "value": {
          "@type": "QuantitativeValue",
          "value": parseInt(numbers[0]),
          "unitText": "MONTH"
        }
      };
    };

    // ✅ ADRES BİLGİSİ (Schema'dan veya fallback)
    const addressDetail = schema.addressDetail || getFallbackAddress();

    // ✅ GOOGLE SCHEMA OLUŞTUR
    const jobPostingSchema = {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      
      // Temel bilgiler
      "title": job.title,
      "description": job.description,
      
      // ✅ KRİTİK: Tarihler (Firebase schema'dan veya fallback)
      "datePosted": schema.datePosted || getFallbackDatePosted(),
      "validThrough": schema.validThrough || getFallbackValidThrough(),
      
      // ✅ İstihdam tipi (Firebase schema'dan veya fallback)
      "employmentType": schema.employmentType || getFallbackEmploymentType(),
      
      // ✅ İşveren
      "hiringOrganization": {
        "@type": "Organization",
        "name": job.company,
        "sameAs": "https://isilanlarim.org",
        ...(job.companyLogo && { "logo": job.companyLogo })
      },
      
      // ✅ DETAYLI LOKASYON (Firebase schema'dan veya fallback)
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": addressDetail.streetAddress,
          "addressLocality": addressDetail.addressLocality,
          "addressRegion": addressDetail.addressRegion,
          "postalCode": addressDetail.postalCode,
          "addressCountry": addressDetail.addressCountry
        }
      },
      
      // ✅ Maaş (varsa)
      ...(getSalarySchema() && {
        "baseSalary": getSalarySchema()
      }),
      
      // İlan URL'si
      "url": window.location.href,
      
      // Benzersiz ID
      "identifier": {
        "@type": "PropertyValue",
        "name": "job-id",
        "value": job.id
      },
      
      // Opsiyonel alanlar
      ...(job.applicationInstructions && {
        "applicationInstructions": job.applicationInstructions
      }),
      
      ...(job.workHours && {
        "workHours": job.workHours
      }),
      
      ...(job.educationRequirements && {
        "educationRequirements": {
          "@type": "EducationalOccupationalCredential",
          "credentialCategory": job.educationRequirements
        }
      }),
      
      ...(job.experienceRequirements && {
        "experienceRequirements": {
          "@type": "OccupationalExperienceRequirements",
          "monthsOfExperience": job.experienceRequirements
        }
      }),
      
      ...(job.remote && {
        "jobLocationType": "TELECOMMUTE"
      }),
      
      ...(job.skills && {
        "skills": job.skills
      }),
      
      ...(job.responsibilities && {
        "responsibilities": job.responsibilities
      }),
      
      ...(job.benefits && {
        "jobBenefits": job.benefits
      }),
      
      ...(job.industry && {
        "industry": job.industry
      }),
      
      ...(job.category && {
        "occupationalCategory": job.category
      })
    };

    // Schema'yı head'e ekle
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'jobposting-schema';
    script.textContent = JSON.stringify(jobPostingSchema, null, 2);
    document.head.appendChild(script);
    
    console.log('✅ JobPosting Schema added:', {
      title: job.title,
      datePosted: jobPostingSchema.datePosted,
      validThrough: jobPostingSchema.validThrough,
      employmentType: jobPostingSchema.employmentType,
      location: addressDetail.addressLocality,
      hasSchema: !!job.schema,
      hasSalary: !!getSalarySchema()
    });
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
