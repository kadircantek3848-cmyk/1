import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { db } from '../lib/firebase';
import { JobDetailsModal } from '../components/job/JobDetailsModal';
import { JobDetails } from '../components/job/JobDetails';
import { SEO, generateBreadcrumbSchema } from '../components/SEO'; // ✅ YENİ
import { generateSlug } from '../utils/seoUtils';
import type { JobListing } from '../types';

const jobCache = new Map<string, { job: JobListing; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000;

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
            navigate(`/ilan/${id}/${correctSlug}`, { replace: true });
            return;
          }
          
          setJob(cachedJob);
          setLoading(false);
          return;
        }

        const foundJob = await fetchJobFromFirebase(id);
        
        if (foundJob) {
          const correctSlug = generateSlug(foundJob.title);
          if (slug !== correctSlug) {
            navigate(`/ilan/${id}/${correctSlug}`, { replace: true });
            return;
          }
          
          setJob(foundJob);
          
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
      return cached.job;
    }
    return null;
  };

  const fetchJobFromFirebase = async (jobId: string): Promise<JobListing | null> => {
    try {
      const directJobRef = ref(db, `jobs/${jobId}`);
      const snapshot = await get(directJobRef);
      
      if (snapshot.exists()) {
        const jobData = snapshot.val();
        
        if (jobData.status === 'active' || jobData.status === 'approved' || jobData.status === 'published' || !jobData.status) {
          return { id: jobId, ...jobData } as JobListing;
        }
      }
    } catch (error) {
      console.error('❌ Firebase fetch error:', error);
    }
    
    return null;
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
        }, 50);
      });
    }
  };

  // ✅ YENİ: JobPosting Schema
  const getJobPostingSchema = () => {
    if (!job) return null;

    const datePosted = job.createdAt 
      ? new Date(job.createdAt).toISOString()
      : new Date().toISOString();
    
    const validThrough = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    return {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      "title": job.title,
      "description": job.description,
      "datePosted": datePosted,
      "validThrough": validThrough,
      "employmentType": getEmploymentType(job.type),
      "hiringOrganization": {
        "@type": "Organization",
        "name": job.company,
        "sameAs": "https://isilanlarim.org",
        "logo": "https://isilanlarim.org/logo.png"
      },
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": job.location.split(',')[0]?.trim() || job.location,
          "addressRegion": job.location.split(',')[0]?.trim() || job.location,
          "addressCountry": "TR"
        }
      },
      "url": `https://isilanlarim.org/ilan/${job.id}/${generateSlug(job.title)}`,
      "identifier": {
        "@type": "PropertyValue",
        "name": "job-id",
        "value": job.id
      },
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
      })
    };
  };

  const getEmploymentType = (type: string): string => {
    const typeMap: Record<string, string> = {
      'Tam Zamanlı': 'FULL_TIME',
      'Yarı Zamanlı': 'PART_TIME',
      'Freelance': 'CONTRACTOR',
      'Staj': 'INTERN',
      'Uzaktan': 'CONTRACTOR'
    };
    return typeMap[type] || 'FULL_TIME';
  };

  const parseSalary = (salary: string): number => {
    const numbers = salary.match(/\d+/g);
    if (!numbers || numbers.length === 0) return 0;
    return parseInt(numbers[0].replace(/\./g, ''));
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
      <>
        <SEO
          title="İlan Bulunamadı"
          description="Aradığınız iş ilanı bulunamadı veya artık aktif değil."
          noindex={true}
        />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">!</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">İlan Bulunamadı</h2>
            <p className="text-gray-600 mb-4">{error || 'Bu ilan artık mevcut değil'}</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
      </>
    );
  }

  // ✅ Breadcrumb Schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Ana Sayfa', url: '/' },
    { name: `${job.location} İş İlanları`, url: `/${job.location.toLowerCase().replace(/\s/g, '-')}-is-ilanlari` },
    { name: job.title, url: `/ilan/${job.id}/${generateSlug(job.title)}` }
  ]);

  const jobSchema = getJobPostingSchema();

  return (
    <>
      <SEO
        title={`${job.title} - ${job.company}, ${job.location}`}
        description={`${job.title} pozisyonu için ${job.company} şirketi ${job.location}'da eleman arıyor. ${job.description.substring(0, 150)}... ${job.salary ? `Maaş: ${job.salary}.` : ''} Hemen başvuru yapın!`}
        keywords={[
          job.title.toLowerCase(),
          `${job.title.toLowerCase()} iş ilanı`,
          `${job.location.toLowerCase()} ${job.title.toLowerCase()}`,
          job.company.toLowerCase(),
          job.category,
          job.location,
          'iş ilanı'
        ]}
        canonical={`/ilan/${job.id}/${generateSlug(job.title)}`}
        schema={[breadcrumbSchema, jobSchema]}
      />
      {isModalView ? (
        <JobDetailsModal job={job} onClose={handleClose} />
      ) : (
        <JobDetails job={job} />
      )}
    </>
  );
}

export const clearJobCache = () => {
  jobCache.clear();
};

export const getJobCacheStats = () => {
  return {
    size: jobCache.size,
    keys: Array.from(jobCache.keys())
  };
};
