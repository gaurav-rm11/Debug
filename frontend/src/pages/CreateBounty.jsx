import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { 
  CheckCircle, ShieldCheck, Plus, X, Wallet, 
  Settings, Layers, Target, Coins, Shield, 
  Briefcase, Globe, Info, Zap, AlertCircle, Building2
} from 'lucide-react';
import { ethers } from 'ethers';
import { deployBountyEscrow } from '../lib/contractUtils';

export default function CreateBounty() {
  const { account, userProfile } = useAuth();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    company_name: userProfile?.name || '',
    description: 'Welcome to our bug bounty program. We are looking for vulnerabilities in our core infrastructure...',
    
    // Rewards
    reward_type: 'Fixed',
    min_reward: '0.05',
    max_reward: '5.0',
    reward_critical: '1.0',
    reward_high: '0.5',
    reward_medium: '0.1',
    reward_low: '0.01',
    
    // Scope
    domains: [],
    domainInput: '',
    in_scope: '## In Scope Targets\n- `*.debug-platform.io` (Main Infrastructure)\n- `api.debug-platform.io` (Public API)',
    out_of_scope: '## Out of Scope\n- Third-party SaaS providers\n- Social engineering/Phishing',
    allowed_vulns: ['XSS', 'SQL Injection', 'RCE'],
    
    // Policies
    rules: 'No automated scanners allowed. Please respect our rate limits.',
    policy: 'We will not initiate legal action against researchers who follow these guidelines.',
    safe_harbor: 'You are protected by our safe harbor policy if you report bugs responsibly.',
    
    // Guidelines
    guidelines: 'Please include detailed reproduction steps and a clear PoC script.',
    timeline: '3 Business Days',

    // Visibility
    visibility: 'public',
    invited_users_input: ''
  });

  const VULN_TYPES = ['XSS', 'SQL Injection', 'IDOR', 'CSRF', 'RCE', 'Authentication Bypass', 'Info Disclosure'];

  const handleUpdate = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addDomain = () => {
    if(!formData.domainInput) return;
    setFormData(prev => ({ ...prev, domains: [...prev.domains, prev.domainInput], domainInput: '' }));
  };

  const removeDomain = (idx) => {
    setFormData(prev => ({ ...prev, domains: prev.domains.filter((_, i) => i !== idx) }));
  };

  const toggleVuln = (v) => {
    if(formData.allowed_vulns.includes(v)) {
      setFormData(prev => ({ ...prev, allowed_vulns: formData.allowed_vulns.filter(val => val !== v) }));
    } else {
      setFormData(prev => ({ ...prev, allowed_vulns: [...formData.allowed_vulns, v] }));
    }
  };

  const handlePublish = async (status) => {
    if(!formData.title || !formData.company_name) {
        alert("Primary fields (Program Title, Company Name) are required.");
        return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (!window.ethereum) throw new Error("MetaMask is required for on-chain escrow deployment.");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      
      const signer = await provider.getSigner();
      const signerAddr = await signer.getAddress();
      const balance = await provider.getBalance(signerAddr);

      // We use 'reward_critical' as the initial escrow deposit
      const initialDeposit = formData.reward_critical || "0.1";
      const initialDepositWei = ethers.parseEther(initialDeposit.toString());
      
      if (balance < initialDepositWei && status === 'Active') {
          throw new Error(`Insufficient Balance. Required: ${initialDeposit} ETH. Available: ${ethers.formatEther(balance)} ETH.`);
      }

      let deployedAddress = "0x0000000000000000000000000000000000000000";
      if (status === 'Active') {
          deployedAddress = await deployBountyEscrow(signer, formData.title, initialDeposit);
      }

      const payload = {
          org_address: account,
          title: formData.title,
          company_name: formData.company_name,
          description: formData.description,
          escrow_amount: parseFloat(initialDeposit),
          contract_address: deployedAddress,
          is_active: status === 'Active',
          
          reward_type: formData.reward_type,
          min_reward: parseFloat(formData.min_reward) || 0,
          max_reward: parseFloat(formData.max_reward) || 0,
          reward_critical: parseFloat(formData.reward_critical) || 0,
          reward_high: parseFloat(formData.reward_high) || 0,
          reward_medium: parseFloat(formData.reward_medium) || 0,
          reward_low: parseFloat(formData.reward_low) || 0,
          
          domains: formData.domains,
          in_scope: formData.in_scope,
          out_of_scope: formData.out_of_scope,
          allowed_vulns: formData.allowed_vulns,
          
          rules: formData.rules,
          policy: formData.policy,
          safe_harbor: formData.safe_harbor,
          guidelines: formData.guidelines,
          timeline: formData.timeline,

          visibility: formData.visibility,
          invited_users: formData.invited_users_input.split(',').map(s => s.trim()).filter(s => s.length > 0)
      };

      const { error } = await supabase.from('bounties').insert([payload]);
      if(error) throw error;
      
      // Update Org Statistics
      await supabase.rpc('increment_bounty_count', { user_addr: account });

      alert(status === 'Active' ? `Bounty officially live on-chain!` : "Draft preserved.");
      navigate('/bounties');
    } catch(err) {
      console.error(err);
      alert(err.message || "Bounty deployment failed.");
    }
    
    setIsSubmitting(false);
  };

  return (
    <div style={{display: 'flex', minHeight: 'calc(100vh - 80px)', background: 'var(--bg-dark)'}}>
        
        {/* LEFT: ARCHITECT FORM */}
        <div style={{flex: 1, padding: '3.5rem 5rem', overflowY: 'auto', borderRight: '1px solid var(--border)', background: 'var(--bg-main)'}}>
            <div style={{marginBottom: '4rem'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
                    <div style={{width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <Layers size={22} color="black" />
                    </div>
                    <span style={{color: 'var(--primary)', fontWeight: 'bold', letterSpacing: '2px', fontSize: '0.8rem'}}>PROGRAM ARCHITECT</span>
                </div>
                <h1 className="text-gradient" style={{fontSize: '3.5rem', marginBottom: '1rem', letterSpacing: '-1.5px'}}>Design Your Program</h1>
                <p style={{color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '800px'}}>Define the security boundaries, reward tiers, and legal policies for your decentralized bug bounty.</p>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '3.5rem'}}>
                
                {/* Section 1: Core Identity */}
                <section className="glass-panel" style={{padding: '2.5rem', position: 'relative'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem'}}>
                        <Briefcase size={22} color="var(--primary)" />
                        <h3 style={{margin: 0, fontSize: '1.4rem'}}>1. Program Identity</h3>
                    </div>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
                        <div className="form-group">
                            <label>Program Public Title *</label>
                            <input type="text" className="input-field" value={formData.title} onChange={e=>handleUpdate('title', e.target.value)} placeholder="e.g. DeFi Core Protocol V2" />
                        </div>
                        <div className="form-group">
                            <label>Organization / Brand Name *</label>
                            <input type="text" className="input-field" value={formData.company_name} onChange={e=>handleUpdate('company_name', e.target.value)} placeholder="e.g. Acme Labs" />
                        </div>
                    </div>
                    <div className="form-group" style={{marginTop: '2rem'}}>
                        <label>Executive Summary (Markdown) *</label>
                        <textarea className="input-field" style={{minHeight: '140px', fontFamily: 'var(--font-mono)', fontSize: '0.95rem'}} value={formData.description} onChange={e=>handleUpdate('description', e.target.value)} placeholder="Introduce your project and security vision..." />
                    </div>
                </section>

                {/* Section 2: Financial Matrix */}
                <section className="glass-panel" style={{padding: '2.5rem'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem'}}>
                        <Coins size={22} color="#facc15" />
                        <h3 style={{margin: 0, fontSize: '1.4rem'}}>2. Financial Reward Matrix (ETH)</h3>
                    </div>
                    
                    <div style={{display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '2rem', marginBottom: '3rem'}}>
                         <div className="form-group">
                            <label>Payout Strategy</label>
                            <select className="input-field" value={formData.reward_type} onChange={e=>handleUpdate('reward_type', e.target.value)}>
                                <option value="Fixed">Fixed Severity (Standard)</option>
                                <option value="Range">Variable Range (Competitive)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Global Min ETH</label>
                            <input type="text" className="input-field" value={formData.min_reward} onChange={e=>handleUpdate('min_reward', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Global Max ETH</label>
                            <input type="text" className="input-field" value={formData.max_reward} onChange={e=>handleUpdate('max_reward', e.target.value)} />
                        </div>
                    </div>

                    <label style={{marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem'}}>
                        <Wallet size={18} color="var(--primary)" /> Severity-Based Escrow Targets
                    </label>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem'}}>
                        <div className="form-group"><label style={{color: '#ff2a5f', fontWeight: 'bold'}}>CRITICAL</label><input type="text" className="input-field" style={{fontSize: '1.1rem', fontFamily: 'var(--font-mono)'}} value={formData.reward_critical} onChange={e=>handleUpdate('reward_critical', e.target.value)} /></div>
                        <div className="form-group"><label style={{color: '#ff8f00', fontWeight: 'bold'}}>HIGH</label><input type="text" className="input-field" style={{fontSize: '1.1rem', fontFamily: 'var(--font-mono)'}} value={formData.reward_high} onChange={e=>handleUpdate('reward_high', e.target.value)} /></div>
                        <div className="form-group"><label style={{color: '#facc15', fontWeight: 'bold'}}>MEDIUM</label><input type="text" className="input-field" style={{fontSize: '1.1rem', fontFamily: 'var(--font-mono)'}} value={formData.reward_medium} onChange={e=>handleUpdate('reward_medium', e.target.value)} /></div>
                        <div className="form-group"><label style={{color: '#10b981', fontWeight: 'bold'}}>LOW</label><input type="text" className="input-field" style={{fontSize: '1.1rem', fontFamily: 'var(--font-mono)'}} value={formData.reward_low} onChange={e=>handleUpdate('reward_low', e.target.value)} /></div>
                    </div>
                </section>

                {/* Section 3: Technical Scope */}
                <section className="glass-panel" style={{padding: '2.5rem'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem'}}>
                        <ShieldCheck size={22} color="#10b981" />
                        <h3 style={{margin: 0, fontSize: '1.4rem'}}>3. Technical Scope Boundaries</h3>
                    </div>
                    
                    <div style={{marginBottom: '2.5rem'}}>
                        <label>Asset Register (Root Domains/Repos)</label>
                        <div style={{display: 'flex', gap: '1rem', marginBottom: '1.5rem'}}>
                            <input type="text" className="input-field" value={formData.domainInput} onChange={e=>handleUpdate('domainInput', e.target.value)} placeholder="api.site.com" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDomain())} />
                            <button className="btn-secondary" style={{padding: '0 2rem'}} onClick={(e) => { e.preventDefault(); addDomain(); }}>Add</button>
                        </div>
                        {formData.domains.length > 0 && (
                            <div style={{display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '2rem'}}>
                                {formData.domains.map((dom, i) => (
                                    <span key={i} style={{background: 'rgba(255,255,255,0.05)', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.8rem', border: '1px solid var(--border)'}}>
                                        {dom} <X size={16} style={{cursor: 'pointer', color: '#ff2a5f'}} onClick={()=>removeDomain(i)} />
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2.5rem'}}>
                        <div className="form-group">
                            <label>In-Scope Breakdown (Markdown)</label>
                            <textarea className="input-field" style={{minHeight: '120px', fontFamily: 'var(--font-mono)', fontSize: '0.9rem'}} value={formData.in_scope} onChange={e=>handleUpdate('in_scope', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Explicit Out-of-Scope (Markdown)</label>
                            <textarea className="input-field" style={{minHeight: '120px', fontFamily: 'var(--font-mono)', fontSize: '0.9rem'}} value={formData.out_of_scope} onChange={e=>handleUpdate('out_of_scope', e.target.value)} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{marginBottom: '1rem', display: 'block'}}>Primary Areas of Focus</label>
                        <div style={{display: 'flex', flexWrap: 'wrap', gap: '1rem'}}>
                            {VULN_TYPES.map(v => (
                                <button 
                                    key={v} 
                                    onClick={(e) => { e.preventDefault(); toggleVuln(v); }}
                                    className={formData.allowed_vulns.includes(v) ? 'btn-select-active' : 'btn-select-inactive'}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Section 4: Rules & Legal */}
                <section className="glass-panel" style={{padding: '2.5rem'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem'}}>
                        <Shield size={22} color="var(--primary)" />
                        <h3 style={{margin: 0, fontSize: '1.4rem'}}>4. Rules & Safe Harbor</h3>
                    </div>
                    <div className="form-group" style={{marginBottom: '2rem'}}>
                        <label>Rules of Engagement (Markdown)</label>
                        <textarea className="input-field" style={{minHeight: '100px', fontFamily: 'var(--font-mono)', fontSize: '0.9rem'}} value={formData.rules} onChange={e=>handleUpdate('rules', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Legal Policy & Safe Harbor Statement (Markdown)</label>
                        <textarea className="input-field" style={{minHeight: '100px', fontFamily: 'var(--font-mono)', fontSize: '0.9rem'}} value={formData.safe_harbor} onChange={e=>handleUpdate('safe_harbor', e.target.value)} />
                    </div>
                </section>

                {/* Section 5: Guidelines & Timeline */}
                <section className="glass-panel" style={{padding: '2.5rem'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem'}}>
                        <Zap size={22} color="var(--primary)" />
                        <h3 style={{margin: 0, fontSize: '1.4rem'}}>5. Submission & Response</h3>
                    </div>
                    <div className="form-group" style={{marginBottom: '2rem'}}>
                        <label>Submission Requirements (Markdown)</label>
                        <textarea className="input-field" style={{minHeight: '100px'}} value={formData.guidelines} onChange={e=>handleUpdate('guidelines', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Average Response Timeline</label>
                        <input type="text" className="input-field" value={formData.timeline} onChange={e=>handleUpdate('timeline', e.target.value)} placeholder="e.g. 48 Hours" />
                    </div>
                </section>
                
                {/* Section 6: Visibility Controls */}
                <section className="glass-panel" style={{padding: '2.5rem', border: '1px solid var(--primary-low)'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem'}}>
                        <Globe size={22} color="var(--primary)" />
                        <h3 style={{margin: 0, fontSize: '1.4rem'}}>6. Program Visibility & Access</h3>
                    </div>
                    <div className="form-group" style={{marginBottom: '2rem'}}>
                        <label>Access Type</label>
                        <div style={{display: 'flex', gap: '1rem'}}>
                            <button 
                                className={formData.visibility === 'public' ? 'btn-select-active' : 'btn-select-inactive'} 
                                onClick={(e) => { e.preventDefault(); handleUpdate('visibility', 'public'); }}
                                style={{flex: 1}}
                            >
                                Public Recruitment
                            </button>
                            <button 
                                className={formData.visibility === 'private' ? 'btn-select-active' : 'btn-select-inactive'} 
                                onClick={(e) => { e.preventDefault(); handleUpdate('visibility', 'private'); }}
                                style={{flex: 1}}
                            >
                                Private Invitation
                            </button>
                        </div>
                    </div>
                    {formData.visibility === 'private' && (
                        <div className="form-group">
                            <label>Researcher Whitelist (Wallet addresses, comma separated)</label>
                            <textarea 
                                className="input-field" 
                                style={{minHeight: '100px'}} 
                                value={formData.invited_users_input} 
                                onChange={e=>handleUpdate('invited_users_input', e.target.value)} 
                                placeholder="0xabc..., 0xdef..." 
                            />
                            <div style={{display:'flex', gap:'0.5rem', alignItems:'center', marginTop:'0.8rem', color:'var(--text-muted)', fontSize:'0.85rem'}}>
                                <Info size={14} /> Only these addresses will see the bounty program in their explorer.
                            </div>
                        </div>
                    )}
                </section>
            </div>
            
            <div style={{position: 'sticky', bottom: '0', background: 'rgba(5,6,8,0.98)', padding: '2.5rem 0', borderTop: '1px solid var(--border)', display: 'flex', gap: '1.5rem', marginTop: '5rem', zIndex: 50}}>
                <button className="btn-secondary" style={{flex: 1, padding: '1.4rem', fontSize: '1.1rem'}} onClick={() => handlePublish('Draft')} disabled={isSubmitting}>Save Program Draft</button>
                <button 
                    className="btn-primary" 
                    style={{flex: 2, padding: '1.4rem', fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem'}} 
                    onClick={() => handlePublish('Active')} 
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <><div className="loading-spinner" style={{width: '24px', height: '24px'}} /> DEPLOYING ESCROW...</>
                    ) : (
                        <><ShieldCheck size={24} /> PUBLISH & DEPLOY TO BLOCKCHAIN</>
                    )}
                </button>
            </div>
        </div>

        {/* RIGHT: LIVE DESIGN PREVIEW */}
        <div style={{width: '45%', padding: '4rem 5rem', overflowY: 'auto', background: 'var(--bg-card)', position: 'sticky', top: '70px', height: 'calc(100vh - 70px)'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2rem'}}>
                <div style={{width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981'}}></div>
                <span style={{fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', letterSpacing: '2px'}}>LIVE ARCHITECT PREVIEW</span>
            </div>
            
            <div style={{background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)'}}>
                <div style={{height: '180px', background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
                     <Shield size={64} color="black" style={{opacity: 0.2}} />
                     <div style={{position: 'absolute', bottom: '1.5rem', left: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem'}}>
                         <div style={{padding: '0.5rem 1rem', background: 'white', color: 'black', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 'bold'}}>
                            {formData.visibility.toUpperCase()}
                         </div>
                         <div style={{padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.3)', color: 'white', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.2)'}}>
                            ON-CHAIN ESCROW
                         </div>
                     </div>
                </div>
                
                <div style={{padding: '3rem'}}>
                    <h1 style={{fontSize: '3rem', margin: '0 0 1rem 0', letterSpacing: '-1px'}}>{formData.title || 'Untitled Program Architect'}</h1>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--text-muted)', marginBottom: '3rem'}}>
                        <Building2 size={20} color="var(--primary)" />
                        <span style={{fontSize: '1.1rem'}}>Hosted by <span style={{color: 'white', fontWeight: 'bold'}}>{formData.company_name || 'Acme Tech'}</span></span>
                    </div>

                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '4rem'}}>
                        <div style={{background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)'}}>
                            <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem'}}>Base Payout</div>
                            <div style={{fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary)'}}>{formData.min_reward} ETH</div>
                        </div>
                        <div style={{background: 'rgba(0, 240, 255, 0.05)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--primary-low)'}}>
                            <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem'}}>Max Potential</div>
                            <div style={{fontSize: '1.8rem', fontWeight: 'bold', color: 'white'}}>{formData.max_reward} ETH</div>
                        </div>
                    </div>

                    <div style={{marginBottom: '4rem'}}>
                        <h4 style={{fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem'}}>
                            <Target size={18} color="var(--primary)" /> Scope Focus
                        </h4>
                        <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.8rem'}}>
                            {formData.allowed_vulns.map(v => (
                                <span key={v} style={{padding: '0.5rem 1.2rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', border: '1px solid var(--border)'}}>
                                    {v}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div style={{borderTop: '1px solid var(--border)', paddingTop: '3rem'}}>
                        <h4 style={{fontSize: '1.1rem', marginBottom: '1.5rem'}}>Program Logic</h4>
                        <div className="preview-markdown" style={{color: 'var(--text-muted)', lineHeight: 1.8}}>
                            <ReactMarkdown>{formData.description}</ReactMarkdown>
                        </div>
                    </div>

                    <div style={{background: 'rgba(255,42,95,0.03)', padding: '2.5rem', borderRadius: '16px', marginTop: '4rem', border: '1px solid rgba(255,42,95,0.1)'}}>
                        <h4 style={{margin: '0 0 1.5rem 0', color: '#ff2a5f'}}>Payout Probability</h4>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '1.2rem'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between'}}><span style={{color: '#ff2a5f'}}>Critical Vuln</span> <span style={{fontWeight:'bold'}}>{formData.reward_critical} ETH</span></div>
                            <div style={{display: 'flex', justifyContent: 'space-between'}}><span style={{color: '#ff8f00'}}>High Persistence</span> <span style={{fontWeight:'bold'}}>{formData.reward_high} ETH</span></div>
                            <div style={{display: 'flex', justifyContent: 'space-between'}}><span style={{color: '#facc15'}}>Medium Risk</span> <span style={{fontWeight:'bold'}}>{formData.reward_medium} ETH</span></div>
                            <div style={{display: 'flex', justifyContent: 'space-between'}}><span style={{color: '#10b981'}}>Informational</span> <span style={{fontWeight:'bold'}}>{formData.reward_low} ETH</span></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style={{marginTop: '4rem', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', gap: '1.5rem', alignItems: 'center'}}>
                 <AlertCircle size={32} color="#facc15" />
                 <div>
                     <div style={{fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.2rem'}}>Smart Contract Integrity</div>
                     <p style={{margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)'}}>Deploying will lock the 'Critical' reward amount into the Escrow contract on-chain.</p>
                 </div>
            </div>
        </div>
    </div>
  );
}
