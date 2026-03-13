import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from './store/useAppStore';
import MainLayout from './layouts/MainLayout';
const VoiceAnalysis = lazy(() => import('./pages/VoiceAnalysis'));
const VideoAnalysis = lazy(() => import('./pages/VideoAnalysis'));
const LiveInterview = lazy(() => import('./pages/LiveInterview'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PublicChat = lazy(() => import('./pages/PublicChat'));
const ToxicDetector = lazy(() => import('./pages/ToxicDetector'));
const HungerScanner = lazy(() => import('./pages/HungerScanner'));
const ForensicDashboard = lazy(() => import('./pages/ForensicDashboard'));
const HRDashboard = lazy(() => import('./pages/HRDashboard'));
const ClanSystem = lazy(() => import('./pages/ClanSystem'));
const Home = lazy(() => import('./pages/Home'));
const PremiumPlans = lazy(() => import('./pages/PremiumPlans'));
const Profile = lazy(() => import('./pages/Profile'));
import ForgotPassword from './pages/ForgotPassword';
import PwaInstallBanner from './components/PwaInstallBanner';
import FloatingChatbot from './components/FloatingChatbot';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';

function App() {
  const { i18n } = useTranslation();
  const language = useAppStore(state => state.language);
  const checkStreak = useAppStore(state => state.checkStreak);
  const checkAndResetCredits = useAppStore(state => state.checkAndResetCredits);
  const applyReferral = useAppStore(state => state.applyReferral);
  const user = useAppStore(state => state.user);

  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, i18n]);

  useEffect(() => {
    // 1) App initialization hooks

    // Only process further if user is logged in
    if (!user.isLoggedIn) return;

    // 3) Daily resets for features and streaks
    checkStreak();
    checkAndResetCredits();

    // 3. Check for referral code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');

    if (refCode) {
      const applied = applyReferral(refCode);
      if (applied) {
        // Remove ?ref from URL without refreshing to keep history clean
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }

  }, [checkStreak, checkAndResetCredits, applyReferral, user.isLoggedIn]);

  // Inject AdSense script automatically on boot
  useEffect(() => {
    if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4433736715872551';
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
  }, []);

  return (
    <BrowserRouter>
      <PwaInstallBanner />
      <FloatingChatbot />
      <Suspense fallback={<div className="flex items-center justify-center h-screen bg-black"><div className="animate-spin w-8 h-8 border-2 border-cyan-500 rounded-full border-t-transparent" /></div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          {/* Public AdSense compliance pages — no login required */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/voice" element={<VoiceAnalysis />} />
            <Route path="/video" element={<VideoAnalysis />} />
            <Route path="/live" element={<LiveInterview />} />
            <Route path="/hr" element={<HRDashboard />} />
            <Route path="/chat" element={<PublicChat />} />
            <Route path="/clans" element={<ClanSystem />} />
            <Route path="/premium" element={<PremiumPlans />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/toxic" element={<ToxicDetector />} />
            <Route path="/hunger" element={<HungerScanner />} />
            <Route path="/forensic" element={<ForensicDashboard />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

