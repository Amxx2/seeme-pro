import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../config/supabase';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.includes('@')) { setError('Please enter a valid email address.'); return; }
        setLoading(true);
        setError('');
        try {
            const { error: supaErr } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (supaErr) throw supaErr;
            setSent(true);
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                {/* Back button */}
                <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 text-sm font-mono">
                    <ArrowLeft className="w-4 h-4" /> Back to Login
                </Link>

                <div className="bg-[#0a0c16] border border-white/8 rounded-3xl p-8 relative overflow-hidden">
                    {/* Top accent */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_10px_#3b82f6]" />

                    {!sent ? (
                        <>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 bg-primary/10 border border-primary/30 rounded-xl">
                                    <Mail className="w-5 h-5 text-primary" />
                                </div>
                                <h1 className="text-2xl font-black text-white uppercase tracking-tight">
                                    Forgot Password
                                </h1>
                            </div>
                            <p className="text-gray-500 text-sm mb-8 font-mono leading-relaxed">
                                Enter your email and we'll send you a link to reset your password.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        autoFocus
                                        className="w-full bg-black/50 border border-accent/50 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-700 focus:outline-none focus:border-primary/60 font-mono text-sm transition-colors"
                                    />
                                </div>

                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-red-400 text-sm font-mono"
                                    >
                                        ❌ {error}
                                    </motion.p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-primary hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                                >
                                    {loading ? (
                                        <span className="animate-pulse">Sending...</span>
                                    ) : (
                                        <><Send className="w-4 h-4" /> Send Reset Link</>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        /* ── Success State ── */
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-4"
                        >
                            <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                                <CheckCircle className="w-8 h-8 text-green-400" />
                            </div>
                            <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Check Your Email!</h2>
                            <p className="text-gray-500 text-sm font-mono mb-2">
                                We sent a password reset link to:
                            </p>
                            <p className="text-primary font-mono text-sm font-bold mb-6">{email}</p>
                            <p className="text-gray-600 text-xs font-mono mb-8">
                                Didn't receive it? Check your spam folder or try again.
                            </p>
                            <button
                                onClick={() => { setSent(false); setEmail(''); }}
                                className="w-full py-3 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 rounded-2xl font-bold uppercase tracking-wider text-sm transition-colors"
                            >
                                Try Different Email
                            </button>
                        </motion.div>
                    )}
                </div>

                <p className="text-center text-gray-600 text-xs font-mono mt-6">
                    Remembered it?{' '}
                    <Link to="/" className="text-primary hover:underline">Back to Login</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
