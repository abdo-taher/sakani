import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../dist');

if (!fs.existsSync(distDir)) {
  console.error('❌ dist directory does not exist. Run vite build first.');
  process.exit(1);
}

const baseIndexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

const pages = [
  {
    path: 'rent',
    title: 'شقق للإيجار في دمياط الجديدة وسكن مفروش | سكني',
    description: 'تصفح أحدث شقق الإيجار العائلي والمفروش في مختلف أحياء دمياط الجديدة. أسعار حقيقية، معاينات موثقة، وفلاتر بحث حسب الحي والمساحة والميزانية.',
    canonical: 'https://sakani.site/rent',
    h1: 'شقق للإيجار وسكن مفروش في دمياط الجديدة',
    contentSnippet: `
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 class="text-2xl sm:text-4xl font-bold text-slate-900 mb-4">شقق للإيجار وسكن مفروش في دمياط الجديدة</h1>
        <p class="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
          تعتبر منصة سكني الوجهة الأولى للبحث عن شقق للإيجار في مدينة دمياط الجديدة. نوفر لك تشكيلة واسعة من الشقق السكنية المفروشة وغير المفروشة المناسبة للعائلات والشباب في أفضل المواقع: الحي المتميز، المنطقة المركزية، سكن مصر، ودار مصر مع معاينات مجانية وعقود إيجار موثقة.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
          <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <h2 class="text-lg font-bold text-slate-900 mb-2">شقق إيجار عائلي سوبر لوكس</h2>
            <p class="text-xs text-slate-600 mb-3">شقق 2 و 3 و 4 غرف تشطيب فاخر ومساحات واسعة قريبة من الخدمات والمدارس.</p>
            <a href="/properties?operation=rent" class="text-xs font-bold text-[#8D6A28] hover:underline">عرض الشقق المتاحة ←</a>
          </div>
          <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <h2 class="text-lg font-bold text-slate-900 mb-2">شقق مفروشة بالكامل</h2>
            <p class="text-xs text-slate-600 mb-3">شقق مجهزة بالأجهزة الكهربائية والمفروشات الحديثة للإيجار الشهري والسنوي.</p>
            <a href="/properties?operation=rent&type=apartment" class="text-xs font-bold text-[#8D6A28] hover:underline">عرض الشقق المفروشة ←</a>
          </div>
          <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <h2 class="text-lg font-bold text-slate-900 mb-2">إيجار اقتصادي وسكن طلاب</h2>
            <p class="text-xs text-slate-600 mb-3">خيارات سكنية اقتصادية تناسب الميزانيات المختلفة بالقرب من جامعة حورس وجامعة دمياط.</p>
            <a href="/rooms-for-rent" class="text-xs font-bold text-[#8D6A28] hover:underline">تصفح سكن الطلاب ←</a>
          </div>
        </div>
      </section>
    `
  },
  {
    path: 'buy',
    title: 'عقارات وشقق للبيع في دمياط الجديدة | سكني',
    description: 'ابحث عن شقق للبيع، دوبلكس، وفيلات في أرقى أحياء دمياط الجديدة بأسعار تنافسية وتسهيلات في السداد مع فحص قانوني وهندسي شامل.',
    canonical: 'https://sakani.site/buy',
    h1: 'عقارات وشقق للبيع في دمياط الجديدة',
    contentSnippet: `
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 class="text-2xl sm:text-4xl font-bold text-slate-900 mb-4">عقارات وشقق للبيع في دمياط الجديدة</h1>
        <p class="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
          استثمر في مستقبلك العقاري بمدينة دمياط الجديدة مع منصة سكني. نوفر لك أفضل عروض شقق التمليك، الدوبلكس، الفيلات المستقلة، والمحلات التجارية في الحي المتميز، منطقة الشاليهات، والأحياء السكنية الحيوية بأسعار معتمدة ومفحوصة قانونياً.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
          <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <h2 class="text-lg font-bold text-slate-900 mb-2">شقق تمليك بمساحات متنوعة</h2>
            <p class="text-xs text-slate-600 mb-3">شقق من 100 م² حتى 250 م² بتشطيب سوبر لوكس ونصف تشطيب بحري.</p>
            <a href="/properties?operation=sale" class="text-xs font-bold text-[#8D6A28] hover:underline">تصفح شقق البيع ←</a>
          </div>
          <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <h2 class="text-lg font-bold text-slate-900 mb-2">فيلات ودوبلكس فاخرة</h2>
            <p class="text-xs text-slate-600 mb-3">وحدات سكنية راقية في الحي المتميز مع حدائق ومداخل خاصة.</p>
            <a href="/properties?operation=sale&type=villa" class="text-xs font-bold text-[#8D6A28] hover:underline">عرض الفيلات والدوبلكس ←</a>
          </div>
          <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <h2 class="text-lg font-bold text-slate-900 mb-2">محلات وعقارات تجارية</h2>
            <p class="text-xs text-slate-600 mb-3">فرص استثمارية وتجارية في المنطقة المركزية والأسواق الحيوية.</p>
            <a href="/properties?operation=sale&type=shop" class="text-xs font-bold text-[#8D6A28] hover:underline">عرض العقارات التجارية ←</a>
          </div>
        </div>
      </section>
    `
  },
  {
    path: 'rooms-for-rent',
    title: 'غرف للإيجار وسكن طلاب وشباب في دمياط الجديدة | سكني',
    description: 'احجز غرفتك المستقلة في شقق مفروشة بالكامل بالقرب من جامعة حورس وجامعة دمياط. سكن طالبات وشباب بأسعار مناسبة تشمل الخدمات.',
    canonical: 'https://sakani.site/rooms-for-rent',
    h1: 'غرف للإيجار وسكن طلاب وطالبات في دمياط الجديدة',
    contentSnippet: `
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 class="text-2xl sm:text-4xl font-bold text-slate-900 mb-4">غرف للإيجار وسكن طلاب وطالبات في دمياط الجديدة</h1>
        <p class="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
          تتيح منصة سكني خدمة إيجار الغرف المستقلة والمشتركة لطلاب وطالبات جامعة حورس وجامعة دمياط. شقق مجهزة بالكامل بالفرش والأجهزة الكهربائية والإنترنت، مع بيئة آمنة وهادئة للمذاكرة وخيارات دفع شهرية ميسرة.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <h2 class="text-lg font-bold text-slate-900 mb-2">سكن الطالبات والجامعيات</h2>
            <p class="text-xs text-slate-600 mb-3">غرف مفروشة مخصصة للطالبات في مباني آمنة تضمن الخصوصية الكاملة وقريبة من المواصلات والجامعات.</p>
            <a href="/properties?operation=rent&mode=room&audience=female_students" class="text-xs font-bold text-[#8D6A28] hover:underline">عرض سكن الطالبات ←</a>
          </div>
          <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <h2 class="text-lg font-bold text-slate-900 mb-2">سكن الشباب والطلاب</h2>
            <p class="text-xs text-slate-600 mb-3">غرف فردية ومزدوجة بأسعار مناسبة شاملة المرافق مع سرعة الحجز والمعاينة الفورية.</p>
            <a href="/properties?operation=rent&mode=room&audience=singles" class="text-xs font-bold text-[#8D6A28] hover:underline">عرض سكن الشباب ←</a>
          </div>
        </div>
      </section>
    `
  },
  {
    path: 'places',
    title: 'أحياء ومناطق دمياط الجديدة - دليل السكن والأسعار | سكني',
    description: 'دليلك الشامل لأحياء ومناطق دمياط الجديدة: المنطقة المركزية، الحي المتميز، سكن مصر، دار مصر، والحي الرابع. استكشف متوسط الأسعار والخدمات.',
    canonical: 'https://sakani.site/places',
    h1: 'دليل أحياء ومناطق دمياط الجديدة',
    contentSnippet: `
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 class="text-2xl sm:text-4xl font-bold text-slate-900 mb-4">دليل أحياء ومناطق دمياط الجديدة</h1>
        <p class="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
          استكشف كافة أحياء ومناطق مدينة دمياط الجديدة، وتعرف على مميزات كل منطقة ومتوسط أسعار الإيجار والتملك وقربها من الجامعات والشاطئ والمراكز الخدمية.
        </p>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 my-6">
          <div class="p-4 bg-white rounded-2xl border border-slate-200">
            <h2 class="text-base font-bold text-slate-900">المنطقة المركزية</h2>
            <p class="text-xs text-slate-500 mt-1">قلب الخدمات والأسواق والمطاعم بدمياط الجديدة.</p>
            <a href="/properties?district=markazia" class="text-xs font-bold text-[#8D6A28] mt-2 block hover:underline">عرض عقارات المنطقة المركزية ←</a>
          </div>
          <div class="p-4 bg-white rounded-2xl border border-slate-200">
            <h2 class="text-base font-bold text-slate-900">الحي المتميز</h2>
            <p class="text-xs text-slate-500 mt-1">أرقى الأحياء السكنية والفيلات والإطلالات الهادئة.</p>
            <a href="/properties?district=hay-motamayez" class="text-xs font-bold text-[#8D6A28] mt-2 block hover:underline">عرض عقارات الحي المتميز ←</a>
          </div>
          <div class="p-4 bg-white rounded-2xl border border-slate-200">
            <h2 class="text-base font-bold text-slate-900">سكن مصر ودار مصر</h2>
            <p class="text-xs text-slate-500 mt-1">مجمعات سكنية حديثة بتشطيب كامل ومساحات خضراء.</p>
            <a href="/properties?district=sakan-misr" class="text-xs font-bold text-[#8D6A28] mt-2 block hover:underline">عرض عقارات سكن مصر ←</a>
          </div>
        </div>
      </section>
    `
  },
  {
    path: 'sell',
    title: 'أضف عقارك للبيع أو الإيجار مجاناً | سكني',
    description: 'اعرض شقتك، فيلتك أو محلك التجاري للبيع أو الإيجار أمام آلاف المشترين والمستأجرين في دمياط الجديدة مع تسويق احترافي وتوثيق رسمي.',
    canonical: 'https://sakani.site/sell',
    h1: 'أضف عقارك للبيع أو الإيجار في دمياط الجديدة',
    contentSnippet: `
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 class="text-2xl sm:text-4xl font-bold text-slate-900 mb-4">أضف عقارك للبيع أو الإيجار في دمياط الجديدة</h1>
        <p class="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
          هل تمتلك عقاراً أو شقة أو غرفة للإيجار أو البيع في دمياط الجديدة؟ اعرض وحدتك الآن عبر منصة سكني لتصل إلى آلاف العملاء والطلاب والباحثين عن سكن مع تصوير احترافي وتوثيق رسمي كامل.
        </p>
      </section>
    `
  },
  {
    path: 'need-property',
    title: 'اطلب عقارك بمواصفات خاصة في دمياط الجديدة | سكني',
    description: 'سجل مواصفات السكن المطلوب والميزانية والمنطقة وسيقوم فريق مستشاري سكني بتوفير أفضل الخيارات المطابقة وتنسيق المعاينة مجاناً.',
    canonical: 'https://sakani.site/need-property',
    h1: 'اطلب عقارك بمواصفات خاصة',
    contentSnippet: `
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 class="text-2xl sm:text-4xl font-bold text-slate-900 mb-4">اطلب عقارك بمواصفات خاصة</h1>
        <p class="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
          إذا لم تجد العقار المطلوب في القائمة المعروضة، يمكنك تسجيل طلبك مع تحديد المنطقة والميزانية وعدد الغرف، وسيقوم فريق سكني بالبحث المباشر والتواصل معك بأفضل الخيارات المتوفرة فوراً.
        </p>
      </section>
    `
  },
  {
    path: 'contact',
    title: 'اتصل بنا - فريق الاستشارات العقارية وخدمة العملاء | سكني',
    description: 'تواصل مع إدارة منصة سكني في دمياط الجديدة للاستفسارات، حجز المعاينات، والاستشارات العقارية والقانونية المجانية.',
    canonical: 'https://sakani.site/contact',
    h1: 'تواصل مع منصة سكني العقارية',
    contentSnippet: `
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 class="text-2xl sm:text-4xl font-bold text-slate-900 mb-4">تواصل مع منصة سكني العقارية</h1>
        <p class="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
          يسعدنا استقبال استفساراتكم ومساعدتكم في اختيار العقار الأنسب في دمياط الجديدة. تواصل معنا هاتفياً أو عبر واتساب أو بزيارة مقرنا بالمنطقة المركزية.
        </p>
        <div class="p-6 bg-white rounded-2xl border border-slate-200 max-w-lg">
          <p class="text-sm font-bold text-slate-800 mb-2">الهاتف: 01067725976</p>
          <p class="text-sm font-bold text-slate-800 mb-2">البريد: info@sakani.site</p>
          <p class="text-sm font-bold text-slate-800">العنوان: دمياط الجديدة - المنطقة المركزية</p>
        </div>
      </section>
    `
  }
];

