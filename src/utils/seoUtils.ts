// src/utils/seoUtils.ts - DÜZELTILMIŞ VERSIYONU

// ✅ DÜZELTME 1: Sadece tarih formatı (YYYY-MM-DD) - Google'ın istediği format
export function toISO8601Date(timestamp: number): string {
  if (!timestamp || isNaN(timestamp) || timestamp <= 0) {
    const date = new Date();
    return date.toISOString().split('T')[0]; // Sadece tarih kısmı
  }
  const date = new Date(timestamp);
  return date.toISOString().split('T')[0]; // Sadece tarih kısmı
}

// ✅ DÜZELTME 2: validThrough için Google formatı (YYYY-MM-DDTHH:MM)
export function calculateValidThrough(createdAt: number, daysValid: number = 90): string {
  if (!createdAt || isNaN(createdAt) || createdAt <= 0) {
    createdAt = Date.now();
  }
  const validUntil = createdAt + (daysValid * 24 * 60 * 60 * 1000);
  const date = new Date(validUntil);
  
  // Google'ın formatına uygun: "2024-03-18T00:00"
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}T00:00`;
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') // trim yerine regex kullan
    .substring(0, 100);
}

// ✅ KRİTİK DÜZELTME: Job ID eklendi!
export function generateJobUrl(job: any): string {
  const slug = generateSlug(job.title);
  // ✅ YENI: Job ID eklendi - benzersiz URL garantisi
  return `/ilan/${job.id}/${slug}`;
}

// ✅ BONUS: Eski URL'lerden ID çıkarma fonksiyonu
export function extractJobIdFromUrl(pathname: string): string | null {
  // Yeni format: /ilan/{id}/{slug}
  const match = pathname.match(/^\/ilan\/([^\/]+)\/[^\/]+$/);
  if (match) {
    return match[1]; // Job ID'yi döndür
  }
  
  // Eski format: /ilan/{slug} - ID yok
  return null;
}

// ✅ DÜZELTME 3: Lokasyon parsing güçlendirildi
function parseLocation(location: string): { 
  city: string; 
  district: string;
  hasValidLocation: boolean;
} {
  if (!location) {
    return { 
      city: "İzmir", // Varsayılan şehir
      district: "İzmir", // Google için addressLocality ZORUNLU
      hasValidLocation: false 
    };
  }

  // "İzmir, Konak" veya "İzmir - Konak" formatını ayır
  const parts = location.split(/[,\-]/).map(p => p.trim()).filter(p => p);
  
  if (parts.length >= 2) {
    return {
      city: parts[0],
      district: parts[1],
      hasValidLocation: true
    };
  }
  
  // Tek kelime varsa (örn: "İzmir"), hem city hem district olarak kullan
  if (parts.length === 1) {
    return {
      city: parts[0],
      district: parts[0], // addressLocality için aynı değeri kullan
      hasValidLocation: true
    };
  }
  
  return { 
    city: "İzmir",
    district: "İzmir",
    hasValidLocation: false 
  };
}

// ✅ DÜZELTME 4: Google'ın tam gereksinimlerine uygun schema
export function generateJobPostingJsonLd(job: any) {
  // Description temizleme ve minimum uzunluk kontrolü
  const cleanDescription = (job.description || "İş tanımı")
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const fullDescription = cleanDescription.length < 200
    ? cleanDescription + " Detaylı bilgi için ilan sayfasını ziyaret edin. Bu pozisyon için hemen başvurun ve kariyerinize yeni bir yön verin."
    : cleanDescription;

  // Lokasyonu parse et
  const locationData = parseLocation(job.location);

  // ✅ Temel schema yapısı - Google'ın ZORUNLU alanları
  const jsonLd: any = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": job.title || "İş İlanı",
    "description": fullDescription.substring(0, 2000),
    
    // ✅ ZORUNLU: datePosted - sadece tarih formatı (YYYY-MM-DD)
    "datePosted": toISO8601Date(job.createdAt),
    
    // ✅ ÖNERİLEN: validThrough - Google formatı (YYYY-MM-DDTHH:MM)
    "validThrough": calculateValidThrough(job.createdAt, 90),
    
    // ✅ ZORUNLU: employmentType
    "employmentType": getEmploymentType(job.type),
    
    // ✅ ZORUNLU: hiringOrganization
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.company || "İşveren",
      "sameAs": "https://isilanlarim.org",
      "logo": "https://isilanlarim.org/logo.png"
    },
    
    // ✅ ZORUNLU: jobLocation - TAM ADRES YAPISI
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        // ✅ ZORUNLU: addressLocality (şehir içi konum - ilçe/mahalle)
        "addressLocality": locationData.district,
        // ✅ ZORUNLU: addressRegion (il/eyalet)
        "addressRegion": locationData.city,
        // ✅ ZORUNLU: addressCountry
        "addressCountry": "TR"
      }
    },
    
    // ✅ ÖNERİLEN: identifier
    "identifier": {
      "@type": "PropertyValue",
      "name": job.company || "isilanlarim.org",
      "value": job.id || `job-${Date.now()}`
    }
  };

  // ✅ ÖNERİLEN: directApply (başvuru URL'si) - YENİ FORMAT
  const jobUrl = `https://isilanlarim.org${generateJobUrl(job)}`;
  jsonLd["url"] = jobUrl;
  jsonLd["directApply"] = true;
  jsonLd["applicationContact"] = {
    "@type": "ContactPoint",
    "contactType": "HR Department",
    "email": job.contactEmail || "info@isilanlarim.org",
    "telephone": job.contactPhone || "+905459772134"
  };

  // ✅ ÖNERİLEN: Deneyim gereksinimleri
  if (job.experienceLevel) {
    const months = getExperienceMonths(job.experienceLevel);
    if (months >= 0) {
      jsonLd["experienceRequirements"] = {
        "@type": "OccupationalExperienceRequirements",
        "monthsOfExperience": months
      };
    }
  }

  // ✅ ÖNERİLEN: Eğitim gereksinimleri
  if (job.educationLevel) {
    jsonLd["educationRequirements"] = {
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": getEducationRequirements(job.educationLevel)
    };
  }

  // ✅ ÖNERİLEN: Maaş bilgisi
  if (job.salary && job.salary !== "0" && job.salary !== "0₺" && job.salary !== "Belirtilmemiş") {
    const salaryValue = extractSalaryAmount(job.salary);
    if (salaryValue > 0) {
      jsonLd["baseSalary"] = {
        "@type": "MonetaryAmount",
        "currency": "TRY",
        "value": {
          "@type": "QuantitativeValue",
          "value": salaryValue,
          "unitText": "MONTH"
        }
      };
    }
  }

  // ✅ ÖNERİLEN: Uzaktan çalışma
  if (job.type === 'Uzaktan' || job.type === 'Remote') {
    jsonLd["jobLocationType"] = "TELECOMMUTE";
  }

  // ✅ ÖNERİLEN: Sektör bilgisi
  if (job.category) {
    jsonLd["industry"] = job.category;
  }

  if (job.subCategory) {
    jsonLd["occupationalCategory"] = job.subCategory;
  }

  return jsonLd;
}

