import { ScrollView, StyleSheet, View } from 'react-native';

import DockNav from '@/components/ui/DockNav';
import ClickSpark from '@/components/animations/ClickSpark';
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
 * Public-facing marketing page. Uses the floating DockNav and ClickSpark
 * global click effect. All section components remain self-contained.
 */
export default function LandingScreen() {
  return (
    <View style={styles.root}>
      {/* Global click spark effect (web only — renders nothing on native) */}
      <ClickSpark />

      {/* Floating dock navigation — positioned absolute over content */}
      <DockNav />

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
    backgroundColor: '#060b14',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#060b14',
  },
  scrollContent: {
    flexGrow: 1,
  },
});
