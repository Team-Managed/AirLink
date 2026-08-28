"use client";

import React from "react";
import { LandingNavbar } from "../components/landing/LandingNavbar";
import { HeroSection } from "../components/landing/HeroSection";
import { InstallCommandBar } from "../components/landing/InstallCommandBar";
import { InteractiveDemoSimulator } from "../components/landing/InteractiveDemoSimulator";
import { FeatureGrid } from "../components/landing/FeatureGrid";
import { ArchitectureDiagram } from "../components/landing/ArchitectureDiagram";
import { EcosystemShowcase } from "../components/landing/EcosystemShowcase";
import { LandingFooter } from "../components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <main style={styles.main}>
      <LandingNavbar />
      <HeroSection />
      <InstallCommandBar />
      <InteractiveDemoSimulator />
      <FeatureGrid />
      <ArchitectureDiagram />
      <EcosystemShowcase />
      <LandingFooter />
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    backgroundColor: "#090d16",
    color: "#f8fafc",
    minHeight: "100vh",
    overflowX: "hidden",
  },
};
