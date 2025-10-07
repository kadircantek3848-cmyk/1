import { GoogleGenerativeAI } from '@google/generative-ai';
import { ref, push, get, query, orderByChild, limitToLast, set } from 'firebase/database';
import { db } from '../lib/firebase';
import { generateSlug } from '../utils/seoUtils';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyAyqcZq_8x7BhmTcjnP3qRt5J9jMtzp27w';
const genAI = new GoogleGenerativeAI(API_KEY);

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  category: string;
  tags: string[];
  author: 'AI Assistant' | string;
  createdAt: number;
  updatedAt: number;
  isAIGenerated: boolean;
  readTime: number;
  views: number;
  likes: number;
  comments: BlogComment[];
}

export interface BlogComment {
  id: string;
  postId: string;
  userId?: string;
  userName: string;
  content: string;
  aiResponse?: string;
  createdAt: number;
  isAIResponse: boolean;
}

export interface LiveChatMessage {
  id: string;
  userId?: string;
  userName: string;
  message: string;
  aiResponse?: string;
  timestamp: number;
  isResolved: boolean;
}

export class BlogService {
  private model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Günlük otomatik blog yazısı oluştur
  async generateDailyBlogPost(): Promise<BlogPost | null> {
    try {
      console.log('🤖 Günlük blog yazısı oluşturuluyor...');

      // Son blog yazılarını kontrol et (duplicate önleme)
      const recentPosts = await this.getRecentPosts(7);
      const recentTitles = recentPosts.map(post => post.title).join(', ');

      // Güncel iş piyasası verilerini al
      const jobsRef = ref(db, 'jobs');
      const jobsSnapshot = await get(query(jobsRef, orderByChild('createdAt'), limitToLast(50)));
      
      let jobStats = {
        totalJobs: 0,
        topCategories: [] as string[],
        topCities: [] as string[],
        newJobsToday: 0
      };

      if (jobsSnapshot.exists()) {
        const jobs = Object.values(jobsSnapshot.val());
        jobStats.totalJobs = jobs.length;
        
        // Kategori analizi
        const categoryCount: Record<string, number> = {};
        const cityCount: Record<string, number> = {};
        const today = new Date().toDateString();
        
        jobs.forEach((job: any) => {
          if (job.status === 'active') {
            categoryCount[job.category] = (categoryCount[job.category] || 0) + 1;
            cityCount[job.location] = (cityCount[job.location] || 0) + 1;
            
            if (new Date(job.createdAt).toDateString() === today) {
              jobStats.newJobsToday++;
            }
          }
        });

        jobStats.topCategories = Object.entries(categoryCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([category]) => category);

        jobStats.topCities = Object.entries(cityCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([city]) => city);
      }

      const prompt = `
Sen İşBuldum platformunun AI editörüsün. Günlük blog yazısı oluştur.

GÜNCEL VERİLER:
- Toplam aktif ilan: ${jobStats.totalJobs}
- Bugün eklenen yeni ilan: ${jobStats.newJobsToday}
- En popüler kategoriler: ${jobStats.topCategories.join(', ')}
- En aktif şehirler: ${jobStats.topCities.join(', ')}

SON 7 GÜNÜN YAZILARI (Tekrar etme):
${recentTitles}

YAZMA KURALLARI:
1. Tamamen özgün içerik (kopya değil)
2. SEO uyumlu başlık (50-60 karakter)
3. 800-1200 kelime arası
4. Güncel iş piyasası trendleri
5. Pratik kariyer tavsiyeleri
6. Türkçe, samimi ve bilgilendirici ton
7. Anahtar kelime optimizasyonu
8. Okuma süresi 4-6 dakika

KONU ÖNERİLERİ:
- "2025 İş Piyasası Trendleri"
- "CV Hazırlama İpuçları"
- "Mülakat Başarı Stratejileri"
- "Uzaktan Çalışma Rehberi"
- "Kariyer Değişimi Rehberi"
- "İş Arama Stratejileri"
- "Sektör Analizi ve Fırsatlar"

JSON formatında yanıt ver:
{
  "title": "SEO uyumlu başlık",
  "content": "Tam blog yazısı içeriği (HTML formatında)",
  "excerpt": "150 karakter özet",
  "category": "kariyer-rehberi",
  "tags": ["tag1", "tag2", "tag3"],
  "readTime": 5
}
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      const cleanedResponse = this.cleanJsonResponse(response);
      const blogData = JSON.parse(cleanedResponse);

      // Blog yazısını oluştur
      const blogPost: Omit<BlogPost, 'id'> = {
        title: blogData.title,
        content: blogData.content,
        excerpt: blogData.excerpt,
        slug: generateSlug(blogData.title),
        category: blogData.category,
        tags: blogData.tags,
        author: 'AI Assistant',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isAIGenerated: true,
        readTime: blogData.readTime,
        views: 0,
        likes: 0,
        comments: []
      };

      // Firebase'e kaydet
      const blogRef = ref(db, 'blog_posts');
      const newPostRef = await push(blogRef, blogPost);
      
      console.log('✅ Günlük blog yazısı oluşturuldu:', blogData.title);
      
      return {
        id: newPostRef.key!,
        ...blogPost
      };

    } catch (error) {
      console.error('❌ Blog yazısı oluşturma hatası:', error);
      return null;
    }
  }

  // Kullanıcı yorumuna AI yanıtı oluştur
  async generateCommentResponse(comment: string, postTitle: string): Promise<string> {
    try {
      const prompt = `
Sen İşBuldum platformunun AI asistanısın. Kullanıcının blog yorumuna yanıt ver.

BLOG YAZISI: "${postTitle}"
KULLANICI YORUMU: "${comment}"

YANIT KURALLARI:
1. Kısa ve net (50-150 kelime)
2. Yardımcı ve samimi ton
3. Pratik öneriler ver
4. AI olduğunu belirt ama doğal ol
5. Türkçe dilbilgisi kurallarına uy
6. İş/kariyer odaklı yanıt

Sadece yanıt metnini döndür, JSON formatında değil.
`;

      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();

    } catch (error) {
      console.error('❌ Yorum yanıtı oluşturma hatası:', error);
      return 'Yorumunuz için teşekkürler! AI asistanı şu anda yanıt veremiyor, ancak ekibimiz en kısa sürede size dönüş yapacak.';
    }
  }

  // Canlı destek için AI yanıtı - Site bağlamına göre optimize
  async generateLiveSupportResponse(userMessage: string, currentUrl?: string): Promise<string> {
    try {
      const prompt = `
Sen İşBuldum platformunun canlı destek AI asistanısın. Kullanıcının sorusuna BAĞLAMINA GÖRE yanıt ver.

KULLANICI SORUSU: "${userMessage}"
${currentUrl ? `KULLANICININ BULUNDUĞU SAYFA: ${currentUrl}` : ''}

YANIT KURALLARI:
1. ÇOK KISA VE NET (15-40 kelime MAX)
2. Hemen çözüm odaklı ve kullanıcının bulunduğu sayfaya özel
3. Link veya yönlendirme içeren pratik çözüm
4. Emoji kullan (1 adet)
5. Mobil kullanıcı için optimize

PLATFORM ÖZELLİKLERİ:
- İşBuldum: 50.000+ güncel iş ilanı
- Ücretsiz ilan verme
- CV oluşturma aracı
- Blog ve kariyer rehberleri
- Tüm kategorilerde iş fırsatları

ÖZEL DURUMLAR:
- İş arıyor: "🔍 Ana sayfada şehir ve kategori filtrelerini kullanın"
- CV sorusu: "📄 /cv-olustur adresine gidin, AI yardımı ile CV hazırlayın"
- İlan verme: "💼 Sağ üst köşeden 'İlan Ver' butonuna tıklayın"
- Blog sorusu: "📚 /blog sayfasında kariyer rehberlerimizi okuyun"
- Kategori sorusu: "🎯 Ana sayfadan ilgilendiğiniz kategoriyi seçin"
- Şehir sorusu: "📍 Arama barından şehir filtresi uygulayın"

ÖRNEK YANITLAR (BAĞLAMA GÖRE):
- Ana sayfa: "🔍 Yukarıdaki arama çubuğundan iş arayabilirsiniz"
- İlan detay: "✅ 'Başvur' butonuna tıklayarak hemen başvurun"
- Blog: "📚 İlgili kategori butonlarından filtreleme yapabilirsiniz"

Sadece kısa yanıt metnini döndür, açıklama yapma.
`;

      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();

    } catch (error) {
      console.error('❌ Canlı destek yanıtı hatası:', error);
      return '🤖 Teknik sorun var. Lütfen tekrar deneyin.';
    }
  }

  // Blog yazısına yorum ekle ve AI yanıtı oluştur
  async addCommentWithAIResponse(
    postId: string, 
    userName: string, 
    content: string, 
    userId?: string
  ): Promise<boolean> {
    try {
      // Blog yazısını al
      const postRef = ref(db, `blog_posts/${postId}`);
      const postSnapshot = await get(postRef);
      
      if (!postSnapshot.exists()) {
        throw new Error('Blog yazısı bulunamadı');
      }

      const post = postSnapshot.val() as BlogPost;

      // Yorum oluştur
      const comment: Omit<BlogComment, 'id'> = {
        postId,
        userId,
        userName,
        content,
        createdAt: Date.now(),
        isAIResponse: false
      };

      // AI yanıtı oluştur
      const aiResponse = await this.generateCommentResponse(content, post.title);
      comment.aiResponse = aiResponse;

      // Firebase'e kaydet
      const commentsRef = ref(db, `blog_comments/${postId}`);
      await push(commentsRef, comment);

      console.log('✅ Yorum ve AI yanıtı eklendi');
      return true;

    } catch (error) {
      console.error('❌ Yorum ekleme hatası:', error);
      return false;
    }
  }

  // Canlı destek mesajı işle
  async handleLiveSupportMessage(
    userName: string,
    message: string,
    userId?: string,
    currentUrl?: string
  ): Promise<LiveChatMessage> {
    try {
      // AI yanıtı oluştur (sayfa bağlamı ile)
      const aiResponse = await this.generateLiveSupportResponse(message, currentUrl);

      const chatMessage: Omit<LiveChatMessage, 'id'> = {
        userId,
        userName,
        message,
        aiResponse,
        timestamp: Date.now(),
        isResolved: false
      };

      // Firebase'e kaydet
      const chatRef = ref(db, 'live_support');
      const newMessageRef = await push(chatRef, chatMessage);

      return {
        id: newMessageRef.key!,
        ...chatMessage
      };

    } catch (error) {
      console.error('❌ Canlı destek mesajı hatası:', error);
      throw error;
    }
  }

  // Son blog yazılarını getir
  async getRecentPosts(limit: number = 10): Promise<BlogPost[]> {
    try {
      const postsRef = ref(db, 'blog_posts');
      const snapshot = await get(query(postsRef, orderByChild('createdAt'), limitToLast(limit)));
      
      if (snapshot.exists()) {
        const posts: BlogPost[] = [];
        snapshot.forEach((childSnapshot) => {
          posts.push({
            id: childSnapshot.key!,
            ...childSnapshot.val()
          });
        });
        
        return posts.reverse(); // En yeni önce
      }
      
      return [];
    } catch (error) {
      console.error('❌ Blog yazıları getirme hatası:', error);
      return [];
    }
  }

  // Blog kategorileri için içerik önerileri
  async generateContentIdeas(): Promise<string[]> {
    try {
      const prompt = `
İş ilanları platformu için 10 blog yazısı konusu öner.

KONU KRİTERLERİ:
1. İş arayanlar için faydalı
2. SEO uyumlu başlıklar
3. Güncel ve trend konular
4. Pratik rehber niteliğinde
5. Türkiye iş piyasasına uygun

ÖRNEK FORMATLAR:
- "2025'te En Çok Aranan 10 Meslek"
- "CV'nizi ATS Sistemlerine Nasıl Optimize Edersiniz?"
- "Uzaktan Çalışma İpuçları"

Sadece başlıkları listele, virgülle ayır.
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      return response.split(',').map(title => title.trim()).filter(Boolean);

    } catch (error) {
      console.error('❌ İçerik önerileri hatası:', error);
      return [];
    }
  }

