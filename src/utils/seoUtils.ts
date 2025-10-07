export function toISO8601Date(timestamp: number): string {
  if (!timestamp || isNaN(timestamp) || timestamp <= 0) {
    return new Date().toISOString();
  }
  return new Date(timestamp).toISOString();
}

export function calculateValidThrough(createdAt: number, daysValid: number = 90): string {
  const validUntil = createdAt + (daysValid * 24 * 60 * 60 * 1000);
  return toISO8601Date(validUntil);
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
    .trim('-')
    .substring(0, 100);
}

export function generateJobUrl(job: any): string {
  const slug = generateSlug(job.title);
  return `/ilan/${slug}`;
}

export function generateJobPostingJsonLd(job: any) {
  const cleanDescription = (job.description || "İş tanımı")
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const fullDescription = cleanDescription.length < 200
    ? cleanDescription + " Detaylı bilgi için ilan sayfasını ziyaret edin. Bu pozisyon için hemen başvurun ve kariyerinize yeni bir yön verin."
    : cleanDescription;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title || "İş İlanı",
    "description": fullDescription.substring(0, 2000),
    "datePosted": toISO8601Date(job.createdAt),
    "validThrough": calculateValidThrough(job.createdAt, 90),
    "employmentType": getEmploymentType(job.type),
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.company || "İşveren",
      "sameAs": "https://isilanlarim.org",
      "logo": "https://isilanlarim.org/logo.png"
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": job.location || "Türkiye",
        "addressRegion": job.location || "Türkiye",
        "addressCountry": "TR"
      }
    },
    "identifier": {
      "@type": "PropertyValue",
      "name": "job-id",
      "value": job.id
    },
    "url": `https://isilanlarim.org/ilan/${generateSlug(job.title)}`
  };

  if (job.experienceLevel) {
    jsonLd["experienceRequirements"] = {
      "@type": "OccupationalExperienceRequirements",
      "monthsOfExperience": getExperienceMonths(job.experienceLevel)
    };
  }

  if (job.educationLevel) {
    jsonLd["educationRequirements"] = {
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": getEducationRequirements(job.educationLevel)
    };
  }

  if (job.salary && job.salary !== "0" && job.salary !== "0₺") {
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

  if (job.type === 'Uzaktan' || job.type === 'Remote') {
    jsonLd["jobLocationType"] = "TELECOMMUTE";
  }

  if (job.contactEmail || job.contactPhone) {
    jsonLd["applicationContact"] = {
      "@type": "ContactPoint",
      "email": job.contactEmail || "info@isilanlarim.org",
      "telephone": job.contactPhone || "+905459772134"
    };
  }

  if (job.category) {
    jsonLd["industry"] = job.category;
  }

  if (job.subCategory) {
    jsonLd["occupationalCategory"] = job.subCategory;
  }

  return jsonLd;
}

// ✅ GÜNCELLENMIŞ generateMetaTags - Google Search Console sorunlarını çözer
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

  // Twitter tags
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

  if (jobData) {
    const existingScript = document.querySelector('script[type="application/ld+json"][data-job="true"]');
    if (existingScript) {
      existingScript.remove();
    }

    const structuredData = generateJobPostingJsonLd(jobData);

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-job', 'true');
    script.textContent = JSON.stringify(structuredData, null, 2);
    document.head.appendChild(script);
  }
}

// ✅ YARDIMCI FONKSİYONLAR - Google'ın kabul ettiği enum değerleri

function getEmploymentType(type: string): string {
  const typeMap: Record<string, string> = {
    'Tam Zamanlı': 'FULL_TIME',
    'Part-time': 'PART_TIME', 
    'Part Time': 'PART_TIME',
    'Yarı Zamanlı': 'PART_TIME',
    'Uzaktan': 'CONTRACTOR',
    'Remote': 'CONTRACTOR',
    'Freelance': 'CONTRACTOR',
    'Sözleşmeli': 'CONTRACTOR',
    'Staj': 'INTERN',
    'İntörnlük': 'INTERN'
  };
  
  return typeMap[type] || 'FULL_TIME';
}

function getExperienceRequirements(level?: string): string {
  if (!level) return 'unspecified';

  const experienceMap: Record<string, string> = {
    'Yeni Mezun': 'entry-level',
    'Deneyimsiz': 'entry-level',
    '0-1 Yıl': 'entry-level',
    '1-2 Yıl': 'associate',
    '2-5 Yıl': 'mid-level',
    '5+ Yıl': 'senior-level',
    'Uzman': 'executive',
    'Yönetici': 'executive'
  };

  return experienceMap[level] || 'unspecified';
}

function getExperienceMonths(level?: string): number {
  if (!level) return 0;

  const monthsMap: Record<string, number> = {
    'Yeni Mezun': 0,
    'Deneyimsiz': 0,
    '0-1 Yıl': 6,
    '1-2 Yıl': 18,
    '2-5 Yıl': 36,
    '5+ Yıl': 60,
    'Uzman': 84,
    'Yönetici': 120
  };

  return monthsMap[level] || 0;
}

function getEducationRequirements(level?: string): string {
  if (!level) return 'unspecified';
  
  const educationMap: Record<string, string> = {
    'İlkokul': 'high-school',
    'Ortaokul': 'high-school', 
    'Lise': 'high-school',
    'Ön Lisans': 'associate-degree',
    'Lisans': 'bachelor-degree',
    'Yüksek Lisans': 'master-degree',
    'Doktora': 'doctorate-degree'
  };
  
  return educationMap[level] || 'unspecified';
}

function extractSalaryAmount(salaryText: string): number {
  if (!salaryText) return 0;
  
  // "15.000₺ - 25.000₺" formatından minimum değeri çıkar
  const numbers = salaryText.match(/[\d.]+/g);
  if (numbers && numbers.length > 0) {
    return parseFloat(numbers[0].replace('.', ''));
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
