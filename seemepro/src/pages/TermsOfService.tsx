import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft, AlertTriangle, Scale, Shield, Zap, Users, Mail } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import SiteFooter from '../components/SiteFooter';

interface TOSSection { icon: React.ReactNode; title: string; content: string; }

const SECTIONS_EN: TOSSection[] = [
    {
        icon: <FileText className="w-5 h-5 text-cyan-400" />,
        title: '1. Acceptance of Terms',
        content: `By accessing or using SeemePro ("the Service"), you confirm that you:\n\n• Are at least 18 years of age (or the age of majority in your jurisdiction).\n• Have read, understood, and agree to be bound by these Terms of Service.\n• Have read and agree to our **Privacy Policy**, which is incorporated by reference into these Terms.\n• Are not prohibited from using the Service under any applicable laws.\n\nIf you do not agree to these Terms, you must immediately cease all use of SeemePro. We reserve the right to update these Terms at any time. Material changes will be communicated at least 30 days in advance via email or prominent notice on the platform.`
    },
    {
        icon: <Zap className="w-5 h-5 text-yellow-400" />,
        title: '2. Description of Service',
        content: `SeemePro provides AI-powered behavioral analysis tools including:\n\n• **Voice Analysis**: Detection of stress, deception indicators, and emotional state from audio recordings.\n• **Video Analysis**: Micro-expression scanning and body language analysis from video footage.\n• **Live Interview**: Real-time behavioral analysis during live sessions.\n• **Toxic Detector & Hunger Scanner**: Entertainment-oriented viral features powered by voice AI.\n\n**IMPORTANT DISCLAIMER**: SeemePro is an **analytical support tool only** — not a certified lie detector, forensic instrument, or psychological diagnosis tool. The accuracy of results depends on recording quality, cultural context, and environmental conditions. Results should NEVER be used as the sole basis for employment decisions, legal judgments, medical diagnoses, or security assessments.`
    },
    {
        icon: <Users className="w-5 h-5 text-green-400" />,
        title: '3. User Accounts & Responsibilities',
        content: `By creating an account on SeemePro, you agree to:\n\n• Provide accurate and truthful registration information.\n• Maintain the security of your account credentials. You are responsible for all activity under your account.\n• Notify us immediately of any unauthorized account access at support@seemepro.app.\n• Use the Service only for lawful purposes and in compliance with these Terms.\n\n**Age Restriction**: SeemePro is strictly prohibited for use on individuals under 18 years of age without verifiable parental or legal guardian consent and supervision. Any violation of this restriction will result in immediate account termination.\n\n**Account Termination**: We reserve the right to suspend or terminate accounts that violate these Terms without prior notice.`
    },
    {
        icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
        title: '4. Prohibited Uses',
        content: `You expressly agree NOT to use SeemePro for:\n\n• **Unauthorized Surveillance**: Recording, monitoring, or analyzing any individual without their explicit, informed consent.\n• **Illegal Discrimination**: Using analysis results to discriminate based on race, religion, gender, disability, national origin, or any other protected characteristic.\n• **Legal & Medical Abuse**: Using results as sole evidence in legal proceedings, employment termination decisions, or medical/psychiatric diagnoses.\n• **Commercial Resale**: Reselling, sublicensing, or repackaging the Service or its outputs without written authorization from SeemePro.\n• **AI Training**: Using platform outputs to train competing AI models or for reverse-engineering purposes.\n• **Malicious Activity**: Attempting to hack, crash, or disrupt the platform or its infrastructure.\n• **Child Exploitation**: Any use involving individuals under 18 without proper legal consent.\n\nViolation of these prohibitions may result in immediate account termination and potential civil or criminal referral.`
    },
    {
        icon: <Scale className="w-5 h-5 text-purple-400" />,
        title: '5. Subscriptions & Payments',
        content: `**Free Tier**: SeemePro offers a free tier with limited monthly analyses and ad-supported credit earning.\n\n**Premium Subscriptions**: Premium ("Jedi Master") plans are available on monthly, quarterly, semi-annual, and annual billing cycles.\n\n• **Billing**: Subscriptions are billed in advance. Payments are processed securely via Stripe.\n• **Cancellation**: You may cancel your subscription at any time. Access continues until the end of the current billing period. No pro-rata refunds are provided for partial periods.\n• **Refunds**: We offer refunds within 7 days of initial subscription purchase if you have not used any premium features. Contact support@seemepro.app.\n• **Price Changes**: We will notify you at least 30 days before any price increases. Continued use after the notice period constitutes acceptance of new pricing.`
    },
    {
        icon: <Shield className="w-5 h-5 text-cyan-400" />,
        title: '6. Intellectual Property',
        content: `**Our Rights**: SeemePro, its logo, AI models, algorithms, software, design, and all related content are the exclusive intellectual property of SeemePro and its licensors, protected by copyright, trademark, and other applicable laws.\n\n**Your License**: We grant you a limited, non-exclusive, non-transferable, revocable license to access and use SeemePro solely for its intended purposes in accordance with these Terms.\n\n**Your Content**: You retain ownership of any content (voice, video) you upload. By uploading content, you grant SeemePro a limited, non-exclusive license to process it for the sole purpose of providing the requested analysis service. We do not claim ownership of your content.\n\n**Restrictions**: You may not copy, modify, distribute, sell, or create derivative works of SeemePro without our express written consent.`
    },
    {
        icon: <AlertTriangle className="w-5 h-5 text-orange-400" />,
        title: '7. Disclaimer of Warranties',
        content: `**THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND**, whether express, implied, or statutory. SeemePro expressly disclaims all warranties, including but not limited to:\n\n• Warranties of merchantability, fitness for a particular purpose, and non-infringement.\n• Warranties that the Service will be uninterrupted, error-free, or secure.\n• Warranties regarding the accuracy, reliability, or completeness of AI analysis results.\n\nAI behavioral analysis is an evolving science. No analysis tool — including SeemePro — can guarantee 100% accuracy. Results are probabilistic estimates based on pattern recognition and should always be considered in context by a qualified human professional.`
    },
    {
        icon: <Scale className="w-5 h-5 text-blue-400" />,
        title: '8. Limitation of Liability',
        content: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, SEEMEPRO SHALL NOT BE LIABLE FOR:\n\n• Any indirect, incidental, special, consequential, or punitive damages.\n• Loss of profits, data, goodwill, or other intangible losses.\n• Damages resulting from reliance on the Service's AI analysis outputs.\n• Damages arising from unauthorized access to your account.\n• Any claims by third parties recorded or analyzed using the Service.\n\nIN NO EVENT SHALL SEEMEPRO'S TOTAL LIABILITY EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO SEEMEPRO IN THE THREE MONTHS PRECEDING THE CLAIM OR (B) USD $50.\n\nSome jurisdictions do not allow limitation of liability for certain damages, so the above limitations may not apply to you.`
    },
    {
        icon: <FileText className="w-5 h-5 text-gray-400" />,
        title: '9. Governing Law & Disputes',
        content: `These Terms are governed by and construed in accordance with the laws of the applicable jurisdiction, without regard to conflict of law provisions.\n\n**Dispute Resolution**: Before initiating formal legal proceedings, you agree to first contact us at legal@seemepro.app to attempt an informal resolution. We will endeavor to resolve disputes within 30 days.\n\n**Arbitration**: If informal resolution fails, disputes shall be resolved through binding arbitration, except where prohibited by law or where you seek injunctive relief to protect intellectual property.\n\n**Class Action Waiver**: You waive any right to participate in class-action lawsuits or class-wide arbitration against SeemePro.`
    },
    {
        icon: <Mail className="w-5 h-5 text-cyan-400" />,
        title: '10. Contact Information',
        content: `For legal inquiries and Terms-related matters:\n\n**Legal**: legal@seemepro.app\n**Support**: support@seemepro.app\n**Privacy**: privacy@seemepro.app\n\nThese Terms of Service were last updated on **March 1, 2025** and supersede all prior agreements regarding use of the Service.`
    }
];

const SECTIONS_AR: TOSSection[] = [
    {
        icon: <FileText className="w-5 h-5 text-cyan-400" />,
        title: '١. قبول الشروط',
        content: `باستخدامك لـ SeemePro، فإنك تؤكد أنك:\n\n• تبلغ من العمر 18 عاماً على الأقل (أو سن الرشد في نطاقك القضائي).\n• قرأت هذه الشروط وتوافق على الالتزام بها.\n• قرأت **سياسة الخصوصية** والموافقة عليها (مدمجة بالإشارة في هذه الشروط).\n• غير محظور عليك استخدام الخدمة بموجب القوانين السارية.\n\nإذا كنت لا توافق على هذه الشروط، يجب عليك التوقف فوراً عن استخدام SeemePro. نحتفظ بحق تحديث هذه الشروط في أي وقت مع إخطار مسبق بـ 30 يوماً للتغييرات الجوهرية.`
    },
    {
        icon: <Zap className="w-5 h-5 text-yellow-400" />,
        title: '٢. وصف الخدمة',
        content: `توفر SeemePro أدوات تحليل سلوكي مدعومة بالذكاء الاصطناعي:\n\n• **تحليل الصوت**: رصد التوتر ومؤشرات الخداع والحالة العاطفية.\n• **تحليل الفيديو**: تحليل التعبيرات الدقيقة ولغة الجسد.\n• **المقابلة المباشرة**: تحليل سلوكي في الوقت الفعلي.\n• **كاشف السمية وماسح الجوع**: ميزات ترفيهية بصوت الذكاء الاصطناعي.\n\n**إخلاء مسؤولية هام**: SeemePro هي **أداة تحليلية مساعدة فقط** — وليست جهاز كشف كذب معتمد أو أداة تشخيص نفسي. النتائج لا يجب أن تُستخدم وحدها في قرارات التوظيف أو الأحكام القضائية أو التشخيصات الطبية.`
    },
    {
        icon: <Users className="w-5 h-5 text-green-400" />,
        title: '٣. حسابات المستخدمين والمسؤوليات',
        content: `بإنشاء حساب، تتعهد بـ:\n\n• تقديم معلومات تسجيل دقيقة وصادقة.\n• الحفاظ على أمان بيانات اعتماد حسابك. أنت مسؤول عن جميع النشاطات تحت حسابك.\n• إخطارنا فوراً بأي وصول غير مصرح به على support@seemepro.app.\n• استخدام الخدمة للأغراض القانونية فقط.\n\n**قيود العمر**: يُحظر تماماً استخدام SeemePro على أفراد دون 18 عاماً دون موافقة أولياء الأمور.\n\n**إنهاء الحساب**: نحتفظ بحق تعليق أو إنهاء الحسابات المنتهكة لهذه الشروط.`
    },
    {
        icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
        title: '٤. الاستخدامات المحظورة',
        content: `توافق صراحةً على عدم استخدام SeemePro لـ:\n\n• **المراقبة غير المصرح بها**: تسجيل أو تحليل أي فرد دون موافقته الصريحة.\n• **التمييز غير القانوني**: استخدام النتائج للتمييز القائم على العرق أو الدين أو الجنس أو الإعاقة.\n• **إساءة القانون والطب**: استخدام النتائج كدليل وحيد في الإجراءات القانونية أو التشخيصات الطبية.\n• **إعادة البيع التجاري**: بيع أو ترخيص الخدمة أو مخرجاتها دون إذن مكتوب.\n• **تدريب الذكاء الاصطناعي**: استخدام مخرجات المنصة لتدريب نماذج ذكاء اصطناعي منافسة.\n• **استغلال الأطفال**: أي استخدام يتعلق بأفراد دون 18 عاماً دون موافقة قانونية.`
    },
    {
        icon: <Scale className="w-5 h-5 text-purple-400" />,
        title: '٥. الاشتراكات والمدفوعات',
        content: `**الطبقة المجانية**: تقدم SeemePro طبقة مجانية بتحليلات شهرية محدودة.\n\n**الاشتراكات المميزة**: خطط "Jedi Master" متاحة بدورات فوترة شهرية وربع سنوية ونصف سنوية وسنوية.\n\n• **الفوترة**: الاشتراكات تُفوتر مسبقاً عبر Stripe.\n• **الإلغاء**: يمكنك الإلغاء في أي وقت. الوصول يستمر حتى نهاية الدورة الحالية.\n• **استرداد الأموال**: نقدم استرداداً خلال 7 أيام من الاشتراك الأولي إذا لم تستخدم الميزات المميزة.\n• **تغييرات الأسعار**: إخطار مسبق بـ 30 يوماً قبل أي زيادة في الأسعار.`
    },
    {
        icon: <Shield className="w-5 h-5 text-cyan-400" />,
        title: '٦. الملكية الفكرية',
        content: `**حقوقنا**: SeemePro وشعارها ونماذج الذكاء الاصطناعي والخوارزميات والتصميم هي ملكية فكرية حصرية لـ SeemePro.\n\n**ترخيصك**: نمنحك ترخيصاً محدوداً وغير قابل للنقل للوصول واستخدام SeemePro وفقاً لهذه الشروط.\n\n**محتواك**: تحتفظ بملكية المحتوى الذي ترفعه. بالرفع، تمنحنا ترخيصاً محدوداً لمعالجته لغرض التحليل فقط.\n\n**القيود**: لا يجوز نسخ أو تعديل أو توزيع SeemePro دون موافقة كتابية منا.`
    },
    {
        icon: <AlertTriangle className="w-5 h-5 text-orange-400" />,
        title: '٧. إخلاء ضمانات',
        content: `**تُقدَّم الخدمة "كما هي" دون ضمانات من أي نوع**. تخلي SeemePro صراحةً عن جميع الضمانات، بما فيها:\n\n• ضمانات القابلية للتسويق والملاءمة لغرض معين.\n• ضمانات أن الخدمة ستكون بدون انقطاع أو أخطاء.\n• ضمانات دقة أو موثوقية نتائج التحليل بالذكاء الاصطناعي.\n\nتحليل السلوك بالذكاء الاصطناعي علم متطور. لا يمكن لأي أداة ضمان دقة 100%. النتائج تقديرات احتمالية يجب أن يراجعها متخصص بشري مؤهل.`
    },
    {
        icon: <Scale className="w-5 h-5 text-blue-400" />,
        title: '٨. تحديد المسؤولية',
        content: `إلى الحد الأقصى المسموح به بموجب القانون المعمول به، لن تكون SeemePro مسؤولة عن:\n\n• أي أضرار غير مباشرة أو عرضية أو خاصة أو تبعية أو عقابية.\n• خسارة الأرباح أو البيانات أو الشهرة.\n• الأضرار الناتجة عن الاعتماد على نتائج التحليل.\n• أي مطالبات من أطراف ثالثة تم تسجيلها أو تحليلها باستخدام الخدمة.\n\nفي جميع الأحوال، لن تتجاوز مسؤولية SeemePro المبلغ الأكبر بين: (أ) ما دفعته خلال الثلاثة أشهر السابقة للمطالبة أو (ب) 50 دولاراً أمريكياً.`
    },
    {
        icon: <FileText className="w-5 h-5 text-gray-400" />,
        title: '٩. القانون الحاكم وتسوية النزاعات',
        content: `تخضع هذه الشروط للقوانين السارية المعمول بها.\n\n**تسوية النزاعات**: قبل اللجوء للإجراءات القانونية، توافق على التواصل معنا على legal@seemepro.app لمحاولة تسوية ودية خلال 30 يوماً.\n\n**التحكيم**: إذا فشلت التسوية الودية، تُحسم النزاعات عبر تحكيم ملزم.\n\n**التنازل عن الدعاوى الجماعية**: تتنازل عن حقك في المشاركة في أي دعاوى قضائية جماعية ضد SeemePro.`
    },
    {
        icon: <Mail className="w-5 h-5 text-cyan-400" />,
        title: '١٠. معلومات التواصل',
        content: `للاستفسارات القانونية والشروط:\n\n**القانوني**: legal@seemepro.app\n**الدعم**: support@seemepro.app\n**الخصوصية**: privacy@seemepro.app\n\nآخر تحديث لشروط الخدمة هذه: **١ مارس ٢٠٢٥**.`
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

const TermsOfService = () => {
    const { language } = useAppStore();
    const isAr = language === 'ar';
    const sections = isAr ? SECTIONS_AR : SECTIONS_EN;

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
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.05)_0%,transparent_60%)] pointer-events-none" />
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-6">
                        <Scale className="w-8 h-8 text-purple-400" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-4">
                        {isAr ? 'شروط الخدمة' : 'Terms of Service'}
                    </h1>
                    <p className="text-gray-400 max-w-xl mx-auto leading-relaxed">
                        {isAr
                            ? 'يُرجى قراءة هذه الشروط بعناية قبل استخدام SeemePro. استخدامك للخدمة يعني قبولك الكامل لهذه الشروط.'
                            : 'Please read these Terms carefully before using SeemePro. Your use of the Service constitutes your full acceptance of these Terms.'}
                    </p>
                    <p className="text-gray-600 text-xs mt-4 uppercase tracking-widest font-bold">
                        {isAr ? 'آخر تحديث: ١ مارس ٢٠٢٥' : 'Last Updated: March 1, 2025'}
                    </p>
                </motion.div>
            </section>

            <main className="max-w-4xl mx-auto px-6 py-16 space-y-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-300 text-sm leading-relaxed">
                            {isAr
                                ? 'SeemePro هي أداة تحليلية مساعدة. لا يجوز الاعتماد على نتائجها وحدها في أي قرارات قانونية أو توظيفية أو طبية. المستخدم يتحمل المسؤولية الكاملة عن كيفية استخدام هذه النتائج.'
                                : 'SeemePro is an analytical support tool only. Results must never be used as the sole basis for legal, employment, or medical decisions. The user bears full responsibility for how results are applied.'}
                        </p>
                    </div>
                </motion.div>

                {sections.map((section, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 * i + 0.3 }}
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

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 }}
                    className="bg-white/3 border border-white/10 rounded-2xl p-8 text-center">
                    <Mail className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                    <h3 className="text-white font-black text-lg mb-2">
                        {isAr ? 'أسئلة قانونية؟' : 'Legal Questions?'}
                    </h3>
                    <a href="mailto:legal@seemepro.app"
                        className="inline-flex items-center gap-2 bg-white text-black font-bold text-sm uppercase tracking-wider px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors">
                        <Mail className="w-4 h-4" />legal@seemepro.app
                    </a>
                </motion.div>

                <div className="flex flex-wrap gap-3 justify-center pt-4">
                    <Link to="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors border border-white/10 px-4 py-2 rounded-full hover:bg-white/5">
                        {isAr ? '← سياسة الخصوصية' : '← Privacy Policy'}
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

export default TermsOfService;
