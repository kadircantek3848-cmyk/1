// src/components/job/SEOJobContent.tsx
import React, { useEffect } from 'react';
import { generateMetaTags, generateJobPostingJsonLd, generateJobUrl } from '../../utils/seoUtils';

interface JobPosting {
  id: string;
  title: string;
  location: string;
  type: string;
  description: string;
  createdAt: number;
  company?: string;
  contactEmail?: string;
  contactPhone?: string;
  experienceLevel?: string;
  educationLevel?: string;
  salary?: string;
  category?: string;
  subCategory?: string;
}

interface Props {
  jobs: JobPosting[];
}

export function SEOJobContent({ jobs }: Props) {
  useEffect(() => {
    jobs.forEach((job) => {
      generateMetaTags({
        title: `${job.title} - ${job.location} | İşBuldum`,
        description: `${job.description.substring(0, 150)}... Hemen başvurun ve kariyerinize yön verin!`,
        keywords: ['iş ilanı', 'garson', 'kasiyer', 'turizm personeli', job.location],
        url: generateJobUrl(job),
        jobData: job,
        cityName: job.location
      });
    });
  }, [jobs]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Türkiye'nin Güncel İş İlanları 2025
        </h1>
        <p className="text-xl text-gray-700">
          İstanbul, Ankara, İzmir ve diğer şehirlerde yüzlerce iş fırsatı sizi bekliyor!
        </p>
      </header>

      {jobs.map((job) => (
        <section key={job.id} className="mb-12 border-b border-gray-200 pb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h2>
          <p className="text-gray-700 mb-2">{job.location}</p>
          <p className="text-gray-700 mb-4">{job.description}</p>
          <a
            href={generateJobUrl(job)}
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Hemen Başvur
          </a>

          {/* JSON-LD schema */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(generateJobPostingJsonLd(job))
            }}
          />
        </section>
      ))}

      <section className="bg-blue-50 border border-blue-200 rounded-xl p-8 mt-12">
        <h2 className="text-3xl font-bold mb-6">Nasıl Başvuru Yapılır?</h2>
        <ol className="space-y-4 text-gray-700 list-decimal list-inside">
          <li>İlgilendiğiniz ilanı seçin.</li>
          <li>Detayları inceleyin.</li>
          <li>Başvuru butonuna tıklayarak başvurun.</li>
          <li>İşveren geri dönüşünü bekleyin.</li>
        </ol>
      </section>
    </div>
  );
}
