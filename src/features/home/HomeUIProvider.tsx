import { useEffect, useState, type ReactNode } from 'react';
import { App, ConfigProvider, theme } from 'antd';
import arEG from 'antd/locale/ar_EG';

export function HomeUIProvider({ children }: { children: ReactNode }) {
  const [light, setLight] = useState(() => {
    if (typeof document !== 'undefined') {
      if (document.documentElement.classList.contains('light')) return true;
      try {
        const saved = localStorage.getItem('movecare_theme');
        if (saved === 'light') return true;
        if (saved === 'dark') return false;
        if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return true;
      } catch {}
    }
    return false;
  });

  useEffect(() => {
    const check = () => setLight(document.documentElement.classList.contains('light'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <ConfigProvider
      direction="rtl"
      locale={arEG}
      theme={{
        algorithm: light ? theme.defaultAlgorithm : theme.darkAlgorithm,
        token: {
          colorPrimary: light ? '#9a4e2d' : '#e3a27b',
          colorBgContainer: light ? '#fffdf8' : '#2d2722',
          colorBgElevated: light ? '#fffdf8' : '#362e27',
          colorBgLayout: light ? '#faf6ee' : '#211d19',
          colorText: light ? '#352a20' : '#f5eee5',
          colorTextSecondary: light ? '#71604f' : '#c2b3a3',
          colorBorder: light ? '#d7c8b6' : '#514438',
          borderRadius: 10,
          controlHeight: 40,
          fontFamily: 'Tajawal, sans-serif',
          fontSize: 13,
          zIndexPopupBase: 1300
        },
        components: {
          Table: { headerBg: light ? '#f1e8da' : '#362e27', cellPaddingBlock: 10 },
          Input: { activeShadow: '0 0 0 2px rgba(154,78,45,.15)' },
          Select: {
            colorText: light ? '#834124' : '#f0b58e',
            optionSelectedColor: light ? '#834124' : '#f0b58e',
            optionSelectedBg: light ? '#f2dfce' : '#443124',
            optionSelectedFontWeight: 800,
            selectorBg: light ? '#f5efe5' : '#25201b'
          }
        }
      }}
    >
      <App>
        {children}
      </App>
    </ConfigProvider>
  );
}
