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
  
  // Job URL'ini oluştur
  const jobUrl = generateJobUrl(job);
  
  const handleCardClick = (e: React.MouseEvent) => {
    // Eğer link veya buton tıklanmışsa, card click'i çalıştırma
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('button')) {
      return;
    }
    
    // Scroll pozisyonunu kaydet ve yönlendir
    sessionStorage.setItem('scrollPosition', window.scrollY.toString());
    sessionStorage.setItem(
      'previousPath',
      window.location.pathname + window.location.search
    );
    navigate(jobUrl);
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

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

  return (
    <article 
      className={`group relative touch-manipulation bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-3 sm:p-5 ${
        isPremium ? 'ring-2 ring-purple-400' : ''
      }`}
      onClick={handleCardClick}
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
            className="absolute -top-1 -right-1 sm:top-2 sm:right-2 z-20 p-1.5 sm:p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors touch-target shadow-sm"
            title="İlanı Sil"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        )}

        {/* Card Content */}
        <div className="space-y-3">
          {/* Header - Company Info */}
          <div className="flex items-start gap-2.5 sm:gap-3">
            {/* Company Logo */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-100 to-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
            </div>
            
            {/* Company & Location Info */}
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-bold text-gray-700 mb-0.5 sm:mb-1 truncate" itemProp="hiringOrganization">
                {job.company}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span itemProp="jobLocation" className="truncate">{job.location}</span>
                <span className="text-gray-300">•</span>
                <span itemProp="employmentType" className="whitespace-nowrap">{job.type}</span>
              </div>
            </div>

            {/* Date & Premium Badges */}
            <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
              {isPremium && (
                <div className="flex items-center gap-0.5 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full text-[10px] sm:text-xs font-bold whitespace-nowrap">
                  <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span className="hidden xs:inline">PREMİUM</span>
                  <span className="xs:hidden">PRO</span>
                </div>
              )}
              {isTodayJob && (
                <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold bg-red-500 text-white rounded-full flex items-center gap-0.5 animate-pulse shadow-sm whitespace-nowrap">
                  <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  BUGÜN
                </span>
              )}
              {isYesterdayJob && (
                <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold bg-orange-500 text-white rounded-full flex items-center gap-0.5 shadow-sm whitespace-nowrap">
                  <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  DÜN
                </span>
              )}
              {isRecentJob && (
                <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold bg-green-500 text-white rounded-full flex items-center gap-0.5 shadow-sm whitespace-nowrap">
                  <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  YENİ
                </span>
              )}
            </div>
          </div>
          
          {/* Job Title - Artık gerçek bir link */}
          <h2 className="min-h-[2.5rem] sm:min-h-0">
            <a
              href={jobUrl}
              onClick={(e) => {
                e.preventDefault();
                sessionStorage.setItem('scrollPosition', window.scrollY.toString());
                sessionStorage.setItem(
                  'previousPath',
                  window.location.pathname + window.location.search
                );
                navigate(jobUrl);
              }}
              className="text-[15px] leading-snug sm:text-lg md:text-xl font-bold text-gray-900 hover:text-red-600 transition-colors line-clamp-2 cursor-pointer block"
              itemProp="title"
            >
              {job.title}
            </a>
          </h2>
          
          {/* Description Preview - Desktop */}
          <div className="hidden sm:block">
            <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed" itemProp="description">
              {job.description}
            </p>
          </div>
          
          {/* Quick Info Badges - Maaş, Aciliyet */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {job.salary && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs font-bold border border-green-200">
                <DollarSign className="h-3 w-3" />
                {job.salary}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-bold border border-blue-200 whitespace-nowrap">
              <Clock className="h-3 w-3" />
              ACİL
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-bold border border-purple-200 whitespace-nowrap">
              <Star className="h-3 w-3" />
              SGK PRİM
            </span>
          </div>

          {/* Mobile Description */}
          <div className="sm:hidden">
            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
              {job.description}
            </p>
          </div>
          
          {/* Bottom Actions */}
          <div className="flex items-center justify-between gap-2 pt-2 sm:pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {/* Apply Button */}
              <button 
                onClick={(e) => e.stopPropagation()}
                className="px-3 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap"
              >
                🚀 BAŞVUR
              </button>
              {/* Bookmark */}
              <button 
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Bookmark className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
            
            {/* Time Info */}
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span className="whitespace-nowrap">{getTimeAgo(job.createdAt)}</span>
            </div>
          </div>
          
          {/* Category Badges */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] sm:text-xs font-medium border border-blue-200">
              {job.category}
            </span>
            {job.subCategory && job.subCategory !== 'custom' && (
              <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] sm:text-xs font-medium border border-purple-200">
                {job.subCategory}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
