"use client";

import React from "react";
import { LandingNavbar } from "../components/landing/LandingNavbar";
import { PanoramicLandscapeHero } from "../components/hero/PanoramicLandscapeHero";
import { ScrollFeaturePhoneShowcase } from "../components/hero/ScrollFeaturePhoneShowcase";
import { FeatureGrid } from "../components/landing/FeatureGrid";
import { HowItWorksSection } from "../components/landing/HowItWorksSection";
import { FaqSection } from "../components/landing/FaqSection";
import { SupportSection } from "../components/landing/SupportSection";
import { BottomCtaSection } from "../components/landing/BottomCtaSection";
import { LandingFooter } from "../components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <main style={styles.main}>
      <div style={styles.contentWrapper}>
        <LandingNavbar />
        {/* 1. Hero Section */}
        <PanoramicLandscapeHero />

        {/* 2. Clear Black Phone Mockup Scroll-Driven Feature Showcase (4-5 Screens) */}
        <ScrollFeaturePhoneShowcase />

        {/* 3. Features Section */}
        <FeatureGrid />

        {/* 3. How It Works Section */}
        <HowItWorksSection />

        {/* 4. FAQs Section */}
        <FaqSection />

        {/* 5. Customer Support Section */}
        <SupportSection />

        {/* 6. Bottom High-Conversion CTA Section */}
        <BottomCtaSection />

        {/* Clean Minimalist SaaS Footer */}
        <LandingFooter />
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    backgroundColor: "#ffffff",
    color: "#0f172a",
    minHeight: "100vh",
    overflowX: "hidden",
    position: "relative",
  },
  contentWrapper: {
    position: "relative",
    zIndex: 1,
    backgroundColor: "#ffffff",
  },
};