let generatedCount = 0;

for (const page of pages) {
  const targetDir = path.join(distDir, page.path);
  fs.mkdirSync(targetDir, { recursive: true });

  let pageHtml = baseIndexHtml;

  // Replace Title
  pageHtml = pageHtml.replace(/<title>.*?<\/title>/is, `<title>${page.title}</title>`);

  // Replace Meta Description
  pageHtml = pageHtml.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${page.description}" />`);

  // Replace Canonical
  pageHtml = pageHtml.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${page.canonical}" />`);

  // Replace Open Graph Tags
  pageHtml = pageHtml.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${page.title}" />`);
  pageHtml = pageHtml.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${page.description}" />`);
  pageHtml = pageHtml.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${page.canonical}" />`);

  // Replace Twitter Tags
  pageHtml = pageHtml.replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${page.title}" />`);
  pageHtml = pageHtml.replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${page.description}" />`);

  // Inject Route-specific main content inside #main-content
  if (page.contentSnippet) {
    pageHtml = pageHtml.replace(/<main id="main-content"[^>]*>.*?<\/main>/is, `<main id="main-content" class="flex-1">${page.contentSnippet}</main>`);
  }

  const targetFile = path.join(targetDir, 'index.html');
  fs.writeFileSync(targetFile, pageHtml, 'utf-8');
  generatedCount++;
}

console.log(`✅ Pre-rendered ${generatedCount} static SEO landing pages into dist/ successfully!`);
