const { ref, get } = require('firebase/database');
const { initializeApp } = require('firebase/app');
const { getDatabase } = require('firebase/database');

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
  
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  
  if (typeof timestamp === 'object' && timestamp !== null) {
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    if (timestamp.toMillis && typeof timestamp.toMillis === 'function') {
      return new Date(timestamp.toMillis());
    }
  }
  
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

function calculatePriority(createdAt) {
  const now = Date.now();
  const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);
  
  if (daysSinceCreation < 1) return '1.0';
  if (daysSinceCreation < 3) return '0.95';
  if (daysSinceCreation < 7) return '0.9';
  if (daysSinceCreation < 14) return '0.85';
  if (daysSinceCreation < 30) return '0.8';
  return '0.7';
}

exports.handler = async (event, context) => {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Sitemap jobs generation started...');
    
    const jobsRef = ref(db, 'jobs');
    const snapshot = await get(jobsRef);

    const urls = [];
    const slugMap = new Map(); // Duplicate slug kontrolü
    const SITE_URL = process.env.SITE_URL || 'https://isilanlarim.org';
    let totalJobs = 0;
    let activeJobs = 0;
    let errorCount = 0;
    let duplicateCount = 0;
    let skippedJobs = 0; // ✅ YENİ: Atlanan ilan sayısı

    if (snapshot.exists()) {
      const allJobs = [];
      
      snapshot.forEach((childSnapshot) => {
        const job = childSnapshot.val();
        const jobId = childSnapshot.key;
        
        totalJobs++;
        
        // ✅ İYİLEŞTİRME: Sadece 'active' ilanları ekle
        // Silinen, süresi dolmuş veya pasif ilanlar otomatik atlanır
        if (job && job.status === 'active') {
          // ✅ YENİ: İlan başlığı ve açıklama kontrolü
          if (!job.title || job.title.trim() === '') {
            skippedJobs++;
            console.warn(`⚠️ SKIPPED: Job ${jobId} - No title`);
            return;
          }
          
          // ✅ YENİ: 90 günden eski ilanları atlayabiliriz (opsiyonel)
          const createdAt = job.createdAt || Date.now();
          const daysSinceCreation = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
          
          if (daysSinceCreation > 90) {
            skippedJobs++;
            console.warn(`⚠️ SKIPPED: Job ${jobId} - Too old (${Math.floor(daysSinceCreation)} days)`);
            return;
          }
          
          activeJobs++;
          
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
        } else {
          // Silinen/pasif ilanlar
          skippedJobs++;
          console.log(`🗑️ SKIPPED: Job ${jobId} - Status: ${job?.status || 'undefined'}`);
        }
      });

      console.log(`📊 Total: ${totalJobs} | Active: ${activeJobs} | Skipped: ${skippedJobs}`);

      // ✅ En yeni ilanlar önce
      allJobs.sort((a, b) => {
        const timeA = a.updatedAt || a.createdAt || 0;
        const timeB = b.updatedAt || b.createdAt || 0;
        return timeB - timeA;
      });

      allJobs.forEach((job, index) => {
        try {
          const slug = generateSlug(job.title);
          const lastmodDate = parseTimestamp(job.updatedAt || job.createdAt);
          const lastmod = lastmodDate.toISOString();
          const priority = calculatePriority(job.createdAt);

          // ✅ YENİ: ID dahil URL formatı (duplicate slug sorunu çözüldü)
          // Eski format: /ilan/{slug}
          // Yeni format: /ilan/{id}/{slug}
          const jobUrl = `${SITE_URL}/ilan/${job.id}/${slug}`;
          
          // ✅ Duplicate slug kontrolü artık ID ile çözüldü, ama yine de log tut
          if (slugMap.has(slug)) {
            duplicateCount++;
            console.warn(`⚠️ DUPLICATE SLUG: "${slug}" - Jobs: ${slugMap.get(slug)} ve ${job.id}`);
            // Artık ID var, her ikisini de ekleyebiliriz
          }
          
          slugMap.set(slug, job.id);
          
          urls.push(`
    <url>
      <loc>${escapeXml(jobUrl)}</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>daily</changefreq>
      <priority>${priority}</priority>
    </url>`);

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
    if (duplicateCount > 0) {
      console.warn(`⚠️ ${duplicateCount} duplicate slugs found (resolved by ID)`);
    }

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
    Skipped Jobs: ${skippedJobs}
    URLs Generated: ${urls.length}
    Duplicate Slugs: ${duplicateCount}
    Generation Time: ${generationTime}ms
    
    ✅ GÜNCELLEME: URL formatı artık ID içeriyor - /ilan/{id}/{slug}
    ✅ OTOMATİK TEMİZLEME: Sadece aktif ilanlar eklenir
    ✅ 90+ günlük eski ilanlar otomatik atlanır
  -->
${urls.join('')}
</urlset>`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-Robots-Tag': 'noindex',
        'Access-Control-Allow-Origin': '*',
        'X-Total-Jobs': totalJobs.toString(),
        'X-Active-Jobs': activeJobs.toString(),
        'X-Skipped-Jobs': skippedJobs.toString(),
        'X-URLs-Generated': urls.length.toString(),
        'X-Duplicate-Slugs': duplicateCount.toString(),
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
