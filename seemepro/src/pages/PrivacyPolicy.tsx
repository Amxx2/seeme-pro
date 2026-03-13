import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Eye, Lock, Database, Globe2, UserCheck, Mail } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import SiteFooter from '../components/SiteFooter';

interface PolicySection { icon: React.ReactNode; title: string; content: string; }

const SECTIONS_EN: PolicySection[] = [
    {
        icon: <Eye className="w-5 h-5 text-cyan-400" />,
        title: '1. Information We Collect',
        content: `SeemePro collects the following when you use our services:\n\n• **Account Information**: Username, email address, and encrypted password upon registration.\n• **Usage Data**: Voice and video you upload or record for analysis. These are processed locally (Edge AI) and never stored without your explicit consent.\n• **Technical Data**: Device type, browser version, IP address, session IDs for security.\n• **Cookies**: Session cookies for authentication. Analytics cookies are only set after explicit consent.\n\nWe do NOT collect biometric data for identification, resale, or profiling. All analysis results are generated in real-time and discarded after your session unless you save them.`
    },
    {
        icon: <Database className="w-5 h-5 text-purple-400" />,
        title: '2. How We Use Your Data',
        content: `We use collected information exclusively for:\n\n• **Providing the Service**: Processing your voice/video inputs through our AI engine.\n• **Account Management**: Maintaining your profile, credits, coins, and subscription.\n• **Security**: Detecting fraud, abuse, and unauthorized access.\n• **Service Improvement**: Aggregated, anonymized performance metrics (opt-out available in Profile).\n• **Communications**: Transactional emails only. No marketing without explicit opt-in.\n\nWe do NOT sell, rent, or trade your personal data to any third party.`
    },
    {
        icon: <Lock className="w-5 h-5 text-green-400" />,
        title: '3. Data Security & Storage',
        content: `Your data security is our highest priority:\n\n• **Encryption in Transit**: All data transfers use TLS 1.3 encryption.\n• **Encryption at Rest**: Stored user data is encrypted using AES-256.\n• **Edge AI Processing**: Analysis is performed on your device where possible — raw media files never leave your device.\n• **Data Minimization**: Only strictly necessary data is stored. Unsaved analysis results are deleted within 24 hours.\n• **Retention**: Account data is retained for the duration of your account. Upon deletion, personal data is purged within 30 days.\n\nIn case of a data breach, affected users and authorities will be notified within 72 hours per GDPR Article 33.`
    },
    {
        icon: <Globe2 className="w-5 h-5 text-blue-400" />,
        title: '4. GDPR & CCPA Compliance',
        content: `If you are in the EEA, UK, or California, you have additional rights:\n\n**GDPR Rights (EEA/UK)**:\n• Right of Access — request a copy of your personal data.\n• Right to Rectification — correct inaccurate data.\n• Right to Erasure — request deletion of your personal data.\n• Right to Portability — receive your data in machine-readable format.\n• Right to Object — object to processing based on legitimate interests.\n\n**CCPA Rights (California)**:\n• Right to Know, Delete, and Opt-Out of sale of personal information (we do not sell personal data).\n\nContact: **privacy@seemepro.app** — we respond within 30 days.`
    },
    {
        icon: <Eye className="w-5 h-5 text-yellow-400" />,
        title: '5. Camera & Microphone Usage',
        content: `SeemePro requires camera/microphone access for its core AI analysis features:\n\n• **Explicit Permission**: We request access only when you initiate an analysis session. You may revoke it anytime via browser/device settings.\n• **No Background Recording**: We do NOT record or transmit any media outside of an active, user-initiated session.\n• **Consent Requirement**: You must obtain explicit consent from any third party before recording them. Recording without consent may violate local laws. The user assumes full legal responsibility.\n• **Prohibited Uses**: Covert surveillance, stalking, or unauthorized monitoring is strictly prohibited and will result in immediate account termination.`
    },
    {
        icon: <Database className="w-5 h-5 text-orange-400" />,
        title: '6. Cookies & Tracking',
        content: `We use the following cookies:\n\n• **Strictly Necessary**: Required for authentication and session management. Cannot be disabled.\n• **Analytics**: Understand platform usage (page views, features). Set only after you accept our cookie policy.\n• **Preference**: Remember your language and display settings.\n\nWe do NOT use third-party advertising trackers, fingerprinting, or cross-site tracking technologies.`
    },
    {
        icon: <UserCheck className="w-5 h-5 text-cyan-400" />,
        title: '7. Third-Party Services',
        content: `SeemePro may use the following third-party services:\n\n• **Hosting**: Secure cloud providers compliant with ISO 27001 and SOC 2 Type II.\n• **Payment Processor**: Stripe for premium subscriptions. We never see or store your full payment card details. See stripe.com/privacy.\n• **Analytics**: Optional, consent-gated analytics to improve the service.`
    },
    {
        icon: <Mail className="w-5 h-5 text-purple-400" />,
        title: '8. Contact & Data Protection',
        content: `For any privacy inquiries, requests, or complaints:\n\n**Privacy Email**: privacy@seemepro.app\n**Support Email**: support@seemepro.app\n**Response Time**: Within 30 business days for data subject requests.\n\nIf unsatisfied with our response, you may lodge a complaint with your local data protection authority (e.g., ICO in the UK, CNIL in France).\n\nThis Privacy Policy was last updated on **March 1, 2025**. Material changes will be communicated at least 30 days before taking effect.`
    }
];

