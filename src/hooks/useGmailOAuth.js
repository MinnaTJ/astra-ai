import { useState, useCallback, useEffect, useRef } from 'react';
import { OAUTH_CONFIG } from '@/constants';
import { exchangeCodeForTokens, fetchUserInfo } from '@/services';

// Gmail OAuth Configuration
const GMAIL_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GMAIL_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;

/**
 * Custom hook for Gmail OAuth flow
 * Consolidates the OAuth popup logic, token exchange, and listener cleanup
 * into a single reusable hook.
 *
 * @param {Object} options
 * @param {Function} options.onSuccess - Called with { tokens, userInfo } on success
 * @param {Function} [options.onError] - Called with error message on failure
 * @returns {{ startOAuth: Function, isConnecting: boolean }}
 */
export function useGmailOAuth({ onSuccess, onError }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const listenerRef = useRef(null);

  // Clean up message listener on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (listenerRef.current) {
        window.removeEventListener('message', listenerRef.current);
        listenerRef.current = null;
      }
    };
  }, []);

  const startOAuth = useCallback(async () => {
    if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
      const msg = 'Gmail integration requires OAuth Client ID and Secret. Please check your settings.';
      if (onError) onError(msg);
      else alert(msg);
      return;
    }

    setIsConnecting(true);

    // Remove any previous listener before adding a new one
    if (listenerRef.current) {
      window.removeEventListener('message', listenerRef.current);
      listenerRef.current = null;
    }

    try {
      const redirectUri = window.location.href.split('?')[0].split('#')[0];
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', GMAIL_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('scope', OAUTH_CONFIG.SCOPES);
      authUrl.searchParams.set('prompt', 'consent');

      // Open OAuth popup
      window.open(
        authUrl.toString(),
        'gmail-oauth',
        'width=500,height=600,scrollbars=yes'
      );

      // Listen for OAuth callback from popup
      const handleMessage = async (event) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'gmail-oauth-success' || event.data.type === 'gmail-oauth-error') {
          // Remove listener immediately to prevent double-firing
          window.removeEventListener('message', handleMessage);
          listenerRef.current = null;

          if (event.data.type === 'gmail-oauth-success') {
            try {
              const { code } = event.data;
              if (code) {
                const tokens = await exchangeCodeForTokens(
                  code,
                  GMAIL_CLIENT_ID,
                  GMAIL_CLIENT_SECRET,
                  redirectUri
                );

                const userInfo = await fetchUserInfo(tokens.access_token);

                onSuccess({
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
              if (onError) onError('Gmail connection failed during token exchange.');
              else alert('Gmail connection failed during token exchange.');
            } finally {
              setIsConnecting(false);
            }
          } else {
            console.error('Gmail OAuth error:', event.data.error);
            if (onError) onError(event.data.error || 'OAuth authentication failed.');
            setIsConnecting(false);
          }
        }
      };

      listenerRef.current = handleMessage;
      window.addEventListener('message', handleMessage);

      // Fallback timeout to stop loader if user ignores popup
      setTimeout(() => {
        setIsConnecting(false);
      }, 120000);

    } catch (error) {
      console.error('OAuth error:', error);
      if (onError) onError(error.message || 'OAuth flow failed.');
      setIsConnecting(false);
    }
  }, [onSuccess, onError]);

  return { startOAuth, isConnecting };
}
