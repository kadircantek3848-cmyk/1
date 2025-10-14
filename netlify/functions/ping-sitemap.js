// netlify/functions/ping-sitemap.js
// Yeni ilan eklendiğinde Google'a otomatik bildirim

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // OPTIONS request için
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Sadece POST kabul et
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const SITE_URL = 'https://isilanlarim.org';
    const sitemapUrl = `${SITE_URL}/sitemap-jobs.xml`;
    
    console.log('🔔 Pinging search engines for sitemap update...');

    const pingUrls = [
      `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
      `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    ];

    // Ping işlemlerini paralel yap
    const results = await Promise.allSettled(
      pingUrls.map(async (url) => {
        try {
          const response = await fetch(url, { 
            method: 'GET',
            signal: AbortSignal.timeout(5000) // 5 saniye timeout
          });
          
          console.log(`✅ Pinged: ${url.includes('google') ? 'Google' : 'Bing'} - Status: ${response.status}`);
          
          return { 
            engine: url.includes('google') ? 'Google' : 'Bing',
            success: true, 
            status: response.status 
          };
        } catch (error) {
          console.error(`❌ Failed to ping: ${url}`, error.message);
          return { 
            engine: url.includes('google') ? 'Google' : 'Bing',
            success: false, 
            error: error.message 
          };
        }
      })
    );

    // Başarı sayısını hesapla
    const successCount = results.filter(r => 
      r.status === 'fulfilled' && r.value.success
    ).length;

    console.log(`✅ Ping completed: ${successCount}/${pingUrls.length} successful`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Sitemap güncellemesi ${successCount} arama motoruna bildirildi`,
        results: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason }),
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('💥 Ping error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
