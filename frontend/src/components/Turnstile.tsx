import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    onloadTurnstileCallback?: () => void;
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

interface TurnstileProps {
  sitekey: string;
  onVerify: (token: string) => void;
}

export default function Turnstile({ sitekey, onVerify }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let script = document.querySelector('script[src*="turnstile/v0/api.js"]') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const initialize = () => {
      if (window.turnstile && containerRef.current) {
        try {
          window.turnstile.render(containerRef.current, {
            sitekey,
            callback: onVerify,
          });
        } catch (e) {
          // Silent catch in case render was already called
          void e;
        }
      }
    };

    if (window.turnstile) {
      initialize();
    } else {
      window.onloadTurnstileCallback = initialize;
    }

    return () => {
      window.onloadTurnstileCallback = undefined;
    };
  }, [sitekey, onVerify]);

  return <div ref={containerRef} className="cf-turnstile my-2 flex justify-center min-h-[65px]" />;
}