// ✅ Meta tag yönetimi
export function generateMetaTags(options: {
  title: string;
  description: string;
  keywords: string[];
  url: string;
  jobData?: any;
  cityName?: string;
}) {
  const { title, description, keywords, url, jobData, cityName } = options;

  // Basic meta tags
  document.title = title;
  
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', description);
  }

  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords) {
    metaKeywords.setAttribute('content', keywords.join(', '));
  }

  // Open Graph tags
  updateMetaTag('property', 'og:title', title);
  updateMetaTag('property', 'og:description', description);
  updateMetaTag('property', 'og:url', `https://isilanlarim.org${url}`);
  updateMetaTag('property', 'og:type', 'website');

  // Twitter tags
  updateMetaTag('name', 'twitter:card', 'summary_large_image');
  updateMetaTag('name', 'twitter:title', title);
  updateMetaTag('name', 'twitter:description', description);

  // Canonical URL
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', `https://isilanlarim.org${url}`);

  // ✅ JobPosting Schema - Her sayfa yüklendiğinde güncellenir
  if (jobData) {
    const structuredData = generateJobPostingJsonLd(jobData);

    let schemaScript = document.getElementById('jobposting-schema');
    
    if (schemaScript) {
      schemaScript.textContent = JSON.stringify(structuredData, null, 2);
    } else {
      schemaScript = document.createElement('script');
      schemaScript.type = 'application/ld+json';
      schemaScript.id = 'jobposting-schema';
      schemaScript.textContent = JSON.stringify(structuredData, null, 2);
      document.head.appendChild(schemaScript);
    }
  }
}

