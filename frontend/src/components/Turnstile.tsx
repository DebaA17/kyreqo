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
    let widgetId: string | undefined;

    const initialize = () => {
      if (window.turnstile && containerRef.current) {
        try {
          // Clear container to prevent duplicate elements in StrictMode
          containerRef.current.innerHTML = '';

          widgetId = window.turnstile.render(containerRef.current, {
            sitekey,
            callback: onVerify,
          });
        } catch (e) {
          void e;
        }
      }
    };

    window.onloadTurnstileCallback = initialize;

    let script = document.querySelector(
      'script[src*="challenges.cloudflare.com/turnstile"]'
    ) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    } else if (window.turnstile) {
      initialize();
    } else {
      script.addEventListener('load', initialize);
    }

    return () => {
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch (e) {
          void e;
        }
      }
      if (script) {
        script.removeEventListener('load', initialize);
      }
      if (window.onloadTurnstileCallback === initialize) {
        window.onloadTurnstileCallback = undefined;
      }
    };
  }, [sitekey, onVerify]);

  return <div ref={containerRef} className="cf-turnstile my-2 flex justify-center min-h-[65px]" />;
}
