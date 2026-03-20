import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';

import BountyExplorer from './pages/BountyExplorer';
import BountyDetails from './pages/BountyDetails';
import SubmitReport from './pages/SubmitReport';
import CreateBounty from './pages/CreateBounty';
import Profile from './pages/Profile';
import ViewReports from './pages/ViewReports';

// Mock Placeholders for auxiliary pages
const FAQ = () => <div className="container" style={{padding: '4rem 0'}}><h2>FAQ & Guidelines</h2><p className="feature-desc">Learn how smart contract escrow and GenAI triage work.</p></div>;

// The Onboarding Modal appears immediately after a new wallet is connected
const OnboardingModal = () => {
  const { account, isNewUser, setIsNewUser, fetchUserProfile } = useAuth();
  const navigate = useNavigate();

  const handleComplete = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const role = formData.get('role');
    
    // Upsert the record with the chosen role during initial connect
    await supabase.from('users').upsert({ wallet_address: account, name, email, role });
    
    setIsNewUser(false);
    await fetchUserProfile(account);
    navigate('/bounties');
  };

  if(!isNewUser) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass-panel fade-in" style={{ width: '450px', padding: '3rem', position: 'relative' }}>
        <h2 className="text-gradient" style={{marginTop: 0, fontSize: '2rem'}}>Welcome to Debug</h2>
        <p className="feature-desc" style={{marginBottom: '2rem'}}>Let's set up your profile to start hunting or hosting bounties.</p>
        <form onSubmit={handleComplete} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>I am a... <span style={{color:'var(--primary)'}}>*</span></label>
          <div style={{display: 'flex', gap: '1rem'}}>
            <label style={{flex: 1, padding: '1rem', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <input type="radio" name="role" value="researcher" defaultChecked /> Researcher
            </label>
            <label style={{flex: 1, padding: '1rem', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <input type="radio" name="role" value="organization" /> Organization
            </label>
          </div>

          <label style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>Display Name / Alias <span style={{color:'var(--primary)'}}>*</span></label>
          <input name="name" type="text" placeholder="e.g. 0xHacker or Acme Corp" required style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.4)', color: 'white', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} />
          
          <label style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem'}}>Email Address (Optional)</label>
          <input name="email" type="email" placeholder="For automated payout receipts" style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.4)', color: 'white', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} />
          
          <button type="submit" className="btn-primary" style={{marginTop: '1.5rem', padding: '1rem'}}>Complete Profile</button>
        </form>
      </div>
    </div>
  );
};

function App() {
  const { account } = useAuth();

  return (
    <div className="app-wrapper">
      <Navbar />
      <OnboardingModal />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/bounties" element={<BountyExplorer />} />
        <Route path="/bounty/:id" element={<BountyDetails />} />
        <Route path="/bounty/:id/submit" element={<SubmitReport />} />
        <Route path="/bounty/:id/reports" element={<ViewReports />} />
        <Route path="/create-bounty" element={<CreateBounty />} />
        <Route path="/profile" element={account ? <Profile /> : <div className="container" style={{marginTop:'4rem'}}>Please connect wallet.</div>} />
        <Route path="/faq" element={<FAQ />} />
      </Routes>
    </div>
  );
}

export default App;
