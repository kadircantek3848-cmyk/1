// src/components/job/SEOJobContent.tsx
import React from 'react';

export function SEOJobContent() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Ana Başlık */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          İstanbul, Ankara ve İzmir'de İş İlanları 2025
        </h1>
        <p className="text-xl text-gray-600">
          Güncel iş fırsatları, ücretsiz başvuru, hızlı işe giriş
        </p>
      </div>

      {/* Giriş Paragrafı */}
      <div className="prose prose-lg max-w-none mb-12">
        <p className="text-gray-700 leading-relaxed">
          Türkiye'nin en büyük üç şehrinde iş arıyorsanız doğru yerdesiniz. İşBuldum 
          platformunda İstanbul, Ankara ve İzmir'den güncel iş ilanlarını bulabilir, 
          ücretsiz başvuru yapabilirsiniz. Şoför, garson, kasiyer, kurye, satış danışmanı 
          ve çağrı merkezi pozisyonlarında yüzlerce aktif ilan sizleri bekliyor.
        </p>
      </div>

      {/* İstanbul Bölümü */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          İstanbul İş İlanları - Avrupa ve Anadolu Yakası
        </h2>
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-700 leading-relaxed mb-4">
            16 milyon nüfuslu İstanbul, Türkiye'nin ekonomik kalbidir. Kadıköy, Şişli, 
            Beşiktaş, Üsküdar, Ümraniye, Pendik ve Kartal gibi merkezi ilçelerde sürekli 
            istihdam fırsatları mevcuttur.
          </p>
          
          <h3 className="text-2xl font-semibold text-gray-900 mt-6 mb-3">
            İstanbul'da En Çok Aranan İşler
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li>
              <strong>Transfer Şoförü:</strong> Kendi araçla veya şirket aracıyla esnek 
              saatlerde çalışma imkanı. İstanbul genelinde 39 ilçede hizmet veren firmalar 
              sürekli şoför arıyor.
            </li>
            <li>
              <strong>Garson ve Servis Elemanı:</strong> Kadıköy, Beşiktaş ve Şişli'deki 
              restoran, kafe ve otellerde yoğun talep var. Part-time ve tam zamanlı seçenekler.
            </li>
            <li>
              <strong>Kasiyer:</strong> Anadolu ve Avrupa Yakası'ndaki market, AVM ve 
              perakende mağazalarda sürekli personel aranıyor.
            </li>
            <li>
              <strong>Kurye:</strong> Motor, bisiklet veya araçla çalışma seçenekleri. 
              Getir, Trendyol gibi platformlar için kuryelik ilanları.
            </li>
          </ul>
        </div>
      </section>

      {/* Ankara Bölümü */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ankara İş İlanları - Çankaya, Keçiören, Yenimahalle
        </h2>
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-700 leading-relaxed mb-4">
            Başkent Ankara'da kamu kurumları, üniversiteler ve büyük şirketler istihdam 
            sağlamaktadır. Çankaya, Keçiören, Yenimahalle, Etimesgut ve Mamak ilçelerinde 
            aktif ilanlar mevcuttur.
          </p>
          
          <h3 className="text-2xl font-semibold text-gray-900 mt-6 mb-3">
            Ankara'da Popüler Pozisyonlar
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li>
              <strong>Restoran Personeli:</strong> Çankaya ve Kızılay bölgesindeki 
              restoran, kafe ve fast-food zincirlerde garson, banko personeli ve aşçı 
              yardımcısı pozisyonları.
            </li>
            <li>
              <strong>Kasiyer ve Satış Danışmanı:</strong> AVM'ler, marketler ve 
              perakende mağazalarda sürekli eleman aranıyor. Part-time imkanları mevcut.
            </li>
            <li>
              <strong>Modelist ve Tekstil Çalışanı:</strong> Ankara'da bulunan hazır 
              giyim firmalarında modelist, dikiş ustası ve üretim elemanı ilanları.
            </li>
            <li>
              <strong>Çağrı Merkezi:</strong> Keçiören ve Yenimahalle'deki call center 
              firmalarında müşteri temsilcisi pozisyonları.
            </li>
          </ul>
        </div>
      </section>

      {/* İzmir Bölümü */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          İzmir İş İlanları - Konak, Bornova, Karşıyaka
        </h2>
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-700 leading-relaxed mb-4">
            Ege'nin incisi İzmir'de turizm, ticaret ve sanayi sektörlerinde geniş iş 
            imkanları vardır. Konak, Bornova, Karşıyaka, Alsancak, Buca, Çiğli ve 
            Bayraklı bölgelerinde sürekli personel aranmaktadır.
          </p>
          
          <h3 className="text-2xl font-semibold text-gray-900 mt-6 mb-3">
            İzmir'de İş Fırsatları
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li>
              <strong>Turizm Sektörü:</strong> Alsancak, Konak ve sahil bölgesindeki 
              otel, restoran ve kafelerde servis elemanı, garson ve resepsiyonist ilanları.
            </li>
            <li>
              <strong>Perakende:</strong> Bornova ve Karşıyaka'daki AVM'lerde kasiyer, 
              satış danışmanı ve mağaza görevlisi pozisyonları.
            </li>
            <li>
              <strong>Üretim:</strong> Çiğli ve Gaziemir'deki fabrika ve üretim 
              tesislerinde operatör, montaj elemanı ve kalite kontrol personeli aranıyor.
            </li>
            <li>
              <strong>Part-time İşler:</strong> Bornova'da üniversite öğrencilerine yönelik 
              esnek saatli garson, kurye ve satış danışmanı pozisyonları.
            </li>
          </ul>
        </div>
      </section>

      {/* Nasıl Başvuru Yapılır */}
      <section className="bg-blue-50 border border-blue-200 rounded-xl p-8 mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Nasıl Başvuru Yapılır?
        </h2>
        <ol className="space-y-4 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              1
            </span>
            <div>
              <strong className="block mb-1">İlanı Seçin:</strong>
              Yukarıdaki listeden ilgilendiğiniz pozisyonu bulun. Şehir, kategori veya 
              anahtar kelime ile arama yapabilirsiniz.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              2
            </span>
            <div>
              <strong className="block mb-1">Detayları İnceleyin:</strong>
              İlan sayfasında maaş, çalışma saatleri, gereksinimler ve firma bilgilerini 
              okuyun.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              3
            </span>
            <div>
              <strong className="block mb-1">Başvur Butonuna Tıklayın:</strong>
              İletişim bilgilerinizi paylaşın veya telefon numarasını arayarak başvurunuzu 
              yapın.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              4
            </span>
            <div>
              <strong className="block mb-1">Geri Dönüş Bekleyin:</strong>
              İşverenler genellikle 24-48 saat içinde başvuruları değerlendirir ve size geri 
              döner.
            </div>
          </li>
        </ol>
      </section>

      {/* Sıkça Sorulan Sorular */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Sıkça Sorulan Sorular
        </h2>
        
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Başvuru ücretsiz mi?
            </h3>
            <p className="text-gray-700">
              Evet, İşBuldum'da tüm iş ilanlarına başvuru tamamen ücretsizdir. Hiçbir 
              ücret talep edilmez.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              CV gerekli mi?
            </h3>
            <p className="text-gray-700">
              Çoğu ilan için CV gerekmez, sadece iletişim bilgilerinizi paylaşmanız yeterlidir. 
              Ancak bazı firmalar CV isteyebilir.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Part-time iş bulabilir miyim?
            </h3>
            <p className="text-gray-700">
              Evet, platformumuzda hem tam zamanlı hem de part-time iş ilanları mevcuttur. 
              Filtrelerden "Part Time" seçeneğini işaretleyerek bu ilanları görebilirsiniz.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Deneyimsiz olarak başvurabilir miyim?
            </h3>
            <p className="text-gray-700">
              Birçok ilan deneyimsiz adaylara açıktır. İlan detaylarında "deneyim gerekli 
              değildir" veya "eğitim verilecektir" yazanları tercih edebilirsiniz.
            </p>
          </div>
        </div>
      </section>

      {/* Neden İşBuldum */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-6">
          Neden İşBuldum?
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold mb-1">Güncel İlanlar</h3>
              <p className="text-blue-100 text-sm">Her gün yeni iş fırsatları ekleniyor</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold mb-1">Ücretsiz Platform</h3>
              <p className="text-blue-100 text-sm">Başvuru ve kullanım tamamen ücretsiz</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold mb-1">Hızlı Başvuru</h3>
              <p className="text-blue-100 text-sm">Tek tıkla hemen başvuru yapın</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold mb-1">3 Büyük Şehir</h3>
              <p className="text-blue-100 text-sm">İstanbul, Ankara ve İzmir'de geniş ilan ağı</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