  // Kullanıcı tarafından blog yazısı oluştur
  async createPost(postData: any): Promise<string | null> {
    try {
      const postRef = push(ref(db, 'blog_posts'));
      await set(postRef, postData);
      console.log('✅ Blog yazısı oluşturuldu:', postRef.key);
      return postRef.key;
    } catch (error) {
      console.error('❌ Blog yazısı oluşturma hatası:', error);
      return null;
    }
  }

  // JSON temizleme yardımcı fonksiyonu
  private cleanJsonResponse(response: string): string {
    try {
      let cleaned = response
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      
      JSON.parse(cleaned);
      return cleaned;
    } catch (error) {
      console.error('JSON temizleme hatası:', error);
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extracted = jsonMatch[0];
          JSON.parse(extracted);
          return extracted;
        } catch (e) {
          console.error('JSON çıkarma hatası:', e);
        }
      }
      
      return JSON.stringify({
        title: "İş Piyasası Güncellemeleri",
        content: "<p>Güncel iş fırsatları ve kariyer tavsiyeleri için platformumuzu takip edin.</p>",
        excerpt: "İş piyasası hakkında güncel bilgiler",
        category: "genel",
        tags: ["iş", "kariyer"],
        readTime: 3
      });
    }
  }

  // Otomatik blog yazısı scheduler
  async scheduleDailyPost(): Promise<void> {
    try {
      // Son blog yazısını kontrol et
      const lastPost = await this.getLastPost();
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);

      // Eğer son 24 saatte yazı yoksa yeni yazı oluştur
      if (!lastPost || lastPost.createdAt < oneDayAgo) {
        console.log('📝 Günlük blog yazısı oluşturuluyor...');
        await this.generateDailyBlogPost();
      } else {
        console.log('✅ Bugün zaten blog yazısı var');
      }

    } catch (error) {
      console.error('❌ Günlük blog scheduler hatası:', error);
    }
  }

  private async getLastPost(): Promise<BlogPost | null> {
    try {
      const postsRef = ref(db, 'blog_posts');
      const snapshot = await get(query(postsRef, orderByChild('createdAt'), limitToLast(1)));
      
      if (snapshot.exists()) {
        const posts = Object.entries(snapshot.val());
        if (posts.length > 0) {
          const [id, data] = posts[0];
          return { id, ...data } as BlogPost;
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Son blog yazısı getirme hatası:', error);
      return null;
    }
  }
}

export const blogService = new BlogService();
