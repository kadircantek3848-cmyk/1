import { useEffect } from 'react';
import { blogService } from '../services/blogService';

export function useDailyBlogScheduler() {
  useEffect(() => {
    const checkAndCreateDailyPost = async () => {
      try {
        console.log('📅 Günlük blog kontrolü yapılıyor...');
        await blogService.scheduleDailyPost();
      } catch (error) {
        console.error('❌ Günlük blog scheduler hatası:', error);
      }
    };

    // Sayfa yüklendiğinde kontrol et
    checkAndCreateDailyPost();

    // Her 6 saatte bir kontrol et
    const interval = setInterval(checkAndCreateDailyPost, 6 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
}
