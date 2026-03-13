import { motion } from 'framer-motion';
import { Shield, Check, Star } from 'lucide-react';

const PremiumPlans = () => {

    const plans = [
        {
            id: '1mo',
            duration: '1 Month',
            price: '$19',
            period: '/mo',
            total: '$19 total',
            color: 'blue',
            features: ['Unlimited Voice Analysis', '10 Video Scans/mo', '1 Live Interview/mo', 'Bronze & Silver Badges', 'No Ads'],
            recommended: false,
        },
        {
            id: '3mo',
            duration: '3 Months',
            price: '$16.33',
            period: '/mo',
            total: '$49 total',
            color: 'purple',
            features: ['Unlimited Voice Analysis', '30 Video Scans/mo', '3 Live Interviews/mo', 'Gold Badge', 'No Ads', 'Priority Analysis Queue'],
            recommended: true,
        },
        {
            id: '6mo',
            duration: '6 Months',
            price: '$16',
            period: '/mo',
            total: '$96 total',
            color: 'yellow',
            features: ['Unlimited Voice Analysis', 'Unlimited Video Scans', '10 Live Interviews/mo', 'Platinum Badge', 'No Ads', 'Clan Creation Rights'],
            recommended: false,
        },
        {
            id: '12mo',
            duration: '1 Year (Enterprise)',
            price: '$16.58',
            period: '/mo',
            total: '$199 total',
            color: 'red',
            features: ['Unlimited Everything', 'Unlimited Live Sessions', 'Custom API Access', 'Elite Diamond Badge', 'Raw Data Export', 'Dedicated Support'],
            recommended: false,
        }
    ];

    const getColorStyles = (color: string) => {
        switch (color) {
            case 'blue': return 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]';
            case 'purple': return 'bg-purple-500/10 border-purple-500/50 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]';
            case 'yellow': return 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.2)]';
            case 'red': return 'bg-red-500/10 border-red-500/50 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]';
            default: return 'border-accent text-white';
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto h-full flex flex-col gap-8 pb-8">
            <div className="text-center pt-8 relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.15),transparent_50%)] pointer-events-none"></div>
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mb-4">
                    <div className="p-4 rounded-full bg-yellow-500/20 border border-yellow-500/30 shadow-[0_0_30px_rgba(250,204,21,0.4)]">
                        <Shield className="w-12 h-12 text-yellow-500" />
                    </div>
                </motion.div>
                <h2 className="text-4xl lg:text-5xl font-extrabold text-white tracking-wide mb-4">
                    Unlock the <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">Full Truth Engine</span>
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                    Remove all limitations. Gain access to enterprise-grade live interrogation tools and detailed cognitive data exports.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8 relative z-10 px-4">
                {plans.map((plan, idx) => (
                    <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`relative flex flex-col p-8 rounded-3xl border ${getColorStyles(plan.color)} bg-black/40 backdrop-blur-xl group hover:-translate-y-2 transition-transform duration-300`}
                    >
                        {plan.recommended && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(168,85,247,0.5)] flex items-center gap-1">
                                <Star className="w-3 h-3 fill-white" /> Most Popular
                            </div>
                        )}

                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-white mb-2">{plan.duration}</h3>
                            <div className="flex items-end gap-1">
                                <span className="text-4xl font-extrabold text-white">{plan.id === '1mo' ? '$19' : plan.id === '3mo' ? '$49' : plan.id === '6mo' ? '$96' : '$199'}</span>
                                <span className="text-gray-500 font-mono mb-1">{plan.id === '1mo' ? '/mo' : ' total'}</span>
                            </div>
                            {plan.id !== '1mo' && (
                                <p className="text-xs text-green-400 font-mono mt-2 bg-green-500/10 px-2 py-1 rounded w-max inline-block uppercase font-bold tracking-wider border border-green-500/20">
                                    {plan.id === '3mo' ? '$16.33/mo' : plan.id === '6mo' ? '$16/mo' : '$16.58/mo'}
                                </p>
                            )}
                        </div>

                        <div className="flex-1 space-y-4 mb-8">
                            {plan.features.map((feature, i) => (
                                <div key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                    <div className={`mt-0.5 rounded-full p-0.5 ${getColorStyles(plan.color)} bg-transparent`}>
                                        <Check className="w-3 h-3" strokeWidth={3} />
                                    </div>
                                    <span className={feature.includes('Unlimited') ? 'font-bold text-white' : ''}>{feature}</span>
                                </div>
                            ))}
                        </div>

                        <button className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider transition-colors
                     ${plan.recommended
                                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg hover:opacity-90'
                                : 'bg-card border border-accent hover:bg-accent/80 text-white'
                            }`}
                        >
                            Upgrade Now
                        </button>
                    </motion.div>
                ))}
            </div>

            <div className="text-center mt-8 text-gray-500 text-xs font-mono px-4">
                Subscriptions automatically renew unless auto-renew is turned off at least 24-hours before the end of the current period.
            </div>
        </div>
    )
}

export default PremiumPlans;
