import { useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
  useWindowDimensions,
} from 'react-native';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const FAQ_ITEMS = [
  {
    question: 'Who is AthliTech designed for?',
    answer:
      'AthliTech is built for sports academies, coaches, and athletes of all levels — from grassroots programs to professional setups. Whether you manage 10 athletes or 500, the platform scales with you.',
  },
  {
    question: 'How does role-based access work?',
    answer:
      'AthliTech has three distinct roles: Admin, Coach, and Athlete. Admins manage the entire academy. Coaches see only their assigned athletes. Athletes see only their own data. Each role gets a tailored dashboard.',
  },
  {
    question: 'Can coaches track multiple athletes at once?',
    answer:
      'Yes. Coaches have a full roster view with sortable metrics, individual athlete cards, and side-by-side comparisons. You can filter by sport, performance tier, or session attendance.',
  },
  {
    question: 'Is athlete data secure?',
    answer:
      'Absolutely. We use JWT-based authentication, role-gated API endpoints, and encrypted data storage. Athletes can only access their own profile — coaches and admins have scoped permissions.',
  },
  {
    question: 'Does AthliTech work on mobile and web?',
    answer:
      'Yes. Built with Expo and React Native, AthliTech runs on iOS, Android, and web browsers from a single codebase. The interface is fully responsive.',
  },
  {
    question: 'How do I get started?',
    answer:
      'Click "Get Started Free" to create an admin account for your academy. You can then invite coaches and athletes via email — no technical setup required.',
  },
];

export default function FAQSection() {
  const { width } = useWindowDimensions();
  const isNarrow = width < 768;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(i: number) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex(openIndex === i ? null : i);
  }

  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>FAQ</Text>
        </View>
        <Text style={[styles.title, isNarrow ? styles.titleNarrow : styles.titleWide]}>
          Frequently asked questions
        </Text>
        <Text style={styles.subtitle}>
          Everything you need to know before getting started.
        </Text>
      </View>

      {/* FAQ items */}
      <View style={[styles.faqList, { maxWidth: isNarrow ? undefined : 720 }]}>
        {FAQ_ITEMS.map((item, i) => (
          <Pressable
            key={i}
            onPress={() => toggle(i)}
            style={[styles.faqItem, openIndex === i && styles.faqItemOpen]}
          >
            <View style={styles.faqRow}>
              <Text style={styles.faqQ}>{item.question}</Text>
              <View style={[styles.chevron, openIndex === i && styles.chevronOpen]}>
                <Text style={styles.chevronText}>{openIndex === i ? '−' : '+'}</Text>
              </View>
            </View>
            {openIndex === i && (
              <Text style={styles.faqA}>{item.answer}</Text>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#0a0f1a',
    paddingVertical: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
    maxWidth: 600,
  },
  pill: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: 'rgba(16,185,129,0.25)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 16,
  },
  pillText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  title: {
    color: '#f0f4f8',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 14,
  },
  titleNarrow: {
    fontSize: 28,
    lineHeight: 36,
  },
  titleWide: {
    fontSize: 38,
    lineHeight: 48,
  },
  subtitle: {
    color: '#8a9ab5',
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
  },
  faqList: {
    width: '100%',
    gap: 10,
  },
  faqItem: {
    backgroundColor: '#111827',
    borderColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  faqItemOpen: {
    borderColor: 'rgba(16,185,129,0.3)',
    backgroundColor: 'rgba(16,185,129,0.04)',
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQ: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    lineHeight: 22,
  },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chevronOpen: {
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  chevronText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  faqA: {
    color: '#8a9ab5',
    fontSize: 14,
    lineHeight: 24,
    marginTop: 14,
  },
});