// ✅ YARDIMCI FONKSİYONLAR

function getEmploymentType(type: string): string {
  const typeMap: Record<string, string> = {
    'Tam Zamanlı': 'FULL_TIME',
    'Tam Zamanli': 'FULL_TIME',
    'Full Time': 'FULL_TIME',
    'Part-time': 'PART_TIME', 
    'Part Time': 'PART_TIME',
    'Yarı Zamanlı': 'PART_TIME',
    'Yari Zamanli': 'PART_TIME',
    'Uzaktan': 'CONTRACTOR',
    'Remote': 'CONTRACTOR',
    'Freelance': 'CONTRACTOR',
    'Sözleşmeli': 'CONTRACTOR',
    'Sozlesmeli': 'CONTRACTOR',
    'Staj': 'INTERN',
    'Stajyer': 'INTERN',
    'İntern': 'INTERN',
    'Intern': 'INTERN'
  };
  
  return typeMap[type] || 'FULL_TIME';
}

function getExperienceMonths(level?: string): number {
  if (!level) return 0;

  const monthsMap: Record<string, number> = {
    'Yeni Mezun': 0,
    'Deneyimsiz': 0,
    '0-1 Yıl': 6,
    '0-1 Yil': 6,
    '1-2 Yıl': 18,
    '1-2 Yil': 18,
    '2-5 Yıl': 36,
    '2-5 Yil': 36,
    '5+ Yıl': 60,
    '5+ Yil': 60,
    '5-10 Yıl': 84,
    '5-10 Yil': 84,
    'Uzman': 96,
    'Yönetici': 120,
    'Yonetici': 120
  };

  return monthsMap[level] || 0;
}

function getEducationRequirements(level?: string): string {
  if (!level) return 'unspecified';
  
  const educationMap: Record<string, string> = {
    'İlkokul': 'high-school',
    'Ilkokul': 'high-school',
    'Ortaokul': 'high-school', 
    'Lise': 'high-school',
    'Ön Lisans': 'associate-degree',
    'On Lisans': 'associate-degree',
    'Önlisans': 'associate-degree',
    'Lisans': 'bachelor-degree',
    'Yüksek Lisans': 'master-degree',
    'Yuksek Lisans': 'master-degree',
    'Doktora': 'doctorate-degree'
  };
  
  return educationMap[level] || 'unspecified';
}

function extractSalaryAmount(salaryText: string): number {
  if (!salaryText) return 0;
  
  // "15.000₺ - 25.000₺" veya "15000 - 25000" formatından minimum değeri çıkar
  const cleaned = salaryText.replace(/[₺\s]/g, '');
  const numbers = cleaned.match(/[\d.]+/g);
  
  if (numbers && numbers.length > 0) {
    const value = parseFloat(numbers[0].replace(/\./g, ''));
    return isNaN(value) ? 0 : value;
  }
  
  return 0;
}

function updateMetaTag(attribute: string, name: string, content: string) {
  let meta = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}
