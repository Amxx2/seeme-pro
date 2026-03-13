import { Shield, FileText } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LegalDisclaimerFooter = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="w-full mt-12 pb-6 flex flex-col items-center">

            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-widest text-gray-500 hover:text-cyan-400 transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/10"
            >
                <Shield className="w-3 h-3" />
                <span>Legal Disclaimer & GDPR</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-[#0a0c16] border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-[0_0_50px_rgba(0,0,0,0.8)] relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 rtl:left-4 rtl:right-auto text-gray-500 hover:text-white"
                            >
                                ✕
                            </button>

                            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                                <FileText className="w-6 h-6 text-cyan-400" />
                                <h3 className="font-black text-xl text-white uppercase tracking-widest">إخلاء المسؤولية القانوني</h3>
                            </div>

                            <div className="space-y-6 text-sm text-gray-400" dir="rtl">

                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                    <p className="text-red-400 font-bold mb-2 uppercase tracking-widest text-xs">تحذير هام</p>
                                    <p className="leading-relaxed">
                                        هذا التطبيق (SeemePro) يعتبر <strong className="text-white">أداةٌ تحليلية مساعدة</strong>، وليس جهاز كشف كذب قضائي مطلق.
                                        النتائج تعتمد على جودة التسجيل، والسياق الثقافي، والظروف البيئية.
                                        لا يُعتمد على النتائج وحدها في قراراتٍ توظيفية نهائية، أو أحكامٍ قضائية، أو تشخيصاتٍ طبية نفسية، أو تقييماتٍ أمنية حرجة.
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                                        الموافقة على السياسات (GDPR / CCPA)
                                    </h4>
                                    <ul className="list-disc list-inside space-y-2 mr-2">
                                        <li><strong className="text-gray-200">الخصوصية:</strong> التحليل يتم محلياً (Edge AI) ما أمكن — لا تخزين للمقاطع بدون موافقة صريحة. يجب إعلام أي فرد قبل تسجيله، ويُمنع استخدام التطبيق للمراقبة السرية.</li>
                                        <li><strong className="text-gray-200">النزاهة العلمية:</strong> نحن نشير لنسب الدقة بوضوح ولا نبالغ فيها، ونوصي دائماً بالاستعانة بخبراء بشريين للتحقق النهائي.</li>
                                        <li><strong className="text-gray-200">الالتزام الأخلاقي:</strong> يُمنع منعاً باتاً استغلال هذه الأداة للتمييز، أو الاضطهاد، أو تحليل القاصرين بدون إشراف قانوني أبوي.</li>
                                        <li><strong className="text-gray-200">الشفافية:</strong> نماذج الذكاء الاصطناعي المستخدمة تخضع للتطوير المستمر لضمان عدم الانحياز الثقافي قدر الإمكان.</li>
                                    </ul>
                                </div>

                                <div className="pt-4 border-t border-white/10 text-xs text-center">
                                    <p>استخدامك للتطبيق يعني موافقتك الضمنية على هذه المواثيق والسياسات.</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LegalDisclaimerFooter;
