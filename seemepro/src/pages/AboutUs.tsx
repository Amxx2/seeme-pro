import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain, Eye, Mic, Video, Zap, Star, Shield, Globe2, BookOpen } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import SiteFooter from '../components/SiteFooter';

const stats = [
    { value: '50K+', labelEn: 'Active Users', labelAr: 'مستخدم نشط' },
    { value: '2M+', labelEn: 'Analyses Performed', labelAr: 'تحليل منجز' },
    { value: '94%', labelEn: 'User Satisfaction', labelAr: 'رضا المستخدمين' },
    { value: '6', labelEn: 'Languages Supported', labelAr: 'لغات مدعومة' },
];

const features = [
    { icon: <Mic className="w-6 h-6 text-cyan-400" />, color: 'cyan', titleEn: 'Neural Voice Analysis', titleAr: 'التحليل الصوتي العصبي', descEn: 'Map vocal cord tension, pitch volatility, and micro-tremors to determine cognitive load, stress levels, and emotional authenticity in real time.', descAr: 'تحليل توتر الحبال الصوتية وتقلب النبرة والاهتزازات الدقيقة لتحديد الجهد المعرفي ومستويات التوتر والأصالة العاطفية في الوقت الفعلي.' },
    { icon: <Video className="w-6 h-6 text-purple-400" />, color: 'purple', titleEn: 'Micro-Expression Scanner', titleAr: 'ماسح التعبيرات الدقيقة', descEn: 'Detect involuntary facial muscle movements that reveal concealed emotions within 1/25th of a second — based on Paul Ekman\'s FACS system.', descAr: 'رصد حركات عضلات الوجه اللاإرادية التي تكشف المشاعر المخفية في 1/25 من الثانية — مستنداً إلى نظام FACS لبول إيكمان.' },
    { icon: <Eye className="w-6 h-6 text-yellow-400" />, color: 'yellow', titleEn: 'Pupillary Response Tracking', titleAr: 'تتبع استجابة حدقة العين', descEn: 'Monitor autonomous nervous system responses through pupil dilation algorithms during live analysis sessions.', descAr: 'مراقبة استجابات الجهاز العصبي اللاإرادي من خلال خوارزميات اتساع حدقة العين خلال جلسات التحليل المباشر.' },
    { icon: <Brain className="w-6 h-6 text-green-400" />, color: 'green', titleEn: 'Cognitive Load Estimation', titleAr: 'تقدير الجهد المعرفي', descEn: 'Combine multiple biometric signals to estimate cognitive effort, decision-making pressure, and mental deception indicators.', descAr: 'دمج إشارات بيومترية متعددة لتقدير الجهد المعرفي وضغط صنع القرار ومؤشرات الخداع الذهني.' },
];

const references = [
    { author: 'Joe Navarro (FBI)', work: '"The Dictionary of Body Language" (2018)', descEn: '400+ behavioral signals catalogued by a former FBI counterintelligence agent.', descAr: 'أكثر من 400 إشارة سلوكية موثقة من عميل استخباراتي سابق في مكتب التحقيقات الفيدرالي.' },
    { author: 'Paul Ekman', work: '"Emotions Revealed" (2023 ed.)', descEn: 'The FACS facial action coding system — the global gold standard for micro-expression analysis.', descAr: 'نظام FACS لتشفير حركات الوجه — المعيار الذهبي العالمي لتحليل التعبيرات الدقيقة.' },
    { author: 'Allan & Barbara Pease', work: '"The Definitive Book of Body Language" (2024)', descEn: 'Comprehensive guide to reading body language signals in modern social contexts.', descAr: 'دليل شامل لقراءة إشارات لغة الجسد في السياقات الاجتماعية الحديثة.' },
    { author: 'IEEE & Nature (2023-2024)', work: 'Multimodal Deception Detection Research', descEn: 'Peer-reviewed academic papers grounding our AI in validated scientific methodology.', descAr: 'أوراق أكاديمية محكّمة تدعم ذكاءنا الاصطناعي بمنهجية علمية معتمدة.' },
];

