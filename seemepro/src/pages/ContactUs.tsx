import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, MessageSquare, Send, ChevronDown, CheckCircle2, Twitter, Github } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';
import SiteFooter from '../components/SiteFooter';

const FAQS_EN = [
    { q: 'How accurate is SeemePro\'s analysis?', a: 'SeemePro achieves high pattern recognition accuracy under controlled conditions. However, no AI tool can guarantee 100% accuracy. Results are probabilistic estimates that depend on recording quality, cultural context, and environmental conditions. Always consult a qualified human expert for critical decisions.' },
    { q: 'Is my voice/video data stored on your servers?', a: 'No. SeemePro processes your media locally on your device (Edge AI) wherever possible. If server-side processing is needed, your data is encrypted in transit and purged within 24 hours unless you explicitly save results to your profile.' },
    { q: 'Can I use SeemePro on another person without their knowledge?', a: 'Absolutely not. Recording or analyzing any individual without their explicit, informed consent is a violation of our Terms of Service and may be illegal in your jurisdiction. SeemePro assumes users have obtained proper consent before using the app on third parties.' },
    { q: 'How do I upgrade to a premium plan?', a: 'Click "Ascend" in the top navigation bar or visit the Premium Plans page. We offer monthly, quarterly, semi-annual, and annual billing options with a 7-day refund policy for first-time subscribers.' },
    { q: 'What languages does SeemePro support?', a: 'SeemePro\'s interface supports Arabic, English, French, Turkish, Chinese, and German. Our AI analysis engine is culturally calibrated to account for regional body language and vocal variations.' },
    { q: 'How do I delete my account and data?', a: 'Go to Profile → Settings → Delete Account. Upon deletion, all personal data is permanently purged within 30 days in compliance with GDPR. You can also email privacy@seemepro.app to submit a formal data erasure request.' },
];

const FAQS_AR = [
    { q: 'ما مدى دقة تحليل SeemePro؟', a: 'تحقق SeemePro دقة عالية في التعرف على الأنماط في الظروف المضبوطة. ومع ذلك، لا يمكن لأي أداة ذكاء اصطناعي ضمان دقة 100%. النتائج تقديرات احتمالية تعتمد على جودة التسجيل والسياق الثقافي. استشر دائماً خبيراً بشرياً مؤهلاً للقرارات الحرجة.' },
    { q: 'هل تُخزَّن بيانات صوتي/فيديو على خوادمكم؟', a: 'لا. تعالج SeemePro وسائطك محلياً على جهازك (Edge AI) حيثما أمكن. إذا احتجنا للمعالجة على الخادم، تُشفَّر بياناتك أثناء النقل وتُحذف خلال 24 ساعة ما لم تحفظ النتائج في ملفك الشخصي.' },
    { q: 'هل يمكنني استخدام SeemePro على شخص آخر دون علمه؟', a: 'بالتأكيد لا. تسجيل أو تحليل أي فرد دون موافقته الصريحة يُعدّ انتهاكاً لشروط الخدمة وقد يكون مخالفاً للقانون. يفترض SeemePro أن المستخدمين حصلوا على الموافقة المطلوبة قبل الاستخدام.' },
    { q: 'كيف أترقى إلى خطة مميزة؟', a: 'انقر على "ارتقِ" في شريط التنقل العلوي أو قم بزيارة صفحة الخطط المميزة. نقدم خيارات فوترة شهرية وربع سنوية ونصف سنوية وسنوية مع سياسة استرداد لمدة 7 أيام للمشتركين الجدد.' },
    { q: 'ما اللغات التي يدعمها SeemePro؟', a: 'تدعم واجهة SeemePro العربية والإنجليزية والفرنسية والتركية والصينية والألمانية. محرك التحليل بالذكاء الاصطناعي مُعاير ثقافياً لمراعاة تنويعات لغة الجسد الإقليمية.' },
    { q: 'كيف أحذف حسابي وبياناتي؟', a: 'اذهب إلى الملف الشخصي → الإعدادات → حذف الحساب. عند الحذف، تُحذف جميع البيانات الشخصية نهائياً خلال 30 يوماً. يمكنك أيضاً إرسال بريد إلكتروني إلى privacy@seemepro.app.' },
];

