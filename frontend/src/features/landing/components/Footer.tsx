import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

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

const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#060b14',
    borderTopColor: 'rgba(255,255,255,0.06)',
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
    backgroundColor: '#10b981',
  },
  logoText: {
    color: '#f0f4f8',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandDesc: {
    color: '#4a5568',
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
    backgroundColor: '#111827',
    borderColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialBtnText: {
    color: '#8a9ab5',
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
    color: '#c8d8e8',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  linkItem: {
    color: '#4a5568',
    fontSize: 14,
    marginBottom: 10,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
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
    color: '#4a5568',
    fontSize: 13,
  },
  bottomLinks: {
    flexDirection: 'row',
    gap: 20,
  },
  bottomLink: {
    color: '#4a5568',
    fontSize: 13,
  },
});