const AboutUs = () => {
    const { language } = useAppStore();
    const isAr = language === 'ar';

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
            <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(19,55,236,0.08)_0%,transparent_60%)] pointer-events-none" />
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} className="relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs text-cyan-400 font-bold uppercase tracking-widest mb-8">
                        <Zap className="w-3 h-3" />
                        {isAr ? 'أدوات ذكاء اصطناعي لتحليل السلوك' : 'AI-Powered Behavioral Analysis Tools'}
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-6">
                        {isAr ? 'من نحن' : 'About'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">SeemePro</span>
                    </h1>
                    <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light">
                        {isAr
                            ? 'نحن فريق من علماء البيانات وخبراء علم النفس السلوكي ومهندسي الذكاء الاصطناعي، متحدون برؤية واحدة: جعل تحليل لغة الجسد والصوت في متناول الجميع.'
                            : 'We are a team of data scientists, behavioral psychologists, and AI engineers, united by one vision: making body language and voice analysis accessible to everyone.'}
                    </p>
                </motion.div>
            </section>

            {/* Stats */}
            <section className="py-16 px-6 border-b border-white/5">
                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }} className="text-center">
                            <div className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tighter">{s.value}</div>
                            <div className="text-gray-500 text-sm font-bold uppercase tracking-widest">{isAr ? s.labelAr : s.labelEn}</div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Mission */}
            <section className="py-20 px-6 border-b border-white/5">
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-6">
                                {isAr ? 'مهمتنا' : 'Our Mission'}
                            </h2>
                            <p className="text-gray-400 leading-relaxed mb-4">
                                {isAr
                                    ? 'SeemePro وُلدت من اقتناع راسخ: الحقيقة مخبّأة في كل كلمة وحركة. منذ البدايات، كان البشر يقرؤون لغة الجسد بشكل حدسي. اليوم، نحن نجعل هذا الحدس علماً دقيقاً.'
                                    : 'SeemePro was born from a firm conviction: truth is hidden in every word and movement. Since the dawn of humanity, people have read body language intuitively. Today, we are making that intuition into precise science.'}
                            </p>
                            <p className="text-gray-400 leading-relaxed mb-6">
                                {isAr
                                    ? 'بدمج أحدث نماذج الذكاء الاصطناعي مع مراجع علم النفس السلوكي الأكثر رصانةً في العالم، نُقدّم لك أداة لم تكن متاحة من قبل إلا للوكالات الاستخباراتية والخبراء الجنائيين.'
                                    : 'By combining the latest AI models with the world\'s most rigorous behavioral psychology references, we give you a tool previously available only to intelligence agencies and forensic experts.'}
                            </p>
                            <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold uppercase tracking-widest">
                                <Shield className="w-4 h-4" />
                                {isAr ? 'مبني على أسس علمية · متوافق مع GDPR' : 'Science-Based · GDPR Compliant'}
                            </div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                            className="bg-[#0a0c16] border border-white/5 rounded-3xl p-8 space-y-4">
                            {[
                                { en: 'Detect deception patterns', ar: 'كشف أنماط الخداع', icon: '🎯' },
                                { en: 'Understand emotional authenticity', ar: 'فهم الأصالة العاطفية', icon: '💡' },
                                { en: 'Improve interview skills', ar: 'تحسين مهارات المقابلات', icon: '🎙️' },
                                { en: 'Strengthen interpersonal trust', ar: 'تعزيز الثقة بين الأفراد', icon: '🤝' },
                                { en: 'Protect against manipulation', ar: 'الحماية من التلاعب', icon: '🛡️' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/3 transition-colors">
                                    <span className="text-2xl">{item.icon}</span>
                                    <span className="text-gray-300 font-medium">{isAr ? item.ar : item.en}</span>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 px-6 border-b border-white/5">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-4">
                            {isAr ? 'تقنياتنا الأساسية' : 'Core Technologies'}
                        </h2>
                        <p className="text-gray-500 max-w-xl mx-auto">
                            {isAr
                                ? 'كل ميزة في SeemePro مبنية على أبحاث علمية معتمدة وخوارزميات ذكاء اصطناعي متقدمة.'
                                : 'Every SeemePro feature is built on peer-reviewed research and advanced AI algorithms.'}
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        {features.map((f, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                className="bg-[#0a0c16] border border-white/5 rounded-2xl p-8 hover:border-white/15 transition-all group">
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-5 group-hover:bg-white/10 transition-colors">
                                    {f.icon}
                                </div>
                                <h3 className="text-white font-black text-lg mb-3 uppercase tracking-wide">
                                    {isAr ? f.titleAr : f.titleEn}
                                </h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    {isAr ? f.descAr : f.descEn}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Scientific References */}
            <section className="py-20 px-6 border-b border-white/5">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">
                            <BookOpen className="w-4 h-4" />
                            {isAr ? 'المراجع العلمية' : 'Scientific References'}
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
                            {isAr ? 'مبني على العلم' : 'Grounded in Science'}
                        </h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        {references.map((ref, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                className="bg-[#0a0c16] border border-white/5 rounded-2xl p-6">
                                <p className="text-cyan-400 font-bold text-xs uppercase tracking-widest mb-1">{ref.author}</p>
                                <p className="text-white font-black text-sm mb-2">{ref.work}</p>
                                <p className="text-gray-500 text-xs leading-relaxed">{isAr ? ref.descAr : ref.descEn}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-20 px-6 border-b border-white/5">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
                            {isAr ? 'قيمنا ومبادئنا' : 'Our Values'}
                        </h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { icon: <Shield className="w-6 h-6 text-green-400" />, color: 'green', titleEn: 'Ethical AI', titleAr: 'ذكاء اصطناعي أخلاقي', descEn: 'We design our AI to be transparent, non-biased, and compliant with the highest ethical standards in behavioral analysis.', descAr: 'نصمم ذكاءنا الاصطناعي ليكون شفافاً وغير منحاز ومتوافقاً مع أعلى المعايير الأخلاقية في التحليل السلوكي.' },
                            { icon: <Star className="w-6 h-6 text-yellow-400" />, color: 'yellow', titleEn: 'Scientific Integrity', titleAr: 'النزاهة العلمية', descEn: 'We cite accuracy rates honestly, never overstate capabilities, and always recommend human expert verification for critical decisions.', descAr: 'نذكر نسب الدقة بصدق ونوصي دائماً بتحقق الخبراء البشريين للقرارات الحرجة.' },
                            { icon: <Globe2 className="w-6 h-6 text-cyan-400" />, color: 'cyan', titleEn: 'Cultural Sensitivity', titleAr: 'الحساسية الثقافية', descEn: 'Body language varies across cultures. Our models account for cultural context to minimize false conclusions and cultural biases.', descAr: 'لغة الجسد تتفاوت بين الثقافات. نماذجنا تراعي السياق الثقافي لتقليل الاستنتاجات الخاطئة.' },
                        ].map((v, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                                className="bg-[#0a0c16] border border-white/5 rounded-2xl p-8 text-center hover:border-white/10 transition-colors">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-5">
                                    {v.icon}
                                </div>
                                <h3 className="text-white font-black text-lg mb-3 uppercase tracking-wide">
                                    {isAr ? v.titleAr : v.titleEn}
                                </h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    {isAr ? v.descAr : v.descEn}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6 text-center">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-4">
                        {isAr ? 'جاهز لترى الحقيقة؟' : 'Ready to See the Truth?'}
                    </h2>
                    <p className="text-gray-400 mb-8">
                        {isAr
                            ? 'انضم إلى أكثر من 50,000 مستخدم يستخدمون SeemePro يومياً لفهم التواصل البشري بعمق أكبر.'
                            : 'Join over 50,000 users who use SeemePro daily to understand human communication at a deeper level.'}
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link to="/" className="bg-white text-black font-black text-sm uppercase tracking-wider px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                            {isAr ? 'ابدأ مجاناً' : 'Start Free'}
                        </Link>
                        <Link to="/contact" className="border border-white/20 text-white font-bold text-sm uppercase tracking-wider px-8 py-4 rounded-xl hover:bg-white/5 transition-colors">
                            {isAr ? 'تواصل معنا' : 'Contact Us'}
                        </Link>
                    </div>
                </div>
            </section>

            <SiteFooter />
        </div>
    );
};

export default AboutUs;
