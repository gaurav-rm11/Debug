import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import { Shield, LayoutDashboard, FileText, Trophy, Settings, ShieldAlert, Building2, Globe, Activity, CheckCircle, XCircle, Info, ExternalLink, Calendar, Copy, Plus, XOctagon } from 'lucide-react';
import { ethers } from 'ethers';
import { depositToEscrow, closeEscrow } from '../lib/contractUtils';

const LeftSidebar = () => (
   <div style={{width: '240px', borderRight: '1px solid var(--border)', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-dark)'}}>
      <div style={{color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing:'1px', marginBottom: '1rem', paddingLeft: '1rem'}}>Navigation</div>
      <Link to="/bounties" style={{textDecoration:'none'}}><button className="btn-secondary" style={{width:'100%', textAlign:'left', background:'transparent', border:'none', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.8rem', padding:'0.8rem 1rem'}}><LayoutDashboard size={18}/> Overview</button></Link>
      <Link to="/bounties" style={{textDecoration:'none'}}><button className="btn-secondary" style={{width:'100%', textAlign:'left', background:'rgba(0,240,255,0.1)', border:'1px solid var(--primary)', color:'var(--primary)', display:'flex', alignItems:'center', gap:'0.8rem', padding:'0.8rem 1rem'}}><Shield size={18}/> Bounties</button></Link>
      <button className="btn-secondary" style={{textAlign:'left', background:'transparent', border:'none', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.8rem', padding:'0.8rem 1rem'}}><FileText size={18}/> My Reports</button>
      <button className="btn-secondary" style={{textAlign:'left', background:'transparent', border:'none', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.8rem', padding:'0.8rem 1rem'}}><Trophy size={18}/> Leaderboard</button>
      <button className="btn-secondary" style={{textAlign:'left', background:'transparent', border:'none', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.8rem', padding:'0.8rem 1rem'}}><Settings size={18}/> Settings</button>
   </div>
);

export default function BountyDetails() {
  const { id } = useParams();
  const { account, userProfile } = useAuth();
  const [bounty, setBounty] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ethPriceInr, setEthPriceInr] = useState(245000); // Default placeholder

  useEffect(() => {
    // Fetch real-time ETH price (optional API call, using static for prototype reliability)
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr')
      .then(res => res.json())
      .then(data => setEthPriceInr(data.ethereum.inr))
      .catch(() => {});
  }, []);

  const isOwner = account && bounty && account.toLowerCase() === bounty.org_address.toLowerCase();
  const role = userProfile?.role || 'researcher';

  const formatCurrency = (eth) => {
    const val = parseFloat(eth) || 0;
    const inr = (val * ethPriceInr).toLocaleString('en-IN', { maximumFractionDigits: 0 });
    return `${val} ETH (~₹${inr})`;
  };

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('bounties').select('*').eq('id', id).single();
      if(data) setBounty(data);
    }
    load();
  }, [id]);

  if(!bounty) return <div className="container" style={{padding: '4rem 0', color: 'var(--text-muted)', textAlign: 'center'}}>Resolving Smart Contract Target...</div>;

  const handleCopy = (txt) => {
      navigator.clipboard.writeText(txt);
      alert("Copied scope to clipboard!");
  };

  return (
    <div style={{display: 'flex', minHeight: 'calc(100vh - 80px)'}}>
        
      {/* Left Navigation */}
      <LeftSidebar />

      {/* Main Content Area */}
      <div style={{flex: 1, padding: '3rem 4rem', overflowY: 'auto'}}>
          
          {/* Section 1: Title & Summary */}
          <div style={{background: 'rgba(0, 240, 255, 0.1)', display: 'inline-block', padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '1.5rem'}}>
             {bounty.is_active ? 'Active Program' : 'Closed or Resolved'}
          </div>
          <h1 style={{fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', margin: '0 0 1rem 0', lineHeight: 1.1}}>{bounty.title}</h1>
          <div style={{fontSize: '1.1rem', color: 'var(--text-main)', margin: '0 0 3rem 0', lineHeight: 1.6, maxWidth: '800px'}}><ReactMarkdown>{bounty.description}</ReactMarkdown></div>
          
          <hr style={{margin: '3rem 0', border: 0, borderTop: '1px solid var(--border)'}} />

          {/* Section 2: Scope */}
          <h2 style={{fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><TargetIcon/> Target Scope</h2>
          
          <h4 style={{color: '#10b981', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><CheckCircle size={18} /> In-Scope Attributes</h4>
          <div className="glass-panel" style={{padding: '1.5rem 2rem', borderLeft: '3px solid #10b981', marginBottom: '2rem'}}>
             {(bounty.domains || []).map((dom, i) => (
                 <div key={i} style={{background: 'rgba(16,185,129,0.1)', padding: '0.8rem 1rem', borderRadius: '4px', marginBottom: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem', color: '#10b981'}}>
                     <Globe size={16}/> {dom} <Copy size={14} style={{cursor:'pointer'}} onClick={()=>handleCopy(dom)}/>
                 </div>
             ))}
             <div style={{marginTop: '1.5rem', lineHeight: 1.6}}><ReactMarkdown>{bounty.in_scope || "*No specific in-scope directions provided.*"}</ReactMarkdown></div>
          </div>

          <h4 style={{color: '#ff2a5f', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><XCircle size={18} /> Out-of-Scope Targets</h4>
          <div className="glass-panel" style={{padding: '1.5rem 2rem', borderLeft: '3px solid #ff2a5f', marginBottom: '3rem', opacity: 0.8}}>
             <div style={{lineHeight: 1.6}}><ReactMarkdown>{bounty.out_of_scope || "*No out-of-scope parameters defined.*"}</ReactMarkdown></div>
          </div>

          {/* Section 3 & 4: Vulnerabilities */}
          <h2 style={{fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><ShieldAlert size={24}/> Vulnerability Classification</h2>
          <div style={{display: 'flex', gap: '2rem', marginBottom: '3rem'}}>
              <div style={{flex: 1}}>
                  <h4 style={{margin: '0 0 1rem 0', color: 'var(--text-muted)'}}>Accepted Validations</h4>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
                      {(bounty.allowed_vulns || []).length > 0 ? bounty.allowed_vulns.map(v => (
                         <span key={v} style={{background: 'var(--primary)', color: 'black', padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: 'bold'}}>{v}</span>
                      )) : <span style={{color: 'var(--text-muted)'}}>All vulnerabilities generally accepted.</span>}
                  </div>
              </div>
          </div>

          <hr style={{margin: '3rem 0', border: 0, borderTop: '1px solid var(--border)'}} />

          {/* Section 5: Rules & Policy */}
          <h2 style={{fontSize: '1.8rem', marginBottom: '1.5rem'}}>Rules & Legal Policy</h2>
          <div className="glass-panel" style={{padding: '2rem', marginBottom: '2rem', lineHeight: 1.6}}>
             <h4 style={{margin: '0 0 1rem 0', color: 'var(--primary)'}}>Rules of Engagement</h4>
             <ReactMarkdown>{bounty.rules || 'Follow standard hunting rules.'}</ReactMarkdown>
             <h4 style={{margin: '2rem 0 1rem 0', color: 'var(--primary)'}}>Safe Harbor Agreement</h4>
             <ReactMarkdown>{bounty.safe_harbor || 'Entities conducting localized testing will not face legal ramifications.'}</ReactMarkdown>
          </div>

          {/* Section 6: Submission Guidelines */}
          <h2 style={{fontSize: '1.8rem', marginBottom: '1.5rem'}}>Submission Guidelines</h2>
          <div className="glass-panel" style={{padding: '2rem', marginBottom: '3rem', lineHeight: 1.6}}>
             <ReactMarkdown>{bounty.guidelines || 'Provide a strictly reproducible Markdown-based Proof of Concept.'}</ReactMarkdown>
          </div>

          <hr style={{margin: '3rem 0', border: 0, borderTop: '1px solid var(--border)'}} />

          {/* Section 7: Rewards Detailed */}
          <h2 style={{fontSize: '1.8rem', marginBottom: '1.5rem'}}>Compensation Matrix</h2>
          <div className="glass-panel" style={{padding: '2rem', background: 'rgba(138,43,226,0.05)'}}>
              <p style={{color: 'var(--text-muted)', marginBottom: '2rem'}}>Smart contracts map vulnerabilities directly to the severity framework calculated during GenAI triage.</p>
              
              <div style={{display: 'flex', gap: '4rem'}}>
            <div>
              <div style={{color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem'}}>Base Deposit</div>
              <div className="text-gradient" style={{fontSize: '2.5rem', fontWeight: 'bold'}}>{formatCurrency(bounty.escrow_amount)}</div>
            </div>
            <div>
              <div style={{color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem'}}>Reward Model</div>
              <div style={{fontSize: '2.5rem', fontWeight: 'bold', color: 'white'}}>{bounty.reward_type} Asset</div>
            </div>
          </div>
                <div style={{background: 'rgba(250, 204, 21, 0.05)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(250, 204, 21, 0.2)'}}>
                <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.05)', paddingBottom:'1rem', marginBottom:'1rem'}}>
                    <span style={{color:'#ff2a5f', fontWeight:'bold'}}>CRITICAL</span>
                    <span style={{fontWeight:'bold'}}>{formatCurrency(bounty.reward_critical)}</span>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.05)', paddingBottom:'1rem', marginBottom:'1rem'}}>
                    <span style={{color:'#ff8f00', fontWeight:'bold'}}>HIGH</span>
                    <span style={{fontWeight:'bold'}}>{formatCurrency(bounty.reward_high)}</span>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.05)', paddingBottom:'1rem', marginBottom:'1rem'}}>
                    <span style={{color:'#facc15', fontWeight:'bold'}}>MEDIUM</span>
                    <span style={{fontWeight:'bold'}}>{formatCurrency(bounty.reward_medium)}</span>
                </div>
                <div style={{display:'flex', justifyContent:'space-between'}}>
                    <span style={{color:'#10b981', fontWeight:'bold'}}>LOW</span>
                    <span style={{fontWeight:'bold'}}>{formatCurrency(bounty.reward_low)}</span>
                </div>
            </div>
          </div>

          {/* Section 8: Timeline */}
          {bounty.timeline && (
              <>
                 <h2 style={{fontSize: '1.8rem', marginBottom: '1.5rem', marginTop: '3rem', display:'flex', alignItems:'center', gap:'0.5rem'}}><Calendar size={24}/> Response Timeline</h2>
                 <p style={{color: 'var(--text-main)', fontSize: '1.1rem'}}>{bounty.timeline}</p>
              </>
          )}

      </div>

      {/* Right Sticky Info Panel */}
      <div style={{width: '320px', padding: '3rem 2rem', background: 'var(--bg-card)', borderLeft: '1px solid var(--border)'}}>
           
           {/* Role-Based Action Flow */}
           <div style={{marginBottom: '3rem'}}>
               {role === 'researcher' ? (
                   bounty.is_active ? (
                       <Link to={`/bounty/${bounty.id}/submit`} style={{textDecoration: 'none'}}>
                           <button className="btn-primary" style={{width: '100%', padding: '1.2rem', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0, 240, 255, 0.4)'}}>
                               Submit Report
                           </button>
                       </Link>
                   ) : (
                       <div style={{background: 'rgba(255,42,95,0.1)', color: '#ff2a5f', padding: '1.2rem', textAlign: 'center', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,42,95,0.3)'}}>
                          This bounty is no longer accepting reports.
                       </div>
                   )
               ) : role === 'organization' ? (
                   isOwner ? (
                       <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                           <Link to={`/bounty/${bounty.id}/reports`} style={{textDecoration: 'none'}}>
                               <button className="btn-primary" style={{width: '100%', padding: '1.2rem', background: '#10b981', color: 'black'}}>
                                   Check Submitted Reports
                               </button>
                           </Link>
                           <button 
                               className="btn-secondary" 
                               style={{width: '100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem'}}
                               onClick={async () => {
                                   const amt = prompt("Enter ETH amount to deposit:");
                                   if(!amt) return;
                                   setIsProcessing(true);
                                   try {
                                       const provider = new ethers.BrowserProvider(window.ethereum);
                                       const signer = await provider.getSigner();
                                       await depositToEscrow(signer, bounty.contract_address, amt);
                                       alert("Funds deposited successfully!");
                                       window.location.reload();
                                   } catch(e) { alert(e.message); }
                                   setIsProcessing(false);
                               }}
                               disabled={isProcessing}
                           >
                               <Plus size={16}/> Add Funds to Escrow
                           </button>
                           {bounty.is_active && (
                               <button 
                                   className="btn-secondary" 
                                   style={{width: '100%', color:'#ff2a5f', border:'1px solid rgba(255,42,95,0.2)', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem'}}
                                   onClick={async () => {
                                       if(!confirm("Are you sure? This will refund remaining funds and CLOSE the program.")) return;
                                       setIsProcessing(true);
                                       try {
                                           const provider = new ethers.BrowserProvider(window.ethereum);
                                           const signer = await provider.getSigner();
                                           await closeEscrow(signer, bounty.contract_address);
                                           await supabase.from('bounties').update({ is_active: false }).eq('id', bounty.id);
                                           alert("Bounty Program Closed.");
                                           window.location.reload();
                                       } catch(e) { alert(e.message); }
                                       setIsProcessing(false);
                                   }}
                                   disabled={isProcessing}
                               >
                                   <XOctagon size={16}/> Finalize & Close
                               </button>
                           )}
                       </div>
                   ) : (
                       <div style={{background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '1.2rem', textAlign: 'center', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)'}}>
                          You are viewing this as an Organization. Triage is only available for your own bounty programs.
                       </div>
                   )
               ) : (
                   <div style={{background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '1.2rem', textAlign: 'center', borderRadius: 'var(--radius-sm)'}}>
                      Register as a Researcher to hunt for bugs in this program.
                   </div>
               )}
           </div>

           {/* Section 1: Org Info */}
           <div style={{marginBottom: '3rem'}}>
               <div style={{width: '64px', height: '64px', background: 'var(--primary)', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem'}}>
                   <Building2 size={32} color="black" />
               </div>
               <h3 style={{margin: '0 0 0.5rem 0'}}>{bounty.company_name}</h3>
               <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem'}}>Verified on-chain entity hosting trusted decentralized bounties.</p>
               <a href="#" style={{color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none'}}><Globe size={16}/> Visit Website</a>
           </div>

           {/* Section 2: Metadata */}
           <div style={{marginBottom: '3rem'}}>
               <h4 style={{margin: '0 0 1rem 0', color: 'var(--text-muted)'}}>Metadata</h4>
               <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.5rem'}}>
                   <span style={{color: 'var(--text-muted)'}}>Status</span> <span style={{color: bounty.is_active ? '#10b981' : '#ff2a5f'}}>{bounty.is_active ? 'Active' : 'Closed'}</span>
               </div>
               <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.5rem'}}>
                   <span style={{color: 'var(--text-muted)'}}>Created Date</span> <span>{new Date(bounty.created_at).toLocaleDateString()}</span>
               </div>
               <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.5rem'}}>
                   <span style={{color: 'var(--text-muted)'}}>Contract</span> 
                   <a href="#" style={{color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.3rem'}}>
                       {bounty.contract_address.slice(0,8)}... <ExternalLink size={14} />
                   </a>
               </div>
           </div>

           {/* Stats */}
           <div>
               <h4 style={{margin: '0 0 1rem 0', color: 'var(--text-muted)'}}>Historical Stats</h4>
               <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                   <span style={{color: 'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.4rem'}}><Activity size={14}/> Total Reports</span> <span>0</span>
               </div>
               <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                   <span style={{color: 'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.4rem'}}><Info size={14}/> Resolution</span> <span>100% Valid</span>
               </div>
           </div>
      </div>

    </div>
  );
}

// Quick Icon
const TargetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
