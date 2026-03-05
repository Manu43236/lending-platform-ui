import { brand, ui } from './colors'

const antdTheme = {
  token: {
    // Brand
    colorPrimary: brand.primary,
    colorLink: brand.primary,
    colorLinkHover: brand.primaryLight,

    // Typography
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeHeading1: 28,
    fontSizeHeading2: 22,
    fontSizeHeading3: 18,
    fontSizeHeading4: 16,

    // Layout
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 4,

    // Colors
    colorBgContainer: ui.cardBg,
    colorBgLayout: ui.background,
    colorBorder: ui.border,
    colorTextBase: ui.textPrimary,
    colorTextSecondary: ui.textSecondary,
    colorSuccess: ui.success,
    colorWarning: ui.warning,
    colorError: ui.error,
    colorInfo: ui.info,

    // Spacing
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    margin: 16,
    marginLG: 24,

    // Shadow
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    boxShadowSecondary: '0 4px 16px rgba(0,0,0,0.12)',
  },
  components: {
    Layout: {
      siderBg: brand.primary,
      triggerBg: brand.primaryDark,
    },
    Menu: {
      darkItemBg: brand.primary,
      darkSubMenuItemBg: brand.primaryDark,
      darkItemSelectedBg: brand.primaryLight,
      darkItemHoverBg: 'rgba(255,255,255,0.08)',
      darkItemColor: 'rgba(255,255,255,0.75)',
      darkItemSelectedColor: '#ffffff',
      itemBorderRadius: 6,
    },
    Card: {
      borderRadius: 12,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    },
    Table: {
      headerBg: '#fafafa',
      rowHoverBg: '#f0f5ff',
      borderRadius: 8,
    },
    Button: {
      borderRadius: 8,
      fontWeight: 500,
    },
    Input: {
      borderRadius: 8,
    },
    Select: {
      borderRadius: 8,
    },
    Modal: {
      borderRadius: 12,
    },
    Tag: {
      borderRadius: 4,
      fontWeight: 500,
    },
  },
}

export default antdTheme
