import { Mail, Loader2, Sparkles, Briefcase, BarChart3, Search } from 'lucide-react';
import { useGmailOAuth } from '@/hooks';

/**
 * Login View Component
 * Provides a premium-looking landing page with Login with Gmail capability
 */
function LoginView({ onLoginSuccess }) {
    const { startOAuth, isConnecting } = useGmailOAuth({
        onSuccess: onLoginSuccess,
        onError: (msg) => alert(msg)
    });

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Animated Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

            <div className="max-w-md w-full relative z-10">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-3 bg-violet-600/10 rounded-2xl mb-6 border border-violet-500/20 animate-in">
                        <Sparkles className="text-violet-400" size={32} />
                    </div>
                    <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight">
                        Astra <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">AI</span>
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Your intelligent career companion. Track applications, scan emails, and land your dream job.
                    </p>
                </div>

                <div className="glass rounded-[32px] p-8 space-y-8 animate-in border border-white/10 shadow-2xl">
                    <div className="space-y-4">
                        <FeatureItem
                            icon={<Search size={20} className="text-blue-400" />}
                            title="Smart Email Scanning"
                            description="Automatically find and track job emails from your Gmail inbox."
                        />
                        <FeatureItem
                            icon={<BarChart3 size={20} className="text-violet-400" />}
                            title="Application Tracking"
                            description="Keep all your opportunities organized in one beautiful dashboard."
                        />
                        <FeatureItem
                            icon={<Briefcase size={20} className="text-emerald-400" />}
                            title="Career Insights"
                            description="Get AI-powered feedback on your resume and interview status."
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={startOAuth}
                            disabled={isConnecting}
                            className="w-full flex items-center justify-center gap-3 bg-white text-gray-950 hover:bg-gray-100 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-lg disabled:opacity-50"
                        >
                            {isConnecting ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : (
                                <Mail size={24} />
                            )}
                            {isConnecting ? 'Signing in...' : 'Continue with Gmail'}
                        </button>
                        <p className="text-center text-xs text-gray-500 mt-4 px-4">
                            By continuing, you allow Astra AI to access your Gmail (readonly) to find job-related emails.
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-sm">
                        Secure, private, and local-first.
                    </p>
                </div>
            </div>
        </div>
    );
}

function FeatureItem({ icon, title, description }) {
    return (
        <div className="flex gap-4 items-start p-3 hover:bg-white/5 rounded-2xl transition-colors group">
            <div className="p-2 bg-white/5 rounded-xl group-hover:bg-white/10 transition-colors">
                {icon}
            </div>
            <div>
                <h3 className="text-sm font-bold text-white">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

export default LoginView;
