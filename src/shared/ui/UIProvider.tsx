import { useMemo, type ReactNode } from 'react';
import { ConfigProvider } from 'antd';
import { StyleProvider } from '@ant-design/cssinjs';
import arEG from 'antd/locale/ar_EG';
import enUS from 'antd/locale/en_US';
import { createApplicationTheme } from '../theme/applicationTheme';

/** Accept settings as props so shared UI never depends on application context. */
export function UIProvider({ mode, language, children }: {
  mode: 'dark' | 'light'; language: 'ar' | 'en'; children: ReactNode;
}) {
  const theme = useMemo(() => createApplicationTheme(mode), [mode]);
  return <StyleProvider layer>
    <ConfigProvider theme={theme} direction={language === 'ar' ? 'rtl' : 'ltr'} locale={language === 'ar' ? arEG : enUS}>
      {children}
    </ConfigProvider>
  </StyleProvider>;
}
