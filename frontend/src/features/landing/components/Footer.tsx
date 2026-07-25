import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useThemeColors } from '@/styles/tokens';

const FOOTER_LINKS = [
  {
    heading: 'Product',
    links: ['Features', 'How It Works', 'Pricing', 'Changelog'],
  },
  {
    heading: 'Platform',
    links: ['Athletes', 'Coaches', 'Academies', 'Integrations'],
  },
  {
    heading: 'Company',
    links: ['About', 'Blog', 'Careers', 'Contact'],
  },
  {
    heading: 'Legal',
    links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
  },
];

export default function Footer() {
  const { width } = useWindowDimensions();
  const isNarrow = width < 768;
  const colors = useThemeColors();
  const styles = getStyles(colors);

  return (
    <View style={styles.footer}>
      {/* Top row */}
      <View style={[styles.topRow, isNarrow ? styles.topRowNarrow : styles.topRowWide]}>
        {/* Brand col */}
        <View style={styles.brandCol}>
          <View style={styles.logoRow}>
            <View style={styles.logoDot} />
            <Text style={styles.logoText}>AthliTech</Text>
          </View>
          <Text style={styles.brandDesc}>
            The modern platform for athlete management, performance tracking, and coaching excellence.
          </Text>
          <View style={styles.socialRow}>
            {['𝕏', 'in', 'IG'].map((s, i) => (
              <View key={i} style={styles.socialBtn}>
                <Text style={styles.socialBtnText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Link columns */}
        <View style={[styles.linksGrid, isNarrow ? styles.linksGridNarrow : styles.linksGridWide]}>
          {FOOTER_LINKS.map((col, i) => (
            <View key={i} style={styles.linkCol}>
              <Text style={styles.linkHeading}>{col.heading}</Text>
              {col.links.map((link, j) => (
                <Text key={j} style={styles.linkItem}>
                  {link}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom row */}
      <View style={[styles.bottomRow, isNarrow ? styles.bottomRowNarrow : styles.bottomRowWide]}>
        <Text style={styles.copyright}>
          © {new Date().getFullYear()} AthliTech. All rights reserved.
        </Text>
        <View style={styles.bottomLinks}>
          {['Privacy', 'Terms', 'Cookies'].map((l, i) => (
            <Text key={i} style={styles.bottomLink}>
              {l}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useThemeColors>) => StyleSheet.create({
  footer: {
    backgroundColor: 'transparent',
    borderTopColor: colors.borderSubtle || 'rgba(255,255,255,0.06)',
    borderTopWidth: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 36,
  },
  topRow: {
    gap: 48,
    marginBottom: 48,
  },
  topRowNarrow: {
    flexDirection: 'column',
  },
  topRowWide: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandCol: {
    maxWidth: 280,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  logoDot: {
    width: 10,
    height: 10,
    borderRadius: 99,
    backgroundColor: colors.emerald,
  },
  logoText: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandDesc: {
    color: colors.textDimmed,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 10,
  },
  socialBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.inputBg || '#111827',
    borderColor: colors.borderSubtle || 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialBtnText: {
    color: colors.textSub,
    fontSize: 12,
    fontWeight: '700',
  },
  linksGrid: {
    gap: 32,
  },
  linksGridNarrow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  linksGridWide: {
    flexDirection: 'row',
  },
  linkCol: {
    minWidth: 120,
  },
  linkHeading: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  linkItem: {
    color: colors.textDimmed,
    fontSize: 14,
    marginBottom: 10,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle || 'rgba(255,255,255,0.06)',
    marginBottom: 24,
  },
  bottomRow: {
    gap: 16,
  },
  bottomRowNarrow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  bottomRowWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  copyright: {
    color: colors.textDimmed,
    fontSize: 13,
  },
  bottomLinks: {
    flexDirection: 'row',
    gap: 20,
  },
  bottomLink: {
    color: colors.textDimmed,
    fontSize: 13,
  },
});
