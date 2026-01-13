import React, { useState } from 'react';
import { Mail, Loader2, Sparkles, Briefcase, BarChart3, Search } from 'lucide-react';
import { exchangeCodeForTokens, fetchUserInfo } from '@/services';
import { OAUTH_CONFIG } from '@/constants';

// Gmail OAuth Configuration
const GMAIL_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GMAIL_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
const GMAIL_SCOPES = OAUTH_CONFIG.SCOPES;

/**
 * Login View Component
 * Provides a premium-looking landing page with Login with Gmail capability
 */
function LoginView({ onLoginSuccess }) {
    const [isConnecting, setIsConnecting] = useState(false);

    const handleLogin = async () => {
        if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
            alert('Gmail integration requires OAuth Client ID and Secret. Please check your settings.');
            return;
        }

        setIsConnecting(true);

        try {
            // Create OAuth URL
            const redirectUri = window.location.href.split('?')[0].split('#')[0];
            const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
            authUrl.searchParams.set('client_id', GMAIL_CLIENT_ID);
            authUrl.searchParams.set('redirect_uri', redirectUri);
            authUrl.searchParams.set('response_type', 'code');
            authUrl.searchParams.set('access_type', 'offline');
            authUrl.searchParams.set('scope', GMAIL_SCOPES);
            authUrl.searchParams.set('prompt', 'consent');

            // Open OAuth popup
            window.open(
                authUrl.toString(),
                'gmail-oauth',
                'width=500,height=600,scrollbars=yes'
            );

            // Listen for OAuth callback
            const handleMessage = async (event) => {
                if (event.origin !== window.location.origin) return;

                if (event.data.type === 'gmail-oauth-success' || event.data.type === 'gmail-oauth-error') {
                    window.removeEventListener('message', handleMessage);

                    if (event.data.type === 'gmail-oauth-success') {
                        try {
                            const { code } = event.data;
                            if (code) {
                                // Exchange the code for real tokens
                                const tokens = await exchangeCodeForTokens(
                                    code,
                                    GMAIL_CLIENT_ID,
                                    GMAIL_CLIENT_SECRET,
                                    redirectUri
                                );

                                // Fetch user info
                                const userInfo = await fetchUserInfo(tokens.access_token);

                                onLoginSuccess({
                                    tokens,
                                    userInfo: {
                                        name: userInfo?.name || '',
                                        email: userInfo?.email || '',
                                        picture: userInfo?.picture || ''
                                    }
                                });
                            }
                        } catch (err) {
                            console.error('Token exchange failed:', err);
                            alert('Login failed during token exchange.');
                            setIsConnecting(false);
                        }
                    } else {
                        console.error('Login OAuth error:', event.data.error);
                        setIsConnecting(false);
                    }
                }
            };

            window.addEventListener('message', handleMessage);

            // Fallback timeout
            setTimeout(() => {
                setIsConnecting(false);
            }, 120000);

        } catch (error) {
            console.error('Login error:', error);
            setIsConnecting(false);
        }
    };

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
                            onClick={handleLogin}
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