const ContactUs = () => {
    const { language } = useAppStore();
    const { t } = useTranslation();
    const isAr = language === 'ar';

    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const faqs = isAr ? FAQS_AR : FAQS_EN;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        // Simulate form submission
        setTimeout(() => {
            setSubmitting(false);
            setSent(true);
        }, 1800);
    };

    return (
        <div className="min-h-screen bg-[#02040a] text-white" dir={isAr ? 'rtl' : 'ltr'}>
            <header className="fixed top-0 w-full z-50 bg-[#02040a]/80 backdrop-blur-xl border-b border-white/10 py-4">
                <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
                        <ArrowLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                        {isAr ? 'الرئيسية' : 'Home'}
                    </Link>
                    <div className="text-xs text-gray-600 uppercase tracking-widest font-bold">SEEMEPRO</div>
                </div>
            </header>

            {/* Hero */}
            <section className="pt-32 pb-16 px-6 text-center border-b border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.05)_0%,transparent_60%)] pointer-events-none" />
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
                        <MessageSquare className="w-8 h-8 text-green-400" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-4">
                        {isAr ? 'تواصل معنا' : 'Contact Us'}
                    </h1>
                    <p className="text-gray-400 max-w-xl mx-auto leading-relaxed">
                        {isAr
                            ? 'فريقنا جاهز للإجابة على أسئلتك. عادةً ما نرد خلال 24 ساعة في أيام العمل.'
                            : "Our team is ready to answer your questions. We typically respond within 24 hours on business days."}
                    </p>
                </motion.div>
            </section>

            <main className="max-w-5xl mx-auto px-6 py-16">
                <div className="grid lg:grid-cols-5 gap-12">

                    {/* Left: Contact Info */}
                    <motion.aside initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                        className="lg:col-span-2 space-y-6">
                        <div className="bg-[#0a0c16] border border-white/5 rounded-2xl p-6">
                            <h3 className="text-white font-black text-lg uppercase tracking-wide mb-6">
                                {isAr ? 'معلومات التواصل' : 'Contact Info'}
                            </h3>
                            <div className="space-y-5">
                                <a href="mailto:support@seemepro.app"
                                    className="flex items-center gap-4 text-gray-400 hover:text-white transition-colors group">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors flex-shrink-0">
                                        <Mail className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600 uppercase tracking-widest font-bold mb-0.5">
                                            {isAr ? 'الدعم العام' : 'General Support'}
                                        </p>
                                        <p className="text-white font-bold text-sm">support@seemepro.app</p>
                                    </div>
                                </a>
                                <a href="mailto:privacy@seemepro.app"
                                    className="flex items-center gap-4 text-gray-400 hover:text-white transition-colors group">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors flex-shrink-0">
                                        <Mail className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600 uppercase tracking-widest font-bold mb-0.5">
                                            {isAr ? 'الخصوصية والبيانات' : 'Privacy & Data'}
                                        </p>
                                        <p className="text-white font-bold text-sm">privacy@seemepro.app</p>
                                    </div>
                                </a>
                                <a href="mailto:legal@seemepro.app"
                                    className="flex items-center gap-4 text-gray-400 hover:text-white transition-colors group">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors flex-shrink-0">
                                        <Mail className="w-5 h-5 text-yellow-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600 uppercase tracking-widest font-bold mb-0.5">
                                            {isAr ? 'الشؤون القانونية' : 'Legal Matters'}
                                        </p>
                                        <p className="text-white font-bold text-sm">legal@seemepro.app</p>
                                    </div>
                                </a>
                            </div>
                        </div>

                        <div className="bg-[#0a0c16] border border-white/5 rounded-2xl p-6">
                            <h3 className="text-white font-black text-sm uppercase tracking-widest mb-4">
                                {isAr ? 'وقت الاستجابة' : 'Response Times'}
                            </h3>
                            <div className="space-y-3 text-sm">
                                {[
                                    { labelEn: 'General Support', labelAr: 'الدعم العام', time: '< 24h' },
                                    { labelEn: 'Billing Issues', labelAr: 'مشاكل الفواتير', time: '< 12h' },
                                    { labelEn: 'Privacy Requests', labelAr: 'طلبات الخصوصية', time: '< 30 days' },
                                    { labelEn: 'Legal Inquiries', labelAr: 'الاستفسارات القانونية', time: '< 5 days' },
                                ].map((r, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <span className="text-gray-400">{isAr ? r.labelAr : r.labelEn}</span>
                                        <span className="text-green-400 font-bold text-xs">{r.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-[#0a0c16] border border-white/5 rounded-2xl p-6">
                            <h3 className="text-white font-black text-sm uppercase tracking-widest mb-4">
                                {isAr ? 'تابعنا' : 'Follow Us'}
                            </h3>
                            <div className="flex gap-3">
                                <a href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                                    <Twitter className="w-4 h-4 text-gray-400" />
                                </a>
                                <a href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                                    <Github className="w-4 h-4 text-gray-400" />
                                </a>
                            </div>
                        </div>
                    </motion.aside>

                    {/* Right: Form + FAQ */}
                    <div className="lg:col-span-3 space-y-8">

                        {/* Contact Form */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                            className="bg-[#0a0c16] border border-white/5 rounded-2xl p-8">
                            <h3 className="text-white font-black text-xl uppercase tracking-wide mb-8">
                                {t('send_message')}
                            </h3>

                            <AnimatePresence mode="wait">
                                {sent ? (
                                    <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-12">
                                        <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                                        <h4 className="text-white font-black text-xl mb-2">
                                            {t('message_sent')}
                                        </h4>
                                        <p className="text-gray-400">
                                            {isAr ? 'سنرد عليك خلال 24 ساعة.' : "We'll get back to you within 24 hours."}
                                        </p>
                                        <button onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                                            className="mt-6 text-sm text-gray-400 hover:text-white transition-colors underline underline-offset-4">
                                            {isAr ? 'إرسال رسالة أخرى' : 'Send another message'}
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.form key="form" onSubmit={handleSubmit} className="space-y-5">
                                        <div className="grid sm:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <label className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                                                    {t('full_name')} *
                                                </label>
                                                <input required type="text" value={form.name}
                                                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                                    placeholder={isAr ? 'أدخل اسمك...' : 'Enter your name...'}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition-colors text-sm" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                                                    {t('your_email')} *
                                                </label>
                                                <input required type="email" value={form.email} dir="ltr"
                                                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                                    placeholder="your@email.com"
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition-colors text-sm" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                                                {t('subject')} *
                                            </label>
                                            <select required value={form.subject}
                                                onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-white/30 transition-colors text-sm appearance-none">
                                                <option value="">{isAr ? 'اختر الموضوع...' : 'Select a subject...'}</option>
                                                <option value="general">{isAr ? 'استفسار عام' : 'General Inquiry'}</option>
                                                <option value="billing">{isAr ? 'مشكلة في الفوترة' : 'Billing Issue'}</option>
                                                <option value="technical">{isAr ? 'دعم تقني' : 'Technical Support'}</option>
                                                <option value="privacy">{isAr ? 'طلب خصوصية' : 'Privacy Request'}</option>
                                                <option value="legal">{isAr ? 'استفسار قانوني' : 'Legal Inquiry'}</option>
                                                <option value="partnership">{isAr ? 'شراكة تجارية' : 'Business Partnership'}</option>
                                                <option value="feedback">{isAr ? 'ملاحظات واقتراحات' : 'Feedback & Suggestions'}</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                                                {t('your_message')} *
                                            </label>
                                            <textarea required rows={5} value={form.message}
                                                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                                                placeholder={isAr ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition-colors text-sm resize-none" />
                                        </div>
                                        <button type="submit" disabled={submitting}
                                            className="w-full py-4 rounded-xl bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                                            {submitting ? (
                                                <span className="animate-pulse">{isAr ? 'جاري الإرسال...' : 'Sending...'}</span>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4" />
                                                    {t('send_message')}
                                                </>
                                            )}
                                        </button>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* FAQ */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                            className="bg-[#0a0c16] border border-white/5 rounded-2xl p-8">
                            <h3 className="text-white font-black text-xl uppercase tracking-wide mb-6">
                                {t('faq')}
                            </h3>
                            <div className="space-y-3">
                                {faqs.map((faq, i) => (
                                    <div key={i} className="border border-white/5 rounded-xl overflow-hidden">
                                        <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                            className="w-full flex items-center justify-between p-4 text-left hover:bg-white/3 transition-colors group">
                                            <span className="text-white font-bold text-sm group-hover:text-cyan-400 transition-colors">{faq.q}</span>
                                            <ChevronDown className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                                        </button>
                                        <AnimatePresence>
                                            {openFaq === i && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                                                    className="overflow-hidden">
                                                    <p className="px-4 pb-4 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-3">{faq.a}</p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
};

export default ContactUs;
