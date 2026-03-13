import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Download, Search, Trash2, Eye, Users, Shield, AlertTriangle, Star, ChevronUp, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SavedSession {
    id: string;
    candidateName: string;
    role: string;
    company: string;
    sessionType: string;
    date: string;
    duration: number;
    grade: string;
    scores: { confidence: number; authenticity: number; engagement: number; calmness: number; integrity: number };
    examMode: boolean;
    violations: number;
    status: 'passed' | 'flagged' | 'failed';
}

const GRADE_COLOR = { A: '#30D158', B: '#FFD60A', C: '#FF9F0A', D: '#FF453A', F: '#FF3B30' };
const STATUS_CONFIG = {
    passed: { label: 'ناجح', color: '#30D158', bg: 'rgba(48,209,88,0.15)' },
    flagged: { label: 'مشبوه', color: '#FF9F0A', bg: 'rgba(255,159,10,0.15)' },
    failed: { label: 'مرفوض', color: '#FF453A', bg: 'rgba(255,69,58,0.15)' },
};

const HRDashboard = () => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<SavedSession[]>([]);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [viewSession, setViewSession] = useState<SavedSession | null>(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('seemepro_sessions');
            if (raw) setSessions(JSON.parse(raw));
        } catch { setSessions([]); }
    }, []);

    const stats = useMemo(() => ({
        total: sessions.length,
        avgIntegrity: sessions.length ? Math.round(sessions.reduce((a, s) => a + (s.scores?.integrity || 0), 0) / sessions.length) : 0,
        flagged: sessions.filter(s => s.status === 'flagged' || s.status === 'failed').length,
        topCandidate: sessions.sort((a, b) => (b.scores?.authenticity || 0) - (a.scores?.authenticity || 0))[0]?.candidateName || '—',
    }), [sessions]);

    const filtered = useMemo(() => {
        return sessions
            .filter(s => {
                const matchSearch = s.candidateName?.toLowerCase().includes(search.toLowerCase()) ||
                    s.role?.toLowerCase().includes(search.toLowerCase());
                const matchStatus = filterStatus === 'all' || s.status === filterStatus;
                const matchType = filterType === 'all' || s.sessionType === filterType;
                return matchSearch && matchStatus && matchType;
            })
            .sort((a, b) => {
                let valA: any, valB: any;
                if (sortBy === 'date') { valA = new Date(a.date).getTime(); valB = new Date(b.date).getTime(); }
                else if (sortBy === 'grade') { valA = a.grade; valB = b.grade; }
                else if (sortBy === 'integrity') { valA = a.scores?.integrity; valB = b.scores?.integrity; }
                else { valA = a.candidateName; valB = b.candidateName; }
                return sortDir === 'desc' ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
            });
    }, [sessions, search, filterStatus, filterType, sortBy, sortDir]);

    const deleteSession = (id: string) => {
        const updated = sessions.filter(s => s.id !== id);
        setSessions(updated);
        localStorage.setItem('seemepro_sessions', JSON.stringify(updated));
    };

    const exportCSV = () => {
        const headers = ['الاسم', 'الدور', 'الشركة', 'النوع', 'التاريخ', 'الدرجة', 'النزاهة', 'الحالة', 'المخالفات'];
        const rows = sessions.map(s => [
            s.candidateName, s.role, s.company, s.sessionType,
            new Date(s.date).toLocaleDateString('ar-EG'),
            s.grade, `${s.scores?.integrity || 0}%`, s.status, s.violations
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'seemepro_sessions.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const radarData = selectedIds.length >= 2
        ? ['confidence', 'authenticity', 'engagement', 'calmness', 'integrity'].map(key => ({
            subject: key,
            ...Object.fromEntries(selectedIds.map(id => {
                const s = sessions.find(x => x.id === id);
                return [s?.candidateName || id, s?.scores?.[key as keyof typeof s.scores] || 0];
            }))
        })) : [];

    const COLORS = ['#00FFD4', '#FF9F0A', '#9B59B6'];

    return (
        <div className="min-h-screen p-4 md:p-8" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
                        🏢 لوحة تحكم الموارد البشرية
                    </h1>
                    <p className="text-gray-400 text-sm mt-1 font-mono">ENTERPRISE HR DASHBOARD</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 text-sm font-bold transition-colors">
                        <Download className="w-4 h-4" /> تصدير CSV
                    </button>
                    <button onClick={() => navigate('/live')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold transition-colors">
                        + جلسة جديدة
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { icon: <Users className="w-5 h-5" />, label: 'إجمالي الجلسات', value: stats.total, color: '#00FFD4' },
                    { icon: <Shield className="w-5 h-5" />, label: 'متوسط النزاهة', value: `${stats.avgIntegrity}%`, color: '#30D158' },
                    { icon: <AlertTriangle className="w-5 h-5" />, label: 'الحالات المشبوهة', value: stats.flagged, color: '#FF9F0A' },
                    { icon: <Star className="w-5 h-5" />, label: 'الأفضل أداءً', value: stats.topCandidate, color: '#FFD60A' },
                ].map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className="rounded-2xl p-5 border border-white/10 bg-black/40"
                        style={{ boxShadow: `inset 0 0 30px ${stat.color}08` }}>
                        <div className="flex justify-between items-start mb-3">
                            <div style={{ color: stat.color }}>{stat.icon}</div>
                        </div>
                        <div className="text-2xl font-black text-white truncate">{stat.value}</div>
                        <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Comparison Radar */}
            {selectedIds.length >= 2 && (
                <div className="mb-8 rounded-2xl border border-cyan-500/20 bg-black/40 p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        📊 مقارنة المرشحين المحددين
                    </h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="rgba(255,255,255,0.05)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11 }} />
                            {selectedIds.map((id, i) => {
                                const s = sessions.find(x => x.id === id);
                                return <Radar key={id} name={s?.candidateName || id} dataKey={s?.candidateName || id}
                                    stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.2} />;
                            })}
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Bar Chart - scores overview */}
            {sessions.length > 0 && (
                <div className="mb-8 rounded-2xl border border-white/10 bg-black/40 p-6">
                    <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest">مقارنة الأداء العام</h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={sessions.slice(0, 8).map(s => ({ name: s.candidateName?.split(' ')[0] || 'مرشح', ...s.scores }))}>
                            <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} />
                            <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />
                            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8 }} />
                            <Bar dataKey="confidence" fill="#00FFD4" radius={[3, 3, 0, 0]} name="ثقة" />
                            <Bar dataKey="authenticity" fill="#147EFF" radius={[3, 3, 0, 0]} name="مصداقية" />
                            <Bar dataKey="integrity" fill="#30D158" radius={[3, 3, 0, 0]} name="نزاهة" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="بحث باسم المرشح أو الوظيفة..."
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-white focus:outline-none focus:border-cyan-500" />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500">
                    <option value="all">كل الحالات</option>
                    <option value="passed">ناجح</option>
                    <option value="flagged">مشبوه</option>
                    <option value="failed">مرفوض</option>
                </select>
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500">
                    <option value="all">كل الأنواع</option>
                    <option value="مقابلة توظيف">مقابلة توظيف</option>
                    <option value="امتحان أونلاين">امتحان أونلاين</option>
                    <option value="تقييم أداء">تقييم أداء</option>
                    <option value="اختبار نزاهة">اختبار نزاهة</option>
                </select>
            </div>

            {/* Sessions Table - Desktop */}
            {filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-600">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-bold">لا توجد جلسات مسجلة بعد</p>
                    <p className="text-sm mt-1">ابدأ جلسة مقابلة من صفحة المقابلة المباشرة</p>
                    <button onClick={() => navigate('/live')} className="mt-4 px-6 py-2 bg-cyan-600 text-white rounded-xl text-sm font-bold hover:bg-cyan-500">
                        ابدأ جلسة الآن
                    </button>
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="hidden md:block rounded-2xl border border-white/10 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10">
                                    <th className="p-3 text-right w-8">
                                        <input type="checkbox" className="rounded"
                                            onChange={e => setSelectedIds(e.target.checked ? filtered.map(s => s.id) : [])} />
                                    </th>
                                    {[
                                        { key: 'name', label: 'المرشح' },
                                        { key: 'date', label: 'التاريخ' },
                                        { key: 'type', label: 'النوع' },
                                        { key: 'grade', label: 'الدرجة' },
                                        { key: 'integrity', label: 'النزاهة' },
                                        { key: 'status', label: 'الحالة' },
                                    ].map(col => (
                                        <th key={col.key} className="p-3 text-right text-gray-400 font-bold cursor-pointer hover:text-white"
                                            onClick={() => { setSortBy(col.key); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>
                                            <div className="flex items-center gap-1 justify-end">
                                                {col.label}
                                                {sortBy === col.key && (sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
                                            </div>
                                        </th>
                                    ))}
                                    <th className="p-3 text-right text-gray-400 font-bold">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filtered.map((s) => (
                                    <tr key={s.id} className="hover:bg-white/3 transition-colors">
                                        <td className="p-3">
                                            <input type="checkbox" className="rounded"
                                                checked={selectedIds.includes(s.id)}
                                                onChange={e => setSelectedIds(prev => e.target.checked ? [...prev, s.id] : prev.filter(x => x !== s.id))} />
                                        </td>
                                        <td className="p-3">
                                            <div className="font-bold text-white">{s.candidateName}</div>
                                            <div className="text-gray-500 text-xs">{s.role} @ {s.company}</div>
                                        </td>
                                        <td className="p-3 text-gray-400">{new Date(s.date).toLocaleDateString('ar-EG')}</td>
                                        <td className="p-3 text-gray-400 text-xs">{s.sessionType}</td>
                                        <td className="p-3">
                                            <span className="text-2xl font-black" style={{ color: GRADE_COLOR[s.grade as keyof typeof GRADE_COLOR] || '#fff' }}>
                                                {s.grade}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full"
                                                        style={{ width: `${s.scores?.integrity || 0}%`, backgroundColor: (s.scores?.integrity || 0) > 75 ? '#30D158' : (s.scores?.integrity || 0) > 50 ? '#FF9F0A' : '#FF453A' }} />
                                                </div>
                                                <span className="text-xs text-gray-400">{s.scores?.integrity || 0}%</span>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <span className="px-2 py-1 rounded-full text-xs font-bold"
                                                style={{ color: STATUS_CONFIG[s.status].color, backgroundColor: STATUS_CONFIG[s.status].bg }}>
                                                {STATUS_CONFIG[s.status].label}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setViewSession(s)} className="text-gray-400 hover:text-cyan-400 transition-colors">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => deleteSession(s.id)} className="text-gray-400 hover:text-red-400 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                        {filtered.map(s => (
                            <div key={s.id} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="font-bold text-white">{s.candidateName}</div>
                                        <div className="text-xs text-gray-500">{s.role} @ {s.company}</div>
                                    </div>
                                    <span className="text-2xl font-black" style={{ color: GRADE_COLOR[s.grade as keyof typeof GRADE_COLOR] || '#fff' }}>{s.grade}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="px-2 py-1 rounded-full text-xs font-bold"
                                        style={{ color: STATUS_CONFIG[s.status].color, backgroundColor: STATUS_CONFIG[s.status].bg }}>
                                        {STATUS_CONFIG[s.status].label}
                                    </span>
                                    <span className="text-xs text-gray-500">نزاهة: {s.scores?.integrity || 0}%</span>
                                    <button onClick={() => deleteSession(s.id)} className="text-gray-600 hover:text-red-400">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Comparison hint */}
            {selectedIds.length === 1 && (
                <div className="mt-4 text-center text-xs text-gray-500">
                    حدد مرشحاً آخر للمقارنة
                </div>
            )}

            {/* Enterprise Upsell */}
            <div className="mt-10 p-6 rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-black text-yellow-400 mb-1">🚀 الخطة المؤسسية Enterprise ⭐</h3>
                        <p className="text-gray-400 text-sm mb-3">قم بترقية حسابك للوصول إلى ميزات الموارد البشرية الكاملة</p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-300">
                            {['✅ جلسات غير محدودة', '✅ تقارير PDF مخصصة', '✅ لوحة HR متقدمة', '✅ API للتكامل مع ATS', '✅ مقارنة المرشحين', '✅ دعم فني 24/7'].map(f => (
                                <span key={f}>{f}</span>
                            ))}
                        </div>
                    </div>
                    <div className="text-center shrink-0">
                        <div className="text-3xl font-black text-white mb-1">499<span className="text-base font-normal text-gray-400"> ر.س/شهر</span></div>
                        <a href="mailto:contact@seemepro.ai?subject=Enterprise Plan Inquiry"
                            className="block px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl transition-colors text-sm">
                            📞 احجز عرضاً تجريبياً
                        </a>
                        <div className="text-xs text-gray-500 mt-2">يُستخدم من 50+ شركة</div>
                    </div>
                </div>
            </div>

            {/* Session Detail Modal */}
            {viewSession && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setViewSession(null)}>
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-black text-white">{viewSession.candidateName}</h3>
                            <button onClick={() => setViewSession(null)} className="text-gray-500 hover:text-white">✕</button>
                        </div>
                        <div className="space-y-2 text-sm">
                            {Object.entries(viewSession.scores || {}).map(([key, val]) => (
                                <div key={key} className="flex items-center justify-between">
                                    <span className="text-gray-400 capitalize">{key}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${val}%` }} />
                                        </div>
                                        <span className="text-white font-bold w-8 text-right">{val}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HRDashboard;
