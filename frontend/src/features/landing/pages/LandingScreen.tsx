import { ScrollView, StyleSheet, View } from 'react-native';

import NavBar from '../components/NavBar';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import HowItWorksSection from '../components/HowItWorksSection';
import BenefitsSection from '../components/BenefitsSection';
import CTASection from '../components/CTASection';
import FAQSection from '../components/FAQSection';
import Footer from '../components/Footer';

/**
 * LandingScreen
 *
 * Public-facing marketing page. Composed of modular section components.
 * All routing (Get Started → /register, Sign In → /) is handled inside
 * individual section components so this file stays clean.
 */
export default function LandingScreen() {
  return (
    <View style={styles.root}>
      {/* Sticky navigation */}
      <NavBar />

      {/* Scrollable page content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <BenefitsSection />
        <CTASection />
        <FAQSection />
        <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0f1a',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
