import { theme, type ThemeConfig } from 'antd';

/** Neutral application defaults. Each space may override them in its own provider. */
export function createApplicationTheme(mode: 'dark' | 'light'): ThemeConfig {
  const dark = mode === 'dark';
  return {
    algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: dark ? '#34d399' : '#047857',
      colorBgContainer: dark ? '#0f172a' : '#ffffff',
      colorBgElevated: dark ? '#1e293b' : '#ffffff',
      colorText: dark ? '#f1f5f9' : '#0f172a',
      colorTextSecondary: dark ? '#94a3b8' : '#475569',
      colorBorder: dark ? '#334155' : '#cbd5e1',
      fontFamily: "'Tajawal', 'Inter', sans-serif",
      borderRadius: 12,
      controlHeight: 44,
    },
    components: { Table: { cellPaddingBlock: 10 } },
  };
}
