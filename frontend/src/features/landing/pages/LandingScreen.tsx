import { ScrollView, StyleSheet, View } from 'react-native';

import DockNav from '@/components/ui/DockNav';
import ClickSpark from '@/components/animations/ClickSpark';
import HeroSection from '../components/HeroSection';
import WhyAthliTechSection from '../components/WhyAthliTechSection';
import HowItWorksSection from '../components/HowItWorksSection';
import WhoItsForSection from '../components/WhoItsForSection';
import VisionSection from '../components/VisionSection';
import CTASection from '../components/CTASection';
import Footer from '../components/Footer';

/**
 * LandingScreen
 *
 * Premium marketing page structured as a Scroll Stack narrative:
 *   Hero → Why AthliTech → How It Works → Who It's For → Vision → CTA → Footer
 *
 * Uses the floating DockNav and ClickSpark global click effect.
 * All section components are self-contained with scroll-reveal animations.
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
        {/* 1 — Hero: unchanged */}
        <HeroSection />

        {/* 2 — Why AthliTech: problem → solution narrative */}
        <WhyAthliTechSection />

        {/* 3 — How It Works: Register → Connect → Workouts → Train → Record → Feedback */}
        <HowItWorksSection />

        {/* 4 — Who It's For: Athletes · Coaches · Academies · Parents */}
        <WhoItsForSection />

        {/* 5 — Vision: AI-powered future */}
        <VisionSection />

        {/* 6 — CTA: unchanged */}
        <CTASection />

        {/* 7 — Footer: unchanged */}
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
