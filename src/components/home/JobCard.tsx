import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  X,
  MapPin,
  Building2,
  Clock,
  DollarSign,
  Crown,
  Star,
  Bookmark
} from 'lucide-react';
import {
  isToday,
  isYesterday,
  isThisWeek,
  formatDate,
  getTimeAgo,
} from '../../utils/dateUtils';
import { generateJobUrl } from '../../utils/seoUtils';
import { useAuthContext } from '../../contexts/AuthContext';
import { useJobActions } from '../../hooks/useJobActions';
import { PremiumBadge } from '../premium/PremiumBadge';
import { toast } from 'react-hot-toast';
import type { JobListing } from '../../types';

interface JobCardProps {
  job: JobListing;
  onDeleted?: () => void;
}

// Helper function - Başlığı mobilde kısalt
const truncateTitle = (title: string, isMobile: boolean): string => {
  if (!isMobile) return title;
  
  const maxLength = 60; // Mobilde maksimum karakter
  if (title.length <= maxLength) return title;
  
  return title.substring(0, maxLength).trim() + '...';
};

export function JobCard({ job, onDeleted }: JobCardProps) {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuthContext();
  const { deleteJob, isDeleting } = useJobActions();
  
  // Mobil görünüm kontrolü
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 640);
  
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Premium kontrolü
  const isPremium = job.isPremium && job.premiumEndDate && job.premiumEndDate > Date.now();
  const premiumPackage = job.premiumPackage as 'daily' | 'weekly' | 'monthly' | undefined;
  
  const handleJobClick = () => {
    // Scroll pozisyonunu kaydet
    sessionStorage.setItem('scrollPosition', window.scrollY.toString());
    sessionStorage.setItem(
      'previousPath',
      window.location.pathname + window.location.search
    );

    navigate(generateJobUrl(job));
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmMessage = `"${job.title}" ilanını silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.`;

    if (window.confirm(confirmMessage)) {
      try {
        const success = await deleteJob(job.id);
        if (success) {
          toast.success('İlan başarıyla silindi');
          if (onDeleted) onDeleted();
        } else {
          toast.error('İlan silinemedi');
        }
      } catch (error) {
        console.error('İlan silme hatası:', error);
        toast.error('İlan silinirken bir hata oluştu');
      }
    }
  };

  // Tarih kontrolleri
  const isTodayJob = isToday(job.createdAt);
  const isYesterdayJob = isYesterday(job.createdAt);
  const isRecentJob = isThisWeek(job.createdAt) && !isTodayJob && !isYesterdayJob;
  
  // Başlığı mobilde kısalt
  const displayTitle = truncateTitle(job.title, isMobile);

  return (
    <article 
      className={`job-card group cursor-pointer relative touch-manipulation ${
        isPremium ? 'job-card-premium' : ''
      }`} 
      onClick={handleJobClick}
      itemScope 
      itemType="https://schema.org/JobPosting"
    >
      {/* Premium Top Border */}
      {isPremium && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 rounded-t-xl"></div>
      )}
      
      <div className="relative z-10">
        {/* Admin Delete Button */}
        {isAdmin && (
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="absolute top-3 right-3 z-20 p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors touch-target shadow-sm"
            title="İlanı Sil"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Card Content */}
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Company Logo Placeholder */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <Building2 className="h-6 w-6 text-red-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-gray-700 mb-1" itemProp="hiringOrganization">{job.company}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span itemProp="jobLocation" className="truncate">{job.location}</span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <span itemProp="employmentType" className="whitespace-nowrap">{job.type}</span>
                    {job.salary && (
                      <>
                        <span className="text-gray-300 hidden sm:inline">•</span>
                        <span className="text-green-600 font-bold whitespace-nowrap hidden sm:inline">{job.salary}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 📱 MOBİL BAŞLIK - KISALTILMIŞ */}
              <h2 
                className="text-base sm:text-lg md:text-xl font-bold text-gray-900 group-hover:text-red-600 transition-colors leading-tight mb-3 cursor-pointer"
                itemProp="title"
                title={job.title} // Tam başlığı tooltip olarak göster
              >
                {displayTitle}
              </h2>
              
              {/* CTR artırıcı özellikler */}
              <div className="flex flex-wrap gap-2 mb-3">
                {job.salary && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                    <DollarSign className="h-3 w-3" />
                    {job.salary}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold whitespace-nowrap">
                  <Clock className="h-3 w-3" />
                  HEMEN BAŞVUR
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold whitespace-nowrap">
                  <Star className="h-3 w-3" />
                
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0 items-end">
              {/* Premium Badge */}
              {isPremium && premiumPackage && (
                <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full text-xs font-bold whitespace-nowrap">
                  <Crown className="h-3 w-3" />
                  PREMİUM
                </div>
              )}
              
              {/* Date Badges */}
              {isTodayJob && (
                <span className="px-2 sm:px-3 py-1 text-xs font-bold bg-red-500 text-white rounded-full flex items-center gap-1 animate-pulse shadow-lg whitespace-nowrap">
                  <Zap className="h-3 w-3" />
                  <span className="hidden xs:inline">🔥 </span>BUGÜN
                </span>
              )}
              {isYesterdayJob && (
                <span className="px-2 sm:px-3 py-1 text-xs font-bold bg-orange-500 text-white rounded-full flex items-center gap-1 shadow-lg whitespace-nowrap">
                  <Sparkles className="h-3 w-3" />
                  <span className="hidden xs:inline">⚡ </span>DÜN
                </span>
              )}
              {isRecentJob && (
                <span className="px-2 sm:px-3 py-1 text-xs font-bold bg-green-500 text-white rounded-full flex items-center gap-1 shadow-lg whitespace-nowrap">
                  <Star className="h-3 w-3" />
                  <span className="hidden xs:inline">✨ </span>YENİ
                </span>
              )}
            </div>
          </div>
          
          {/* Description Preview */}
          <div className="hidden sm:block">
            <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed font-medium" itemProp="description">
              {job.description}
            </p>
          </div>
          
          {/* Bottom Row */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {/* Apply Button */}
              <button className="px-3 sm:px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap">
                🚀 BAŞVUR
              </button>
              <button className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors shadow-sm">
                <Bookmark className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full">
                <Clock className="h-3 w-3 text-blue-600" />
                <span className="text-xs font-bold text-blue-600">
                  ACİL
                </span>
              </div>
              {job.salary && (
              <div className="hidden sm:flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full shadow-sm">
                <DollarSign className="h-3 w-3 text-green-600" />
                <span className="text-sm font-bold text-green-700">
                  {job.salary}
                </span>
              </div>
              )}
            </div>
          </div>
          
          {/* Time Info */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-500 pt-2 flex-wrap">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDate(job.createdAt)}</span>
            </div>
            <span className="text-gray-400">•</span>
            <span>{getTimeAgo(job.createdAt)}</span>
          </div>
          
          {/* Mobile Description */}
          <div className="sm:hidden">
            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
              {job.description}
            </p>
          </div>

          {/* Category Badge */}
          <div className="flex items-center gap-2 pt-2 flex-wrap">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
              {job.category}
            </span>
            {job.subCategory && job.subCategory !== 'custom' && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
                {job.subCategory}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
