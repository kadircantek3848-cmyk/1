import { StrictMode, useEffect } from 'react'; 
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, child } from "firebase/database";

// Firebase config from Netlify env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Dinamik JobPosting Schema oluşturma
function useJobPostingSchema() {
  useEffect(() => {
    async function fetchJobPostings() {
      const dbRef = ref(db);
      try {
        const snapshot = await get(child(dbRef, `jobListings`));
        if (snapshot.exists()) {
          const jobs = snapshot.val();
          const jobPostings = Object.values(jobs).map((job: any) => ({
            "@context": "https://schema.org",
            "@type": "JobPosting",
            "title": job.title,
            "description": job.description,
            "datePosted": job.datePosted,
            "validThrough": job.validThrough,
            "employmentType": job.employmentType,
            "hiringOrganization": {
              "@type": "Organization",
              "name": "İşBuldum",
              "sameAs": "https://isilanlarim.org",
              "logo": "https://isilanlarim.org/logo.png"
            },
            "jobLocation": {
              "@type": "Place",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": job.city,
                "addressRegion": "TR",
                "addressCountry": "TR"
              }
            },
            "url": `https://isilanlarim.org/job/${job.id}`,
            "identifier": {
              "@type": "PropertyValue",
              "name": "job-id",
              "value": job.id
            }
          }));

          const script = document.createElement("script");
          script.type = "application/ld+json";
          script.text = JSON.stringify(jobPostings);
          document.head.appendChild(script);
        } else {
          console.log("No job listings found in Firebase.");
        }
      } catch (error) {
        console.error("Error fetching job listings:", error);
      }
    }

    fetchJobPostings();
  }, []);
}

function RootApp() {
  useJobPostingSchema();
  return <App />;
}

// Performance measurement
if (process.env.NODE_ENV === 'development') {
  const reportWebVitals = (onPerfEntry?: any) => {
    if (onPerfEntry && onPerfEntry instanceof Function) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(onPerfEntry);
        getFID(onPerfEntry);
        getFCP(onPerfEntry);
        getLCP(onPerfEntry);
        getTTFB(onPerfEntry);
      });
    }
  };
  reportWebVitals(console.log);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootApp />
  </StrictMode>
);
