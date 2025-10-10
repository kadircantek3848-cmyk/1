import React, { useState } from 'react';
import { Search, MapPin, Briefcase, TrendingUp, Users, Star, ArrowRight, FileText, Filter, Bell, Bookmark } from 'lucide-react';
import { JobSearchInput } from './JobSearchInput';
import { CategorySearch } from './CategorySearch';
import { LocationSearch } from './LocationSearch';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';

interface SearchHeroProps {
  onSearch: (search: string) => void;
  onLocationChange: (location: string) => void;
  onCategorySelect: (categoryId: string) => void;
  availableCategories?: Set<string>;
}

export function SearchHero({ 
  onSearch, 
  onLocationChange, 
  onCategorySelect,
  availableCategories 
}: SearchHeroProps) {
  const [showCategories, setShowCategories] = useState(false);

  return (
    <section className="search-hero -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/20 to-transparent"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Hero Content */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight animate-fade-in">
            İşBuldum - Türkiye Geneli İş İlanları
          </h1>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white/90 mb-6 animate-slide-up">
            15.000+ Güncel İş İlanı | Her Gün Yeni Fırsatlar
          </h2>
          <p className="text-base sm:text-lg text-white/80 mb-6 max-w-4xl mx-auto leading-relaxed animate-fade-in">
            <strong className="text-white">Şoför, garson, kasiyer, kurye</strong> ve daha fazla pozisyon. 
            <strong className="text-white"> Ücretsiz başvuru</strong> ile hemen iş aramaya başlayın. 
            <strong className="text-white"> İstanbul, Ankara, İzmir</strong> ve tüm Türkiye'den güncel ilanlar.
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 max-w-2xl mx-auto animate-slide-up">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white">15K+</div>
              <div className="text-xs sm:text-sm text-white/70">Aktif İlan</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white">100+</div>
              <div className="text-xs sm:text-sm text-white/70">Günlük Yeni İlan</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white">20+</div>
              <div className="text-xs sm:text-sm text-white/70">Farklı Kategori</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white">81</div>
              <div className="text-xs sm:text-sm text-white/70">İl Kapsamı</div>
            </div>
          </div>
        </div>
        
        {/* Search Form */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-xl max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <JobSearchInput 
                onSearch={onSearch} 
                onFocus={() => setShowCategories(true)}
              />
              {showCategories && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-4">
                  <CategorySearch 
                    onCategorySelect={(category) => {
                      onCategorySelect(category);
                      setShowCategories(false);
                    }}
                    availableCategories={availableCategories}
                  />
                </div>
              )}
            </div>
            <LocationSearch onLocationChange={onLocationChange} />
          </div>

          {/* Popular Cities */}
          <div className="mb-6">
            <p className="text-gray-600 text-sm mb-3 font-medium">Popüler Şehirler:</p>
            <div className="flex flex-wrap gap-2">
              {['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana'].map((city) => (
                <button
                  key={city}
                  onClick={() => onLocationChange(city)}
                  className="bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Popular Job Types */}
          <div className="mb-6">
            <p className="text-gray-600 text-sm mb-3 font-medium">Popüler Pozisyonlar:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Mühendis', category: 'teknoloji' },
                { name: 'Garson', category: 'hizmet' },
                { name: 'Kurye', category: 'lojistik' },
                { name: 'Resepsiyon', category: 'turizm' },
                { name: 'Aşçı Yardımcısı', category: 'hizmet' },
                { name: 'Güvenlik', category: 'guvenlik' }
              ].map((job) => (
                <button
                  key={job.name}
                  onClick={() => onCategorySelect(job.category)}
                  className="bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  {job.name}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/ilan-ver"
              className="btn-primary flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              <Briefcase className="h-5 w-5" />
              Ücretsiz İlan Ver
            </Link>
            <Button
              onClick={() => window.location.href = '/cv-olustur'}
              className="btn-secondary flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              <FileText className="h-4 w-4" />
              CV Oluştur
            </Button>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-600 mb-2 font-medium">Güvenilir ve Ücretsiz Platform</p>
            <div className="flex justify-center items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                %100 Güvenli
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Hızlı Başvuru
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                %100 Ücretsiz
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Günlük Güncelleme
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