const SECTIONS_AR: PolicySection[] = [
    {
        icon: <Eye className="w-5 h-5 text-cyan-400" />,
        title: '١. المعلومات التي نجمعها',
        content: `تجمع SeemePro المعلومات التالية:\n\n• **معلومات الحساب**: اسم المستخدم والبريد الإلكتروني وكلمة المرور المشفرة.\n• **بيانات الاستخدام**: الصوت والفيديو الذي ترفعه للتحليل. يُعالج محلياً (Edge AI) ولا يُخزَّن دون موافقتك.\n• **البيانات التقنية**: نوع الجهاز والمتصفح وعنوان IP ومعرّفات الجلسة.\n• **الكوكيز**: كوكيز الجلسة للمصادقة. كوكيز التحليل تُضبط فقط بعد موافقتك.\n\nلا نجمع بيانات بيومترية للتعريف أو إعادة البيع. جميع نتائج التحليل تُحذف بعد انتهاء الجلسة ما لم تحفظها.`
    },
    {
        icon: <Database className="w-5 h-5 text-purple-400" />,
        title: '٢. كيف نستخدم بياناتك',
        content: `نستخدم المعلومات حصراً من أجل:\n\n• **تقديم الخدمة**: معالجة مدخلاتك عبر محرك الذكاء الاصطناعي.\n• **إدارة الحساب**: الحفاظ على ملفك الشخصي والرصيد والاشتراك.\n• **الأمان**: الكشف عن الاحتيال والوصول غير المصرح به.\n• **تحسين الخدمة**: مقاييس أداء مجمّعة ومجهولة الهوية.\n• **التواصل**: رسائل تعاملية فقط. لا تسويق دون موافقتك.\n\nلا نبيع أو نتداول بياناتك الشخصية مع أي طرف ثالث.`
    },
    {
        icon: <Lock className="w-5 h-5 text-green-400" />,
        title: '٣. أمن البيانات والتخزين',
        content: `أمن بياناتك هو أولويتنا القصوى:\n\n• **تشفير أثناء النقل**: TLS 1.3.\n• **تشفير في السكون**: AES-256 للبيانات المخزّنة.\n• **معالجة Edge AI**: التحليل يتم على جهازك — الملفات الإعلامية لا تغادر جهازك.\n• **تقليص البيانات**: نتائج التحليل غير المحفوظة تُحذف خلال 24 ساعة.\n• **سياسة الاحتجاز**: تُحذف البيانات الشخصية نهائياً خلال 30 يوماً من حذف الحساب.\n\nفي حالة اختراق البيانات، سنُخطر المتأثرين والسلطات خلال 72 ساعة وفقاً للمادة 33 من GDPR.`
    },
    {
        icon: <Globe2 className="w-5 h-5 text-blue-400" />,
        title: '٤. الامتثال للوائح GDPR وCCPA',
        content: `إذا كنت في منطقة EEA أو المملكة المتحدة أو كاليفورنيا، فلديك حقوق إضافية:\n\n**حقوق GDPR**:\n• حق الوصول — طلب نسخة من بياناتك الشخصية.\n• حق التصحيح — تصحيح البيانات غير الدقيقة.\n• حق المحو — طلب حذف بياناتك.\n• حق قابلية نقل البيانات.\n• حق الاعتراض على المعالجة.\n\n**حقوق CCPA (كاليفورنيا)**:\n• حق المعرفة، الحذف، وإلغاء الاشتراك في بيع البيانات (نحن لا نبيع بياناتك).\n\nتواصل على: **privacy@seemepro.app** — نرد خلال 30 يوماً.`
    },
    {
        icon: <Eye className="w-5 h-5 text-yellow-400" />,
        title: '٥. استخدام الكاميرا والميكروفون',
        content: `تتطلب SeemePro الوصول للكاميرا والميكروفون:\n\n• **إذن صريح**: نطلب الوصول فقط عند بدء جلسة تحليل. يمكنك إلغاؤه من إعدادات متصفحك.\n• **لا تسجيل خلفي**: لا نسجّل أي بيانات خارج جلسة نشطة بدأها المستخدم.\n• **شرط الموافقة**: يجب الحصول على موافقة أي طرف ثالث قبل تسجيله. التسجيل دون موافقة قد يُشكّل انتهاكاً للقانون. المستخدم يتحمل المسؤولية القانونية الكاملة.\n• **الاستخدامات المحظورة**: المراقبة السرية والتحرش محظوران تماماً.`
    },
    {
        icon: <Database className="w-5 h-5 text-orange-400" />,
        title: '٦. ملفات تعريف الارتباط والتتبع',
        content: `نستخدم الأنواع التالية:\n\n• **الكوكيز الضرورية**: للمصادقة وإدارة الجلسة. لا يمكن تعطيلها.\n• **كوكيز التحليل**: لفهم استخدام المنصة. تُضبط بعد موافقتك فقط.\n• **كوكيز التفضيلات**: لتذكر إعدادات اللغة والعرض.\n\nلا نستخدم متتبعات إعلانية تابعة لجهات خارجية أو بصمات رقمية.`
    },
    {
        icon: <UserCheck className="w-5 h-5 text-cyan-400" />,
        title: '٧. خدمات الطرف الثالث',
        content: `قد تستخدم SeemePro الخدمات التالية:\n\n• **الاستضافة**: موفرو سحابة آمنة متوافقون مع ISO 27001 وSOC 2 النوع الثاني.\n• **معالجة المدفوعات**: Stripe للاشتراكات. لا نرى بيانات بطاقتك الكاملة. راجع stripe.com/privacy.\n• **التحليلات**: تحليلات اختيارية خاضعة للموافقة.`
    },
    {
        icon: <Mail className="w-5 h-5 text-purple-400" />,
        title: '٨. التواصل وحماية البيانات',
        content: `لأي استفسارات متعلقة بالخصوصية:\n\n**البريد الإلكتروني**: privacy@seemepro.app\n**الدعم**: support@seemepro.app\n**وقت الاستجابة**: خلال 30 يوم عمل لطلبات أصحاب البيانات.\n\nإذا لم تكن راضياً، يمكنك تقديم شكوى لسلطة حماية البيانات المحلية.\n\nآخر تحديث: **١ مارس ٢٠٢٥**. التغييرات الجوهرية تُبلَّغ قبل 30 يوماً من سريانها.`
    }
];

