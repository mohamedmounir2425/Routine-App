import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { App, ConfigProvider } from 'antd';
import { StyleProvider } from '@ant-design/cssinjs';
import arEG from 'antd/locale/ar_EG';
import { createHomeTheme } from './homeTheme';

export function HomeUIProvider({ children }: { children: ReactNode }) {
  const [light, setLight] = useState(() => document.documentElement.classList.contains('light'));
  useEffect(() => {
    const observer = new MutationObserver(() => setLight(document.documentElement.classList.contains('light')));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  const homeTheme = useMemo(() => createHomeTheme(light), [light]);
  return <StyleProvider layer><ConfigProvider direction="rtl" locale={arEG} theme={homeTheme}>
    <App className="home-theme font-home text-home-text">{children}</App>
  </ConfigProvider></StyleProvider>;
}
