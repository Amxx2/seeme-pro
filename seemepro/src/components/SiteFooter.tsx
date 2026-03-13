import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Shield, FileText, Info, Mail, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Unique SEEMEPRO eye icon — consistent with MainLayout
const SeemeProEye = ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="eyeGradFooter" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="50%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#475569" />
            </linearGradient>
        </defs>
        <ellipse cx="18" cy="18" rx="16" ry="9" stroke="url(#eyeGradFooter)" strokeWidth="1.5" />
        <circle cx="18" cy="18" r="5.5" stroke="url(#eyeGradFooter)" strokeWidth="1.5" />
        <circle cx="18" cy="18" r="2.5" fill="url(#eyeGradFooter)" />
    </svg>
);

const legalLinks = [
    { to: '/privacy', icon: <Shield className="w-3.5 h-3.5" />, labelKey: 'privacy_policy' },
    { to: '/terms', icon: <FileText className="w-3.5 h-3.5" />, labelKey: 'terms_of_service' },
    { to: '/about', icon: <Info className="w-3.5 h-3.5" />, labelKey: 'about_us' },
    { to: '/contact', icon: <Mail className="w-3.5 h-3.5" />, labelKey: 'contact_us' },
];

const SiteFooter = () => {
    const { language } = useAppStore();
    const { t } = useTranslation();
    const isAr = language === 'ar';
    const year = new Date().getFullYear();

    return (
        <footer className="w-full border-t border-white/5 bg-[#02040a]/50 backdrop-blur-sm mt-16">
            <div className="max-w-5xl mx-auto px-6 py-10">

                {/* Top row */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">

                    {/* Brand */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-white/20 transition-colors">
                            <SeemeProEye className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-black tracking-tighter text-white">
                                SEEME<span className="text-gray-500">PRO</span>
                            </p>
                            <p className="text-[9px] text-cyan-500/60 uppercase tracking-[0.18em] font-bold">
                                Truth Has Another Dimension
                            </p>
                        </div>
                    </Link>

                    {/* Nav links */}
                    <nav className="flex flex-wrap items-center justify-center gap-2">
                        {legalLinks.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-white transition-colors font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-transparent hover:border-white/10 hover:bg-white/5"
                            >
                                {link.icon}
                                {t(link.labelKey)}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Divider */}
                <div className="border-t border-white/5 pt-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center">
                        <p className="text-[11px] text-gray-600 font-medium">
                            © {year} SeemePro. {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-gray-700">
                            <Eye className="w-3 h-3 text-cyan-500/40" />
                            <span className="uppercase tracking-widest font-bold">
                                {isAr ? 'أداة تحليل سلوكي — غير معتمدة للاستخدام القانوني أو الطبي' : 'Behavioral Analysis Tool — Not for Legal or Medical Use'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default SiteFooter;
