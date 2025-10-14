const { ref, get } = require('firebase/database');
const { initializeApp } = require('firebase/app');
const { getDatabase } = require('firebase/database');

// ÖNEMLİ: Bu bilgileri environment variable olarak kullanın!
// Netlify dashboard > Site settings > Environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAUmnb0K1M6-U8uzSsYVpTxAAdXdU8I--o",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "btc3-d7d9b.firebaseapp.com",
  databaseURL: process.env.FIREBASE_DATABASE_URL || "https://btc3-d7d9b-default-rtdb.firebaseio.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "btc3-d7d9b",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "btc3-d7d9b.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "444798129246",
  appId: process.env.FIREBASE_APP_ID || "1:444798129246:web:b5c9c03ab05c4303e310cf"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function generateSlug(text) {
  if (!text) return 'ilan';
  
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
}

function parseTimestamp(timestamp) {
  if (!timestamp) return new Date();
  
  // Handle different timestamp formats
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  
  if (typeof timestamp === 'object' && timestamp !== null) {
    // Firebase ServerValue.TIMESTAMP or Firestore Timestamp
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    if (timestamp.toMillis && typeof timestamp.toMillis === 'function') {
      return new Date(timestamp.toMillis());
    }
  }
  
  // Fallback
  return new Date(timestamp);
}

function escapeXml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Priority hesaplama - Yeni ilanlar daha yüksek öncelikli
function calculatePriority(createdAt) {
  const now = Date.now();
  const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);
  
  if (daysSinceCreation < 1) return '1.0';      // Bugünkü ilanlar
  if (daysSinceCreation < 3) return '0.95';     // 3 günden yeni
  if (daysSinceCreation < 7) return '0.9';      // Haftalık
  if (daysSinceCreation < 14) return '0.85';    // 2 haftalık
  if (daysSinceCreation < 30) return '0.8';     // Aylık
  return '0.7';                                  // Eski ilanlar
}

exports.handler = async (event, context) => {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Sitemap jobs generation started...');
    
    const jobsRef = ref(db, 'jobs');
    const snapshot = await get(jobsRef);

    const urls = [];
    const SITE_URL = process.env.SITE_URL || 'https://isilanlarim.org';
    let totalJobs = 0;
    let activeJobs = 0;
    let errorCount = 0;

    if (snapshot.exists()) {
      const allJobs = [];
      
      // Tüm ilanları topla
      snapshot.forEach((childSnapshot) => {
        const job = childSnapshot.val();
        const jobId = childSnapshot.key;
        
        totalJobs++;
        
        // Sadece aktif ilanları işle
        if (job && job.status === 'active') {
          activeJobs++;
          
          // Eksik alanları kontrol et ve varsayılan değerler ata
          const jobData = {
            id: jobId,
            title: job.title || 'İş İlanı',
            company: job.company || 'Şirket',
            location: job.location || 'Türkiye',
            category: job.category || 'diger',
            createdAt: job.createdAt || Date.now(),
            updatedAt: job.updatedAt || job.createdAt || Date.now(),
            status: job.status
          };
          
          allJobs.push(jobData);
        }
      });

      console.log(`📊 Total jobs: ${totalJobs}, Active jobs: ${activeJobs}`);

      // İlanları tarihe göre sırala (yeni olanlar önce)
      allJobs.sort((a, b) => {
        const timeA = a.updatedAt || a.createdAt || 0;
        const timeB = b.updatedAt || b.createdAt || 0;
        return timeB - timeA;
      });

      // Her ilan için URL oluştur
      allJobs.forEach((job, index) => {
        try {
          const slug = generateSlug(job.title);
          const lastmodDate = parseTimestamp(job.updatedAt || job.createdAt);
          const lastmod = lastmodDate.toISOString();
          const priority = calculatePriority(job.createdAt);

          // KRİTİK FİX: Job ID'yi URL'e ekledik!
          // JobCard.tsx ile uyumlu URL formatı
          const jobUrl = `${SITE_URL}/ilan/${job.id}/${slug}`;
          
          urls.push(`
    <url>
      <loc>${escapeXml(jobUrl)}</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>daily</changefreq>
      <priority>${priority}</priority>
    </url>`);

          // İlk 5 ve son 5 ilanı logla
          if (index < 5 || index >= allJobs.length - 5) {
            console.log(`✅ Job ${index + 1}/${allJobs.length}: ${job.title} - Priority: ${priority}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`❌ Error processing job ${job.id}:`, error.message);
        }
      });
    } else {
      console.warn('⚠️ No jobs found in database');
    }

    const generationTime = Date.now() - startTime;
    console.log(`✅ Generated ${urls.length} URLs in ${generationTime}ms`);
    if (errorCount > 0) {
      console.warn(`⚠️ ${errorCount} errors occurred during generation`);
    }

    // Sitemap XML'ini oluştur
    const now = new Date().toISOString();
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <!-- 
    Dinamik İş İlanları Sitemap
    Generated: ${now}
    Total Jobs: ${totalJobs}
    Active Jobs: ${activeJobs}
    URLs Generated: ${urls.length}
    Generation Time: ${generationTime}ms
  -->
${urls.join('')}
</urlset>`;

    // PING İŞLEMİ KALDIRILDI - Sadece yeni ilan eklendiğinde Firebase trigger ile yapılmalı
    // Netlify function her çağrıldığında ping atmak gereksiz ve spam olur

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 saat cache (30 dakikadan artırıldı)
        'X-Robots-Tag': 'noindex',
        'Access-Control-Allow-Origin': '*',
        'X-Total-Jobs': totalJobs.toString(),
        'X-Active-Jobs': activeJobs.toString(),
        'X-URLs-Generated': urls.length.toString(),
        'X-Generation-Time': generationTime.toString(),
        'X-Generated-At': now
      },
      body: sitemap
    };

  } catch (error) {
    console.error('💥 Sitemap generation error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'no-cache'
      },
      body: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- 
    Error generating sitemap
    Error: ${escapeXml(error.message)}
    Generated: ${new Date().toISOString()}
  -->
</urlset>`
    };
  }
};