const RenderContent = ({ content }: { content: string }) => (
    <div className="text-gray-400 text-sm leading-relaxed space-y-1">
        {content.split('\n').map((line, j) => {
            if (!line.trim()) return <br key={j} />;
            if (line.includes('**')) {
                const parts = line.split('**');
                return (
                    <p key={j}>
                        {parts.map((part, k) => k % 2 === 1
                            ? <span key={k} className="text-white font-bold">{part}</span>
                            : part
                        )}
                    </p>
                );
            }
            return <p key={j}>{line}</p>;
        })}
    </div>
);

const PrivacyPolicy = () => {
    const { t } = useTranslation();
    const { language } = useAppStore();
    const isAr = language === 'ar';
    const sections = isAr ? SECTIONS_AR : SECTIONS_EN;

    // suppress unused warning
    void t;

    return (
        <div className="min-h-screen bg-[#02040a] text-white" dir={isAr ? 'rtl' : 'ltr'}>
            <header className="fixed top-0 w-full z-50 bg-[#02040a]/80 backdrop-blur-xl border-b border-white/10 py-4">
                <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
                        <ArrowLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                        {isAr ? 'الرئيسية' : 'Home'}
                    </Link>
                    <div className="text-xs text-gray-600 uppercase tracking-widest font-bold">SEEMEPRO</div>
                </div>
            </header>

            <section className="pt-32 pb-16 px-6 text-center border-b border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,210,255,0.05)_0%,transparent_60%)] pointer-events-none" />
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-6">
                        <Shield className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-4">
                        {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
                    </h1>
                    <p className="text-gray-400 max-w-xl mx-auto leading-relaxed">
                        {isAr
                            ? 'خصوصيتك حق مقدّس. هذه الوثيقة تشرح كيف نحمي بياناتك.'
                            : 'Your privacy is sacred. This document explains transparently how SeemePro protects your data.'}
                    </p>
                    <p className="text-gray-600 text-xs mt-4 uppercase tracking-widest font-bold">
                        {isAr ? 'آخر تحديث: ١ مارس ٢٠٢٥' : 'Last Updated: March 1, 2025'}
                    </p>
                </motion.div>
            </section>

            <main className="max-w-4xl mx-auto px-6 py-16 space-y-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-6">
                    <p className="text-cyan-300 text-sm leading-relaxed font-medium">
                        {isAr
                            ? '⚠️ باستخدامك لـ SeemePro، فإنك توافق على بنود سياسة الخصوصية هذه.'
                            : '⚠️ By using SeemePro, you agree to the terms of this Privacy Policy.'}
                    </p>
                </motion.div>

                {sections.map((section, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i + 0.3 }}
                        className="bg-[#0a0c16] border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                                {section.icon}
                            </div>
                            <h2 className="text-lg font-black text-white uppercase tracking-wide">{section.title}</h2>
                        </div>
                        <RenderContent content={section.content} />
                    </motion.div>
                ))}

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
                    className="bg-white/3 border border-white/10 rounded-2xl p-8 text-center">
                    <Mail className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                    <h3 className="text-white font-black text-lg mb-2">{isAr ? 'لديك سؤال؟' : 'Have a Question?'}</h3>
                    <p className="text-gray-400 text-sm mb-4">
                        {isAr ? 'تواصل مع فريق الخصوصية في أي وقت.' : 'Reach our privacy team anytime.'}
                    </p>
                    <a href="mailto:privacy@seemepro.app"
                        className="inline-flex items-center gap-2 bg-white text-black font-bold text-sm uppercase tracking-wider px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors">
                        <Mail className="w-4 h-4" />privacy@seemepro.app
                    </a>
                </motion.div>

                <div className="flex flex-wrap gap-3 justify-center pt-4">
                    <Link to="/terms" className="text-sm text-gray-400 hover:text-white transition-colors border border-white/10 px-4 py-2 rounded-full hover:bg-white/5">
                        {isAr ? 'شروط الخدمة →' : 'Terms of Service →'}
                    </Link>
                    <Link to="/contact" className="text-sm text-gray-400 hover:text-white transition-colors border border-white/10 px-4 py-2 rounded-full hover:bg-white/5">
                        {isAr ? 'تواصل معنا →' : 'Contact Us →'}
                    </Link>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
};

export default PrivacyPolicy;
