import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Dashboard({ account }) {
  const { userProfile, logout } = useAuth();
  
  // Lock the dashboard to their onboarding role
  const role = userProfile?.role || 'researcher';

  const [activeBounties, setActiveBounties] = useState([]);
  const [reports, setReports] = useState([]);
  
  // Researcher Form State
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportDesc, setReportDesc] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [selectedBountyId, setSelectedBountyId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);

  // Organization Form State
  const [showCreateBounty, setShowCreateBounty] = useState(false);
  const [bountyTitle, setBountyTitle] = useState('');
  const [bountyScope, setBountyScope] = useState('');
  const [escrowAmount, setEscrowAmount] = useState('');

  // Hydrate Data from Supabase
  useEffect(() => {
    fetchData();
  }, [account, role]);

  const fetchData = async () => {
    // Note: User upsert is handled by the initial Onboarding flow globally now!

    const { data: bounties } = await supabase.from('bounties').select('*').order('created_at', { ascending: false });
    if(bounties) setActiveBounties(bounties);
    if(bounties && bounties.length > 0) setSelectedBountyId(bounties[0].id);

    // Fetch reports based on persistent role context
    if (role === 'researcher') {
      const { data: userReports } = await supabase.from('reports').select('*').eq('researcher_address', account);
      if(userReports) setReports(userReports);
    } else {
      const { data: orgReports } = await supabase.from('reports')
        .select(`*, bounties!inner(org_address)`)
        .eq('bounties.org_address', account);
      if(orgReports) setReports(orgReports);
    }
  };

  const createBounty = async () => {
    if(!bountyTitle || !bountyScope || !escrowAmount) return;
    try {
      // IN A REAL APP: Deploy Hardhat Smart Contract Here before Database insert!
      const mockContractAddress = "0x" + Math.random().toString(16).substr(2, 40);
      
      await supabase.from('bounties').insert({
        org_address: account,
        title: bountyTitle,
        description: bountyScope,
        escrow_amount: parseFloat(escrowAmount),
        contract_address: mockContractAddress,
      });
      setShowCreateBounty(false);
      setBountyTitle(''); setBountyScope(''); setEscrowAmount('');
      fetchData();
    } catch(err) {
      console.error(err);
    }
  };

  const submitReport = async () => {
    if(!reportDesc.trim() || !selectedBountyId) return;
    setIsSubmitting(true);
    setAiFeedback(null);
    try {
        const response = await fetch('http://localhost:3001/api/triage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reportDescription: reportDesc, severity })
        });
        const data = await response.json();
        setAiFeedback(data);

        // Save report to Supabase
        await supabase.from('reports').insert({
          bounty_id: selectedBountyId,
          researcher_address: account,
          report_desc: reportDesc,
          claimed_severity: severity,
          ai_is_valid: data.isValid,
          ai_evaluated_severity: data.evaluatedSeverity,
          ai_confidence_score: data.confidenceScore,
          ai_feedback: data.feedback
        });

        fetchData();
    } catch(err) {
        setAiFeedback({ isValid: false, evaluatedSeverity: 'Error', confidenceScore: 0, feedback: 'Failed to complete triage.' });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="container" style={{paddingTop: '2rem'}}>
      <main className="dashboard-main">
        {/* We removed the explicit manual toggle role selector. It is now persistent based on onboarding! */}
        <div style={{marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem'}}>
           <div style={{background: 'rgba(138,43,226,0.1)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', color: 'var(--secondary)'}}>
               {role === 'researcher' ? '🔍 Secure Researcher Mode' : '🏢 Organization Host Mode'}
           </div>
           <button className="btn-secondary" style={{padding: '0.4rem 1rem', fontSize: '0.85rem'}} onClick={logout}>Disconnect Wallet</button>
        </div>

        <div className="glass-panel dashboard-content">
          {role === 'researcher' ? (
            <div className="fade-in">
              <h2 className="text-gradient">Welcome back, {userProfile?.name}!</h2>
              <p className="feature-desc">Browse open bounties, submit reports, and track your GenAI verified submissions across your persistent session.</p>
              
              <div className="stats-grid">
                <div className="glass-panel stat-card">
                  <h3>$0</h3><p>Bounties Earned</p>
                </div>
                <div className="glass-panel stat-card">
                  <h3>{reports.filter(r => r.ai_is_valid).length}</h3><p>Valid Reports</p>
                </div>
                <div className="glass-panel stat-card">
                  <h3>Unranked</h3><p>On-Chain Rep</p>
                </div>
              </div>
              
              <div className="action-row">
                <button className="btn-primary" onClick={() => setShowReportForm(false)}>Refocus Dashboard</button>
              </div>
            </div>
          ) : (
            <div className="fade-in">
              <h2 className="text-gradient">Organization Hub: {userProfile?.name}</h2>
              <p className="feature-desc">Manage your decentralized bounty programs and review automated GenAI triaged reports seamlessly.</p>
              
              <div className="stats-grid">
                <div className="glass-panel stat-card">
                  <h3>{activeBounties.filter(b => b.org_address === account).reduce((sum, b) => sum + Number(b.escrow_amount), 0)} ETH</h3><p>Total in Escrow</p>
                </div>
                <div className="glass-panel stat-card">
                  <h3>{activeBounties.filter(b => b.org_address === account).length}</h3><p>Active Programs</p>
                </div>
                <div className="glass-panel stat-card">
                  <h3>{reports.filter(r => r.status === 'pending').length}</h3><p>Pending Reviews</p>
                </div>
              </div>

              <div className="action-row">
                <button className="btn-primary" onClick={() => setShowCreateBounty(!showCreateBounty)}>
                  {showCreateBounty ? "Cancel" : "+ Deposit Bounty & Create"}
                </button>
              </div>

              {showCreateBounty ? (
                <div className="glass-panel fade-in" style={{marginTop: '2rem', padding: '2rem'}}>
                  <h3 style={{marginTop: 0}}>Create New Bounty Program</h3>
                  <input type="text" value={bountyTitle} onChange={e => setBountyTitle(e.target.value)} placeholder="Program Name (e.g., Core Protocol V2)" style={{width: '100%', padding: '0.8rem', background: 'var(--bg-dark)', color: 'white', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '1rem'}} />
                  <textarea value={bountyScope} onChange={e => setBountyScope(e.target.value)} placeholder="Scope and Rules..." style={{width: '100%', minHeight: '100px', background: 'var(--bg-dark)', color: 'white', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '1rem', fontFamily: 'inherit'}} />
                  <input type="number" value={escrowAmount} onChange={e => setEscrowAmount(e.target.value)} placeholder="Escrow Amount (ETH)" style={{width: '100%', padding: '0.8rem', background: 'var(--bg-dark)', color: 'white', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '1rem'}} />
                  <button className="btn-primary" onClick={createBounty}>Deploy Escrow Contract</button>
                </div>
              ) : (
                 <div style={{marginTop: '2rem'}}>
                  <h3>Incoming GenAI Triaged Reports</h3>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
                    {reports.map((report, i) => (
                      <div key={i} className="glass-panel" style={{padding: '1.5rem', borderLeft: report.ai_is_valid ? '4px solid #10b981' : '4px solid #ff2a5f'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                          <h4 style={{margin: '0 0 0.5rem 0', color: 'white'}}>{report.claimed_severity} Vulnerability</h4>
                          <span style={{color: report.ai_is_valid ? '#10b981' : '#ff2a5f', fontWeight: 'bold'}}>{report.ai_evaluated_severity} (AI Score: {report.ai_confidence_score}%)</span>
                        </div>
                        <p style={{margin: '0 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.9rem'}}>{report.report_desc}</p>
                        <p style={{color: 'white', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px'}}><strong>AI Feedback:</strong> {report.ai_feedback}</p>
                        <button className="btn-primary" style={{marginTop: '0.5rem'}}>Approve & Disburse Payout</button>
                      </div>
                    ))}
                    {reports.length === 0 && <p style={{color: 'var(--text-muted)'}}>No reports submitted yet.</p>}
                  </div>
                 </div> 
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
