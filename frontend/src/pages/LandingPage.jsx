import React from 'react';
import { Canvas } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere, Float } from '@react-three/drei';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';

const AbstractShape = () => {
  return (
    <Float speed={2.5} rotationIntensity={1.5} floatIntensity={2.5}>
      <Sphere args={[1, 64, 64]} scale={2.8}>
        <MeshDistortMaterial
          color="#8a2be2"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} color="#00f0ff" />
      <directionalLight position={[-10, -10, -5]} intensity={1} color="#ff2a5f" />
    </Float>
  );
};

export default function LandingPage() {
  const [webglSupported, setWebglSupported] = React.useState(true);

  React.useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      setWebglSupported(!!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))));
    } catch (e) {
      setWebglSupported(false);
    }
  }, []);

  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -300]);

  return (
    <div className="landing-wrapper">
      {/* Dynamic 3D Hero */}
      <section className="hero" style={{ position: 'relative', overflow: 'hidden', height: '90vh', display:'flex', alignItems:'center' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.8 }}>
          {webglSupported ? (
            <Canvas camera={{ position: [0, 0, 8] }}>
              <AbstractShape />
            </Canvas>
          ) : (
            <div style={{ 
                width: '100%', 
                height: '100%', 
                background: 'radial-gradient(circle at 70% 30%, rgba(138,43,226,0.4) 0%, transparent 60%), radial-gradient(circle at 20% 70%, rgba(0,240,255,0.3) 0%, transparent 50%)',
                filter: 'blur(60px)'
            }} />
          )}
        </div>
        
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="hero-content"
          >
            <h1 className="hero-title" style={{ fontSize: 'clamp(3rem, 7vw, 6rem)', textAlign: 'left', margin: 0 }}>
              Hack the <span className="text-gradient">Future.</span>
            </h1>
            <p className="hero-subtitle" style={{ fontSize: '1.5rem', maxWidth: '600px', marginBottom: '2rem', textAlign: 'left', marginTop: '1rem' }}>
              The next-generation Web3 bug bounty platform powered by trustless smart contracts and GenAI validation.
            </p>
            <div className="hero-actions" style={{ justifyContent: 'flex-start' }}>
              <Link to="/bounties" className="btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>Explore Bounties</Link>
              <a href="#advantages" className="btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>Learn More</a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Advantages Section */}
      <section id="advantages" style={{ padding: '8rem 0', background: 'rgba(5,6,8,0.95)' }}>
        <div className="container">
          <motion.h2 
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-gradient" style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '4rem' }}
          >
            Why Choose Debug?
          </motion.h2>
          <div className="features-grid">
            {[
              { title: "Trustless Payouts", desc: "Traditional platforms rely on manual payouts. We lock bounty funds in immutable Smart Contracts." },
              { title: "AI-Powered Triage", desc: "No more ignoring valid reports. Our GenAI pipeline instantly validates and scores your PoC." },
              { title: "Zero Platform Fees", desc: "Organizations pay the actual bounty. Researchers get 100% of the funds securely routed via Web3." }
            ].map((adv, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }}
                key={i} className="glass-panel feature-card"
              >
                <div style={{fontSize: '2rem', marginBottom: '1rem'}}>{i === 0 ? '⛓️' : i === 1 ? '🤖' : '💸'}</div>
                <h3 className="feature-title">{adv.title}</h3>
                <p className="feature-desc">{adv.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Flow */}
      <section style={{ padding: '8rem 0', background: 'var(--bg-dark)' }}>
        <div className="container">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-gradient" style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '4rem' }}>
            How It Works
          </motion.h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', maxWidth: '800px', margin: '0 auto' }}>
             {[
               { step: "1", title: "Organizations Deposit Funds", desc: "Companies create a bounty program and deposit the full reward amount into our Escrow smart contract." },
               { step: "2", title: "Researchers Hunt", desc: "Security researchers discover zero-days and submit them via our advanced CVSS-powered Markdown editor." },
               { step: "3", title: "AI Validation", desc: "Gemini AI instantly parses the PoC, checks for plagiarism, and validates the claims." },
               { step: "4", title: "Automated Payout", desc: "Once verified, the smart contract automatically transfers ETH directly to the researcher's wallet." }
             ].map((flow, i) => (
               <motion.div 
                 initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                 key={i} className="glass-panel" style={{ display: 'flex', gap: '2rem', padding: '2rem', alignItems: 'center', background: 'var(--bg-card)' }}
               >
                 <div style={{ fontSize: '4rem', fontWeight: '800', color: 'var(--primary)', opacity: 0.3, fontFamily: 'var(--font-mono)' }}>0{flow.step}</div>
                 <div>
                   <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', color: 'white' }}>{flow.title}</h3>
                   <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: '1.6' }}>{flow.desc}</p>
                 </div>
               </motion.div>
             ))}
          </div>
        </div>
      </section>

      {/* Hero call to action */}
      <section style={{ padding: '6rem 0', textAlign: 'center', background: 'radial-gradient(circle at center, rgba(138,43,226,0.15) 0%, transparent 60%)' }}>
          <h2 style={{fontSize: '3rem', marginBottom: '2rem'}}>Ready to secure the ecosystem?</h2>
          <Link to="/bounties" className="btn-primary" style={{fontSize: '1.2rem', padding: '1.2rem 3rem'}}>Start Hunting</Link>
      </section>

      <footer className="footer container">
        <div>&copy; {new Date().getFullYear()} Debug. All rights reserved. Built for the Decentralized Web.</div>
        <div className="footer-links">
          <Link to="#">Terms</Link>
          <Link to="#">Privacy</Link>
          <Link to="#">Documentation</Link>
        </div>
      </footer>
    </div>
  );
}
