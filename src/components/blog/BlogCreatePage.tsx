import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Send } from 'lucide-react';
import { blogService } from '../../services/blogService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';

export function BlogCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'kariyer-rehberi',
    tags: ''
  });

  const categories = [
    { id: 'kariyer-rehberi', name: 'Kariyer Rehberi' },
    { id: 'cv-ipuclari', name: 'CV İpuçları' },
    { id: 'mulakat-rehberi', name: 'Mülakat Rehberi' },
    { id: 'is-piyasasi', name: 'İş Piyasası' },
    { id: 'uzaktan-calisma', name: 'Uzaktan Çalışma' },
    { id: 'sektör-analizi', name: 'Sektör Analizi' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Başlık ve içerik zorunludur');
      return;
    }

    try {
      setLoading(true);

      // Tags'i array'e çevir
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Slug oluştur
      const slug = formData.title
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const postData = {
        title: formData.title,
        slug: `${slug}-${Date.now()}`,
        excerpt: formData.excerpt || formData.content.substring(0, 150) + '...',
        content: formData.content.replace(/\n/g, '<br>'),
        category: formData.category,
        tags: tagsArray,
        author: 'İşBuldum Editör',
        isAIGenerated: false,
        readTime: Math.ceil(formData.content.split(' ').length / 200),
        likes: 0,
        views: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const postId = await blogService.createPost(postData);

      if (postId) {
        toast.success('Blog yazısı başarıyla oluşturuldu!');
        navigate(`/blog/${postData.slug}`);
      } else {
        toast.error('Blog yazısı oluşturulamadı');
      }
    } catch (error) {
      console.error('Blog oluşturma hatası:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <button
        onClick={() => navigate('/blog')}
        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        Blog Ana Sayfası
      </button>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-blue-600" />
            Yeni Blog Yazısı Oluştur
          </h1>
          <p className="text-gray-600">
            Kariyerle ilgili bilgilerinizi, deneyimlerinizi ve ipuçlarınızı paylaşın.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Başlık */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Başlık *
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Blog yazısının başlığını girin"
              required
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.title.length}/200 karakter
            </p>
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Özet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Özet (İsteğe Bağlı)
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Yazınızın kısa özetini girin (boş bırakılırsa otomatik oluşturulur)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              maxLength={300}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.excerpt.length}/300 karakter
            </p>
          </div>

          {/* İçerik */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İçerik *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Blog yazınızın içeriğini buraya yazın..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={15}
              required
              maxLength={10000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.content.length}/10000 karakter • Tahmini okuma süresi: {Math.ceil(formData.content.split(' ').length / 200)} dakika
            </p>
          </div>

          {/* Etiketler */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Etiketler (virgülle ayırın)
            </label>
            <Input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="kariyer, iş arama, cv hazırlama"
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              Örnek: kariyer, mülakat, cv hazırlama
            </p>
          </div>

          {/* Butonlar */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/blog')}
              className="flex-1"
            >
              İptal
            </Button>
            <Button
              type="submit"
              isLoading={loading}
              disabled={!formData.title.trim() || !formData.content.trim()}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Yayınla
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
