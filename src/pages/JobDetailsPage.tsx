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

  // ✅ GOOGLE SCHEMA GEREKSİNİMLERİNE GÖRE TAMAMEN YENİDEN YAZILDI
  const updateJobPostingSchema = (job: JobListing) => {
    // Eski schema varsa sil
    const existingSchema = document.getElementById('jobposting-schema');
    if (existingSchema) {
      existingSchema.remove();
    }

    // ✅ TARİH FONKSİYONLARI
    const formatDate = (timestamp: any): string => {
      // Unix timestamp mı kontrolü
      if (typeof timestamp === 'number') {
        // 10 haneli (saniye) veya 13 haneli (milisaniye) timestamp kontrolü
        const date = timestamp < 10000000000 
          ? new Date(timestamp * 1000) // saniye -> milisaniye
          : new Date(timestamp); // zaten milisaniye
        return date.toISOString();
      }
      // String tarih ise direkt kullan veya ISO'ya çevir
      if (typeof timestamp === 'string') {
        return new Date(timestamp).toISOString();
      }
      // Hiçbiri değilse bugünün tarihi
      return new Date().toISOString();
    };

    // ✅ VALİDTHROUGH TARİHİ (İlan tipine göre)
    const getValidThrough = (): string => {
      const now = new Date();
      let daysToAdd = 30; // Default 30 gün
      
      // İlan tipine göre süre belirle
      if (job.type === 'Stajyer') {
        daysToAdd = 90; // Staj ilanları daha uzun süre açık kalır
      } else if (job.type === 'Sezonluk') {
        daysToAdd = 60; // Sezonluk işler
      } else if (job.urgency === 'urgent' || job.title.toLowerCase().includes('acil')) {
        daysToAdd = 14; // Acil ilanlar
      }
      
      now.setDate(now.getDate() + daysToAdd);
      return now.toISOString();
    };

    // ✅ İSTİHDAM TİPİ MAPPİNG (Google'ın kabul ettiği değerler)
    const getEmploymentType = (): string | string[] => {
      const typeMap: { [key: string]: string | string[] } = {
        'Tam Zamanlı': 'FULL_TIME',
        'Yarı Zamanlı': 'PART_TIME',
        'Stajyer': 'INTERN',
        'Sözleşmeli': 'CONTRACTOR',
        'Geçici': 'TEMPORARY',
        'Sezonluk': 'TEMPORARY',
        'Freelance': 'CONTRACTOR',
        'Gönüllü': 'VOLUNTEER',
        'Diğer': 'OTHER'
      };
      
      // Birden fazla tip olabilir
      if (job.type?.includes(',')) {
        return job.type.split(',').map(t => typeMap[t.trim()] || 'OTHER');
      }
      
      return typeMap[job.type] || 'FULL_TIME';
    };

    // ✅ LOKASYON PARSE (İlçe, Şehir, Posta Kodu)
    const parseLocation = () => {
      const parts = job.location.split(',').map(p => p.trim());
      let locality = parts[0] || job.location;
      let region = parts[1] || parts[0] || job.location;
      
      // Türkiye'nin büyük şehirleri için posta kodu mapping (örnek)
      const postalCodes: { [key: string]: string } = {
        'İstanbul': '34000',
        'Ankara': '06000',
        'İzmir': '35000',
        'Bursa': '16000',
        'Antalya': '07000',
        'Konya': '42000',
        'Adana': '01000',
        'Gaziantep': '27000',
        'Şanlıurfa': '63000',
        'Kocaeli': '41000',
        'Mersin': '33000',
        'Diyarbakır': '21000',
        'Hatay': '31000',
        'Manisa': '45000',
        'Kayseri': '38000',
        'Samsun': '55000',
        'Balıkesir': '10000',
        'Kahramanmaraş': '46000',
        'Van': '65000',
        'Aydın': '09000',
        'Denizli': '20000',
        'Sakarya': '54000',
        'Tekirdağ': '59000',
        'Muğla': '48000',
        'Mardin': '47000',
        'Malatya': '44000'
      };
      
      const postalCode = postalCodes[region] || postalCodes[locality] || '34000';
      
      return { locality, region, postalCode };
    };

    const locationData = parseLocation();

    // ✅ MAAŞ PARSE (Daha akıllı)
    const parseSalarySchema = () => {
      if (!job.salary || job.salary === 'Belirtilmemiş') return null;
      
      const salaryStr = job.salary.replace(/\./g, '').replace(/,/g, '');
      const numbers = salaryStr.match(/\d+/g);
      
      if (!numbers || numbers.length === 0) return null;
      
      // Aralık varsa (min-max)
      if (numbers.length >= 2) {
        const min = parseInt(numbers[0]);
        const max = parseInt(numbers[1]);
        
        return {
          "@type": "MonetaryAmount",
          "currency": "TRY",
          "value": {
            "@type": "QuantitativeValue",
            "minValue": min,
            "maxValue": max,
            "unitText": "MONTH"
          }
        };
      }
      
      // Tek değer
      const value = parseInt(numbers[0]);
      
      // "Asgari ücret" kontrolü
      if (salaryStr.toLowerCase().includes('asgari')) {
        return {
          "@type": "MonetaryAmount",
          "currency": "TRY",
          "value": {
            "@type": "QuantitativeValue",
            "value": 17002, // 2024 asgari ücret
            "unitText": "MONTH"
          }
        };
      }
      
      return {
        "@type": "MonetaryAmount",
        "currency": "TRY",
        "value": {
          "@type": "QuantitativeValue",
          "value": value,
          "unitText": "MONTH"
        }
      };
    };

    // ✅ SCHEMA OLUŞTUR (Google'ın tüm gereksinimlerini karşılayan)
    const schema = {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      "title": job.title,
      "description": job.description,
      
      // ✅ KRİTİK: Tarihler ISO 8601 formatında
      "datePosted": formatDate(job.createdAt),
      "validThrough": getValidThrough(),
      
      // ✅ İstihdam tipi
      "employmentType": getEmploymentType(),
      
      // ✅ İşveren organizasyon
      "hiringOrganization": {
        "@type": "Organization",
        "name": job.company,
        "sameAs": "https://isilanlarim.org",
        ...(job.companyLogo && { "logo": job.companyLogo })
      },
      
      // ✅ DETAYLI LOKASYON (postalCode ve streetAddress dahil)
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": locationData.locality,
          "addressRegion": locationData.region,
          "postalCode": locationData.postalCode,
          "addressCountry": "TR",
          // İsteğe bağlı: Genel bir adres ekleyebiliriz
          "streetAddress": `${locationData.locality}, ${locationData.region}`
        }
      },
      
      // ✅ Maaş bilgisi (varsa ve geçerliyse)
      ...(parseSalarySchema() && {
        "baseSalary": parseSalarySchema()
      }),
      
      // ✅ Başvuru talimatları (varsa)
      ...(job.applicationInstructions && {
        "applicationInstructions": job.applicationInstructions
      }),
      
      // ✅ Çalışma saatleri (varsa)
      ...(job.workHours && {
        "workHours": job.workHours
      }),
      
      // ✅ Eğitim gereksinimleri (varsa)
      ...(job.educationRequirements && {
        "educationRequirements": {
          "@type": "EducationalOccupationalCredential",
          "credentialCategory": job.educationRequirements
        }
      }),
      
      // ✅ Deneyim gereksinimleri (varsa)
      ...(job.experienceRequirements && {
        "experienceRequirements": {
          "@type": "OccupationalExperienceRequirements",
          "monthsOfExperience": job.experienceRequirements
        }
      }),
      
      // ✅ Uzaktan çalışma (varsa)
      ...(job.remote && {
        "jobLocationType": "TELECOMMUTE"
      }),
      
      // ✅ Nitelikler/Beceriler (varsa)
      ...(job.skills && {
        "skills": job.skills
      }),
      
      // ✅ Sorumluluklar (varsa)
      ...(job.responsibilities && {
        "responsibilities": job.responsibilities
      }),
      
      // ✅ İlan URL'si
      "url": window.location.href,
      
      // ✅ Benzersiz tanımlayıcı
      "identifier": {
        "@type": "PropertyValue",
        "name": "job-id",
        "value": job.id
      },
      
      // ✅ Yan haklar (varsa)
      ...(job.benefits && {
        "jobBenefits": job.benefits
      }),
      
      // ✅ Endüstri (varsa)
      ...(job.industry && {
        "industry": job.industry
      }),
      
      // ✅ Meslek kategorisi
      ...(job.category && {
        "occupationalCategory": job.category
      })
    };

    // Schema'yı head'e ekle
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'jobposting-schema';
    script.textContent = JSON.stringify(schema, null, 2);
    document.head.appendChild(script);
    
    console.log('✅ Enhanced JobPosting Schema added:', {
      title: job.title,
      datePosted: schema.datePosted,
      validThrough: schema.validThrough,
      location: locationData
    });
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
