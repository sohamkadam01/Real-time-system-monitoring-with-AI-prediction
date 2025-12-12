// IntroPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Zap, ShieldCheck, BarChart3, ArrowRight } from 'lucide-react';
import './IntroPage.css'; 


const MONITORING_IMAGE_URL = 'https://placehold.co/1200x750/1e293b/f1f5f9?text=Real-Time+AI+Monitoring+Dashboard';

// Feature data with icon classes
const features = [
  {
    icon: Activity,
    title: 'Real-Time Telemetry',
    description: 'Monitor system metrics (CPU, memory, latency) with sub-second precision across all environments.',
    iconClass: 'icon-sky',
  },
  {
    icon: Zap,
    title: 'Predictive AI Alerts',
    description: 'Use advanced machine learning to predict system failures and anomalies before they impact users.',
    iconClass: 'icon-amber',
  },
  {
    icon: ShieldCheck,
    title: 'Automated Health Checks',
    description: 'Proactively verify service health against predefined baselines and compliance standards.',
    iconClass: 'icon-green',
  },
  {
    icon: BarChart3,
    title: 'Intuitive Data Viz',
    description: 'Visualize complex data sets with customizable dashboards, charts, and drill-down analytics.',
    iconClass: 'icon-indigo',
  },
];

const FeatureCard = ({ icon: Icon, title, description, iconClass }) => (
  <div className="feature-card">
    <Icon className={`feature-icon ${iconClass}`} />
    <h3 className="feature-title">{title}</h3>
    <p className="feature-description">{description}</p>
  </div>
);

const IntroPage = () => {
  const navigate = useNavigate();
  const [ctaMessage, setCtaMessage] = useState('');

  const handleGetStarted = () => {
    navigate('/app');
  };

  const handleFreeTrial = () => {
    setCtaMessage('Demo initiated! You would be redirected to the sign-up page.');
    setTimeout(() => setCtaMessage(''), 3000);
  };

  return (
    <div className="intro-page">
      <header className="intro-header">
        <div className="logo">SystemAI</div>
        <nav className="nav-desktop">
          <a href="#" className="nav-link">Features</a>
          <a href="#" className="nav-link">Pricing</a>
          <a href="#" className="nav-link">Contact</a>
          <button 
            onClick={handleGetStarted}
            className="nav-button"
          >
            Dashboard
          </button>
        </nav>
        <button 
          onClick={handleGetStarted}
          className="mobile-nav-button"
        >
          Dashboard
        </button>
      </header>

      {/* Hero Section */}
      <main className="intro-main">
        <section className="hero-section">
          <span className="badge">
            Next-Gen Monitoring 🚀
          </span>
          <h1 className="hero-title">
            Predict the Future of Your Systems
            <span className="hero-title-accent">with AI Intelligence</span>
          </h1>
          <p className="hero-description">
            Go beyond simple alerts. SystemAI provides a unified, real-time view of your infrastructure
            and leverages predictive models to eliminate downtime before it happens.
          </p>

          <div className="button-group">
            <button
              onClick={handleGetStarted}
              className="primary-button"
            >
              Get Started Now
              <ArrowRight style={{ width: '1.25rem', height: '1.25rem', marginLeft: '0.5rem' }} />
            </button>
            
            <button
              onClick={handleFreeTrial}
              className="secondary-button"
            >
              Start Free Trial
            </button>
          </div>
          
          {ctaMessage && (
            <div className="success-message">
              {ctaMessage}
            </div>
          )}
        </section>

        {/* Laptop Image Placeholder Section */}
        <section className="laptop-section">
          <div className="laptop-container">
            <div className="laptop-frame"></div>
            
            <img
              src={MONITORING_IMAGE_URL}
              alt="AI System Monitoring Dashboard Screenshot"
              className="dashboard-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/1200x750/27374D/D7DBDD?text=DASHBOARD+LOADING+ERROR';
              }}
            />
            <div className="overlay-button-container">
              {/* <button
                onClick={handleGetStarted}
                className="overlay-button"
              >
                Launch Dashboard →
              </button> */}
            </div>
          </div>
        </section>
        
        {/* Features Grid Section */}
        <section className="features-section">
          <h2 className="section-title">
            The Power of Real-Time AI
          </h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="cta-section">
          <div className="cta-container">
            <h2 className="cta-title">
              Ready to Transform Your Monitoring?
            </h2>
            <p className="cta-description">
              Join thousands of engineers who trust SystemAI to keep their infrastructure healthy and resilient.
            </p>
            <div className="button-group">
              <button
                onClick={handleGetStarted}
                className="primary-button"
              >
                Get Started Free
                <ArrowRight style={{ width: '1.25rem', height: '1.25rem', marginLeft: '0.5rem' }} />
              </button>
              <button
                onClick={handleFreeTrial}
                className="secondary-button"
              >
                Schedule a Demo
              </button>
            </div>
            <p className="cta-note">
              No credit card required. Start monitoring in 5 minutes.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="intro-footer">
        <div className="footer-content">
          <div className="logo mb-4 md:mb-0">
            SystemAI
          </div>
          <div className="footer-links">
            <a href="#" className="footer-link">Privacy</a>
            <a href="#" className="footer-link">Terms</a>
            <a href="#" className="footer-link">Docs</a>
            <a href="#" className="footer-link">Support</a>
          </div>
        </div>
        <p>&copy; {new Date().getFullYear()} SystemAI. All rights reserved.</p>
        <p className="copyright">
          Built with React and CSS for high-fidelity monitoring.
        </p>
      </footer>
    </div>
  );
};

export default IntroPage;