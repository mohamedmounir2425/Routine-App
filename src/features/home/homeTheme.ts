import { theme, type ThemeConfig } from 'antd';

/** Ant's color algorithms need resolved colors; Tailwind reads the same palette
 * directly. Namespaced root variables also reach dialogs rendered in body. */
export function createHomeTheme(light: boolean): ThemeConfig {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string) => styles.getPropertyValue(`--home-${name}`).trim();
  const size = (name: string) => Number.parseFloat(token(name));
  return {
    algorithm: light ? theme.defaultAlgorithm : theme.darkAlgorithm,
    token: {
      colorPrimary: token('button'), colorSuccess: token('green'),
      colorBgContainer: token('input'), colorBgElevated: token('panel'), colorBgLayout: token('bg'),
      colorText: token('text'), colorTextSecondary: token('muted'), colorTextPlaceholder: token('muted'),
      colorBorder: token('border'), colorBorderSecondary: token('border'),
      borderRadius: size('radius-control'), controlHeight: size('control-height'),
      fontSize: size('font-size'), fontFamily: token('font-family'), zIndexPopupBase: 1300,
    },
    components: {
      Checkbox: { controlInteractiveSize: 22 },
      Button: { primaryColor: token('button-text'), primaryShadow: 'none', defaultBg: token('raised'), defaultColor: token('text'), defaultBorderColor: token('border'), fontWeight: 700 },
      Input: { activeShadow: `0 0 0 2px ${token('selection')}` },
      InputNumber: { activeShadow: `0 0 0 2px ${token('selection')}` },
      Select: { optionSelectedColor: token('selection-text'), optionSelectedBg: token('selection'), optionSelectedFontWeight: 700 },
      Table: { headerBg: token('raised'), cellPaddingBlock: 10 },
      Card: { colorBgContainer: token('panel') },
      Modal: { contentBg: token('panel'), headerBg: token('panel') },
      Drawer: { colorBgElevated: token('panel') },
    },
  };
}
