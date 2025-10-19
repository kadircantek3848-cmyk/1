// src/components/job/SEOJobContent.tsx
import React from 'react';
import { SEOHead } from '../SEOHead';

interface JobPosting {
  title: string;
  location: string;
  employmentType: string;
  url: string;
  description: string;
  datePosted: string;
  validThrough: string;
}

const jobPostings: JobPosting[] = [
  {
    title: 'Garson - Kadıköy, İstanbul',
    location: 'Kadıköy, İstanbul',
    employmentType: 'PART_TIME',
    url: 'https://isilanlarim.org/ilan/garson-kadikoy',
    description: 'Kadıköy\'deki restoranlarda part-time/full-time garson pozisyonu.',
    datePosted: '2025-10-19',
    validThrough: '2025-12-31T23:59:59',
  },
  {
    title: 'Kasiyer - Çankaya, Ankara',
    location: 'Çankaya, Ankara',
    employmentType: 'FULL_TIME',
    url: 'https://isilanlarim.org/ilan/kasiyer-cankaya',
    description: 'Ankara Çankaya bölgesinde market ve AVM kasiyer pozisyonları.',
    datePosted: '2025-10-19',
    validThrough: '2025-12-31T23:59:59',
  },
  {
    title: 'Turizm Personeli - Konak, İzmir',
    location: 'Konak, İzmir',
    employmentType: 'FULL_TIME',
    url: 'https://isilanlarim.org/ilan/turizm-personeli-konak',
    description: 'İzmir Konak ve sahil bölgesindeki otel, restoran ve kafelerde turizm pozisyonları.',
    datePosted: '2025-10-19',
    validThrough: '2025-12-31T23:59:59',
  }
];

export function SEOJobContent() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* SEO Head */}
      <SEOHead
        title="İstanbul, Ankara ve İzmir İş İlanları 2025 | İşBuldum"
        description="Türkiye'nin en güncel iş ilanları platformu. İstanbul, Ankara ve İzmir'de şoför, garson, kasiyer, kurye, çağrı merkezi ve 100+ kategori. Ücretsiz başvuru."
        url="https://isilanlarim.org"
        image="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=630&fit=crop&crop=center"
      />

      {/* Ana Başlık */}
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          İstanbul, Ankara ve İzmir'de Güncel İş İlanları 2025
        </h1>
        <p className="text-xl text-gray-700">
          Ücretsiz başvuru ile yüzlerce iş fırsatı sizi bekliyor. Hemen pozisyonunuza göz atın!
        </p>
      </header>

      {/* Şehir Bazlı İş İlanları */}
      {jobPostings.map((job) => (
        <section key={job.url} className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{job.title}</h2>
          <p className="text-gray-700 mb-4">{job.description}</p>

          {/* JobPosting Schema */}
          <script type="application/ld+json" dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "JobPosting",
              title: job.title,
              description: job.description,
              datePosted: job.datePosted,
              validThrough: job.validThrough,
              employmentType: job.employmentType,
              hiringOrganization: {
                "@type": "Organization",
                name: "İşBuldum",
                sameAs: "https://isilanlarim.org",
                logo: "https://isilanlarim.org/logo.png"
              },
              jobLocation: {
                "@type": "Place",
                address: {
                  "@type": "PostalAddress",
                  addressLocality: job.location.split(',')[0],
                  addressRegion: job.location.split(',')[1],
                  addressCountry: "TR"
                }
              },
              url: job.url
            })
          }} />
        </section>
      ))}

      {/* Nasıl Başvuru Yapılır */}
      <section className="bg-blue-50 border border-blue-200 rounded-xl p-8 mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Nasıl Başvuru Yapılır?</h2>
        <ol className="space-y-4 text-gray-700 list-decimal list-inside">
          <li><strong>İlanı Seçin:</strong> Şehir, kategori veya anahtar kelime ile ilgilendiğiniz pozisyonu bulun.</li>
          <li><strong>Detayları İnceleyin:</strong> Maaş, çalışma saatleri ve firma bilgilerini okuyun.</li>
          <li><strong>Başvurun:</strong> İletişim bilgilerinizi paylaşarak başvurunuzu yapın.</li>
          <li><strong>Geri Dönüş Bekleyin:</strong> İşverenler genellikle 24-48 saat içinde başvuruları değerlendirir.</li>
        </ol>
      </section>

      {/* SSS ve FAQPage Schema */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Sıkça Sorulan Sorular</h2>
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Başvuru ücretsiz mi?</h3>
            <p className="text-gray-700">Evet, İşBuldum'da tüm iş ilanlarına başvuru tamamen ücretsizdir.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">CV gerekli mi?</h3>
            <p className="text-gray-700">Çoğu ilan için CV gerekmez, ancak bazı firmalar isteyebilir.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Part-time iş bulabilir miyim?</h3>
            <p className="text-gray-700">Part-time ve tam zamanlı ilanlar mevcut, filtreleyebilirsiniz.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Deneyimsiz başvurabilir miyim?</h3>
            <p className="text-gray-700">Birçok ilan deneyimsiz adaylara açıktır.</p>
          </div>
        </div>

        {/* FAQPage Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Başvuru ücretsiz mi?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Evet, İşBuldum'da tüm iş ilanlarına başvuru tamamen ücretsizdir."
                }
              },
              {
                "@type": "Question",
                "name": "CV gerekli mi?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Çoğu ilan için CV gerekmez, ancak bazı firmalar isteyebilir."
                }
              },
              {
                "@type": "Question",
                "name": "Part-time iş bulabilir miyim?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Part-time ve tam zamanlı ilanlar mevcut, filtreleyebilirsiniz."
                }
              },
              {
                "@type": "Question",
                "name": "Deneyimsiz başvurabilir miyim?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Birçok ilan deneyimsiz adaylara açıktır."
                }
              }
            ]
          })
        }} />
      </section>

      {/* Neden İşBuldum */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-6">Neden İşBuldum?</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <p>Her gün yeni iş ilanları ekleniyor, 15.000+ aktif fırsat.</p>
          </div>
          <div className="flex items-start gap-3">
            <p>Başvuru ve kullanım tamamen ücretsiz.</p>
          </div>
          <div className="flex items-start gap-3">
            <p>Tek tıkla hızlı başvuru yapabilirsiniz.</p>
          </div>
          <div className="flex items-start gap-3">
            <p>İstanbul, Ankara ve İzmir'de geniş ilan ağı.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
