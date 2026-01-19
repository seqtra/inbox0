'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// 1. This component handles the logic and UI
function LandingContent() {
  const searchParams = useSearchParams();
  const isConnected = searchParams?.get('status') === 'connected';


  const handleLogin = () => {
    window.location.href = 'http://localhost:3000/api/auth/google';
  };

  // --- STYLES ---
  const styles: Record<string, React.CSSProperties> = {
    page: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      color: '#1a1a1a',
      lineHeight: '1.6',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
      overflowX: 'hidden',
    },
    nav: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 40px',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    logo: {
      fontWeight: '700',
      fontSize: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    heroSection: {
      textAlign: 'center',
      padding: '80px 20px 60px',
      background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
      position: 'relative',
      overflow: 'hidden',
    },
    heroBackgroundBlob: {
      position: 'absolute',
      top: '-50%',
      right: '-10%',
      width: '800px',
      height: '800px',
      background: 'linear-gradient(90deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)',
      filter: 'blur(100px)',
      opacity: '0.4',
      zIndex: 0,
      borderRadius: '50%',
    },
    heroContent: {
      position: 'relative',
      zIndex: 1,
      maxWidth: '800px',
      margin: '0 auto',
    },
    badge: {
      display: 'inline-block',
      padding: '6px 12px',
      borderRadius: '20px',
      backgroundColor: '#1a1a1a',
      color: 'white',
      fontSize: '12px',
      fontWeight: '600',
      marginBottom: '20px',
    },
    headline: {
      fontSize: '56px',
      fontWeight: '800',
      lineHeight: '1.1',
      marginBottom: '24px',
      background: '-webkit-linear-gradient(45deg, #1a1a1a, #4a4a4a)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    subheadline: {
      fontSize: '20px',
      color: '#666',
      marginBottom: '40px',
      maxWidth: '600px',
      margin: '0 auto 40px',
    },
    ctaContainer: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'center',
      marginBottom: '60px',
    },
    button: {
      padding: '12px 30px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: '#1a1a1a',
      color: 'white',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'transform 0.2s',
    },
    successBox: {
      padding: '15px 25px',
      backgroundColor: '#d1e7dd',
      color: '#0f5132',
      borderRadius: '8px',
      display: 'inline-block',
      marginTop: '20px',
      fontWeight: '600',
    },
    statsRow: {
      display: 'flex',
      justifyContent: 'center',
      gap: '60px',
      marginTop: '40px',
      borderTop: '1px solid #eee',
      paddingTop: '40px',
    },
    statItem: {
      textAlign: 'left',
    },
    statNumber: {
      display: 'block',
      fontSize: '24px',
      fontWeight: '700',
    },
    statLabel: {
      fontSize: '14px',
      color: '#666',
    },
    section: {
      padding: '100px 20px',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    sectionHeader: {
      textAlign: 'center',
      marginBottom: '60px',
    },
    sectionTitle: {
      fontSize: '36px',
      fontWeight: '700',
      marginBottom: '16px',
    },
    gridThree: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '30px',
    },
    card: {
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '16px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
      transition: 'transform 0.3s ease',
    },
    stepNumber: {
      fontSize: '40px',
      fontWeight: '800',
      color: '#f0f0f0',
      marginBottom: '20px',
    },
    cardTitle: {
      fontSize: '20px',
      fontWeight: '700',
      marginBottom: '10px',
    },
    cardText: {
      color: '#666',
      fontSize: '15px',
    },
    featureIcon: {
      width: '48px',
      height: '48px',
      backgroundColor: '#f5f5f5',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '20px',
      fontSize: '24px',
    },
    whatsappButton: {
      backgroundColor: '#25D366',
      color: 'white',
      border: 'none',
      padding: '16px 32px',
      fontSize: '18px',
      fontWeight: 'bold',
      borderRadius: '50px',
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(37, 211, 102, 0.4)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      margin: '0 auto',
    },
    footer: {
      backgroundColor: '#111',
      color: '#888',
      padding: '60px 20px',
      textAlign: 'center',
      marginTop: '100px',
    }
  };

  return (
    <div style={styles.page}>
      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.logo}>⚡ inbox-0</div>
        <div>
          {isConnected ? (
            <span style={{color: '#25D366', fontWeight: 'bold'}}>Connected</span>
          ) : (
            <button style={{...styles.button, padding: '8px 20px', fontSize: '14px'}} onClick={handleLogin}>
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header style={styles.heroSection}>
        <div style={styles.heroBackgroundBlob}></div>
        <div style={styles.heroContent}>
          <div style={styles.badge}>✨ AI-Powered WhatsApp Bridge</div>
          <h1 style={styles.headline}>
            Important emails,<br />
            delivered to your WhatsApp
          </h1>
          <p style={styles.subheadline}>
            Stop drowning in your inbox. inbox-0 uses AI to scan what matters to you and delivers smart email summaries straight to WhatsApp. Get to zero, stay focused.
          </p>

          {isConnected ? (
            <div style={styles.successBox}>
              ✅ Gmail Connected Successfully! Check your WhatsApp.
            </div>
          ) : (
            <div style={styles.ctaContainer}>
              <button 
                style={styles.whatsappButton}
                onClick={handleLogin}
              >
                Connect Gmail Account →
              </button>
            </div>
          )}

          <div style={styles.statsRow}>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>10k+</span>
              <span style={styles.statLabel}>Users</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>500k+</span>
              <span style={styles.statLabel}>Emails Processed</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>5hrs</span>
              <span style={styles.statLabel}>Saved Weekly</span>
            </div>
          </div>
        </div>
      </header>

      {/* How it Works */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>How it works</h2>
          <p style={{color: '#666'}}>Three simple steps to achieve inbox-0 and never miss what matters.</p>
        </div>
        <div style={styles.gridThree}>
          <div style={styles.card}>
            <div style={styles.stepNumber}>01</div>
            <h3 style={styles.cardTitle}>Connect Your Email</h3>
            <p style={styles.cardText}>Securely link your Gmail account. We use official Google APIs and never store your password.</p>
          </div>
          <div style={styles.card}>
            <div style={styles.stepNumber}>02</div>
            <h3 style={styles.cardTitle}>Define Preferences</h3>
            <p style={styles.cardText}>Tell our AI what's important. "Client emails", "Flight tickets", or "Invoices only".</p>
          </div>
          <div style={styles.card}>
            <div style={styles.stepNumber}>03</div>
            <h3 style={styles.cardTitle}>Receive Summaries</h3>
            <p style={styles.cardText}>Get instant WhatsApp notifications with AI-generated summaries of your important emails.</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{...styles.section, backgroundColor: '#fff'}}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Everything you need to tame your inbox</h2>
          <p style={{color: '#666'}}>Powerful features designed to help you focus on what truly matters.</p>
        </div>
        <div style={{...styles.gridThree, gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))'}}>
          <div style={{...styles.card, backgroundColor: '#f8f9fa', border: 'none', boxShadow: 'none'}}>
            <div style={styles.featureIcon}>🤖</div>
            <h3 style={styles.cardTitle}>AI-Powered Filtering</h3>
            <p style={styles.cardText}>Our custom LLM reads your email like a personal assistant and filters out the noise automatically.</p>
          </div>
          <div style={{...styles.card, backgroundColor: '#f8f9fa', border: 'none', boxShadow: 'none'}}>
            <div style={styles.featureIcon}>💬</div>
            <h3 style={styles.cardTitle}>WhatsApp Integration</h3>
            <p style={styles.cardText}>Receive instant summaries on the platform you use every day. No new apps to download.</p>
          </div>
          <div style={{...styles.card, backgroundColor: '#f8f9fa', border: 'none', boxShadow: 'none'}}>
            <div style={styles.featureIcon}>⚡</div>
            <h3 style={styles.cardTitle}>Smart Summaries</h3>
            <p style={styles.cardText}>Don't read long threads. Get a 2-sentence summary of what's being discussed and what action is required.</p>
          </div>
          <div style={{...styles.card, backgroundColor: '#f8f9fa', border: 'none', boxShadow: 'none'}}>
            <div style={styles.featureIcon}>🔒</div>
            <h3 style={styles.cardTitle}>Secure & Private</h3>
            <p style={styles.cardText}>Bank-level encryption and GDPR compliant. Your data is processed securely and never sold.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{...styles.section, textAlign: 'center', background: 'linear-gradient(135deg, #1a1a1a 0%, #000 100%)', color: 'white', borderRadius: '24px', margin: '40px auto'}}>
        <h2 style={{...styles.sectionTitle, color: 'white'}}>Ready to achieve inbox-0?</h2>
        <p style={{color: '#888', marginBottom: '30px'}}>Join over 10,000 professionals who've reclaimed their time.</p>
        <button 
          style={{...styles.whatsappButton, backgroundColor: 'white', color: 'black'}}
          onClick={handleLogin}
        >
          Get Started Free
        </button>
        <div style={{marginTop: '20px', fontSize: '14px', color: '#666'}}>
          ✓ 14-day free trial • ✓ Cancel anytime • ✓ No credit card required
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={{maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px'}}>
          <div style={{textAlign: 'left'}}>
            <h4 style={{color: 'white', marginBottom: '10px'}}>inbox-0</h4>
            <p>Making email suck less.</p>
          </div>
          <div style={{display: 'flex', gap: '40px'}}>
            <div>
              <h5 style={{color: 'white', marginBottom: '10px'}}>Product</h5>
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <span>Features</span>
                <span>Pricing</span>
              </div>
            </div>
            <div>
              <h5 style={{color: 'white', marginBottom: '10px'}}>Legal</h5>
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <span>Privacy</span>
                <span>Terms</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{marginTop: '60px', borderTop: '1px solid #333', paddingTop: '20px'}}>
          © 2026 inbox-0. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

// 2. This is the wrapper that satisfies Next.js 13+ build requirements
export default function LandingPage() {
  return (
    <Suspense fallback={
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
        Loading...
      </div>
    }>
      <LandingContent />
    </Suspense>
  );
}