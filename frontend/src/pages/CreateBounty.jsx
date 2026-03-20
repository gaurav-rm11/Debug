import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { CheckCircle, ShieldCheck, Plus, X, Wallet } from 'lucide-react';
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
    description: 'Welcome to our bug bounty program...',
    
    // Rewards
    reward_type: 'Fixed',
    min_reward: '',
    max_reward: '',
    reward_critical: '',
    reward_high: '',
    reward_medium: '',
    reward_low: '',
    
    // Scope
    domains: [],
    domainInput: '',
    in_scope: '## In Scope\n- *.example.com\n- API Endpoints',
    out_of_scope: '## Out of Scope\n- Third-party services',
    allowed_vulns: [],
    
    // Policies
    rules: 'Follow strictly responsible disclosure guidelines.',
    policy: 'We will not pursue legal action if you follow these rules.',
    safe_harbor: 'You are granted safe harbor for research.',
    
    // Guidelines
    guidelines: 'Please provide a clear Proof of Concept (PoC).',
    timeline: 'We aim to respond within 3 business days.',

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
      setFormData(prev => ({ ...prev, allowed_vulns: prev.allowed_vulns.filter(val => val !== v) }));
    } else {
      setFormData(prev => ({ ...prev, allowed_vulns: [...prev.allowed_vulns, v] }));
    }
  };

  const handlePublish = async (status) => {
    if(!formData.title || !formData.company_name) {
        alert("Please fill out the required Program Name and Company Name.");
        return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 1. Validate Provider & Network
      if (!window.ethereum) throw new Error("MetaMask not found. Please install it to deploy bounties.");
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      const network = await provider.getNetwork();
      console.log("Connected to Network:", network.chainId.toString());
      if (network.chainId !== 1337n && network.chainId !== 31337n) {
          // Warning if not on Localhost (adjust if you're using a different testnet)
          console.warn("Chain ID is not a standard Localhost ID. Ensure MetaMask points to your Hardhat node.");
      }

      const signer = await provider.getSigner();
      const signerAddr = await signer.getAddress();
      console.log("Deploying with Signer:", signerAddr);

      // Check balance before deployment
      const balance = await provider.getBalance(signerAddr);
      console.log("Current Balance:", ethers.formatEther(balance), "ETH");

      // 2. Real contract deployment
      const initialDeposit = formData.reward_critical || "0.01";
      const initialDepositWei = ethers.parseEther(initialDeposit.toString());
      console.log("Initial Deposit Wei:", initialDepositWei.toString());
      
      if (balance < initialDepositWei) {
          throw new Error(`Insufficient funds: You have ${ethers.formatEther(balance)} ETH but need at least ${initialDeposit} ETH plus gas.`);
      }

      let deployedAddress = "";
      if (status === 'Active') {
          console.log("Calling deployBountyEscrow...");
          deployedAddress = await deployBountyEscrow(signer, formData.title, initialDeposit);
          console.log("Deployed successfully at:", deployedAddress);
      } else {
          deployedAddress = "0x0000000000000000000000000000000000000000";
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

      const { data, error } = await supabase.from('bounties').insert([payload]).select();
      if(error) throw error;
      
      alert(status === 'Active' ? `Bounty deployed successfully at ${deployedAddress}` : "Draft saved.");
      navigate('/bounties');
    } catch(err) {
      console.error("FULL DEPLOYMENT ERROR OBJECT:", err);
      
      let msg = err.message || "Failed to create bounty.";
      if (err.code === -32603) {
          msg = "MetaMask Internal Error (-32603). This is usually caused by a 'Nonce Mismatch' if you recently restarted your Hardhat node. \n\nFIX: Go to MetaMask -> Settings -> Advanced -> Clear Activity Tab Data (Reset Account).";
      } else if (err.message.includes("reverted")) {
          msg = "Transaction Reverted: The contract deployment failed on-chain. Check if your account has enough ETH or if you're on the correct network.";
      }
      
      alert(msg);
    }
    
    setIsSubmitting(false);
  };

  return (
    <div style={{display: 'flex', minHeight: 'calc(100vh - 80px)'}}>
        {/* Left Side: Creation Form */}
        <div style={{flex: 1, padding: '3rem 4rem', overflowY: 'auto', borderRight: '1px solid var(--border)', background: 'var(--bg-dark)'}}>
            <h1 className="text-gradient" style={{marginTop: 0, marginBottom: '0.5rem'}}>Architect Bug Bounty</h1>
            <p className="feature-desc" style={{marginBottom: '3rem'}}>Construct the rules, scope, and reward matrices for your new decentralized program.</p>

            <div style={{display: 'flex', flexDirection: 'column', gap: '3rem'}}>
                {/* Section 1 */}
                <section>
                    <h3 style={{borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem'}}><span style={{color:'var(--primary)'}}>1.</span> Basic Information</h3>
                    <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem'}}>
                        <div style={{flex: 1}}>
                            <label>Program Title *</label>
                            <input type="text" className="input-field" value={formData.title} onChange={e=>handleUpdate('title', e.target.value)} placeholder="e.g. Core Protocol V3 Bounty" />
                        </div>
                        <div style={{flex: 1}}>
                            <label>Company Name *</label>
                            <input type="text" className="input-field" value={formData.company_name} onChange={e=>handleUpdate('company_name', e.target.value)} />
                        </div>
                    </div>
                    <label>Executive Summary (Markdown) *</label>
                    <textarea className="input-field" style={{minHeight: '120px'}} value={formData.description} onChange={e=>handleUpdate('description', e.target.value)} placeholder="High-level overview of your platform..." />
                </section>

                {/* Section 2 */}
                <section>
                    <h3 style={{borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem'}}><span style={{color:'var(--primary)'}}>2.</span> Rewards Engine (ETH)</h3>
                    
                    <div style={{display: 'flex', gap: '1rem', marginBottom: '1.5rem'}}>
                         <div style={{flex: 1}}>
                            <label>Reward Type</label>
                            <select className="input-field" value={formData.reward_type} onChange={e=>handleUpdate('reward_type', e.target.value)}>
                                <option value="Fixed">Fixed Severity</option>
                                <option value="Range">Variable Range</option>
                            </select>
                        </div>
                        <div style={{flex: 1}}>
                            <label>Min Payout</label>
                            <input type="number" className="input-field" value={formData.min_reward} onChange={e=>handleUpdate('min_reward', e.target.value)} placeholder="0.05" />
                        </div>
                        <div style={{flex: 1}}>
                            <label>Max Payout</label>
                            <input type="number" className="input-field" value={formData.max_reward} onChange={e=>handleUpdate('max_reward', e.target.value)} placeholder="10.0" />
                        </div>
                    </div>

                    <label style={{marginBottom: '1rem', display: 'block'}}>Severity Smart Contract Allocations</label>
                    <div style={{display: 'flex', gap: '1rem'}}>
                        <div style={{flex: 1}}><label style={{fontSize: '0.8rem', color: '#ff2a5f'}}>Critical</label><input type="number" className="input-field" value={formData.reward_critical} onChange={e=>handleUpdate('reward_critical', e.target.value)} placeholder="10.0"/></div>
                        <div style={{flex: 1}}><label style={{fontSize: '0.8rem', color: '#ff8f00'}}>High</label><input type="number" className="input-field" value={formData.reward_high} onChange={e=>handleUpdate('reward_high', e.target.value)} placeholder="5.0"/></div>
                        <div style={{flex: 1}}><label style={{fontSize: '0.8rem', color: '#facc15'}}>Medium</label><input type="number" className="input-field" value={formData.reward_medium} onChange={e=>handleUpdate('reward_medium', e.target.value)} placeholder="1.0"/></div>
                        <div style={{flex: 1}}><label style={{fontSize: '0.8rem', color: '#10b981'}}>Low</label><input type="number" className="input-field" value={formData.reward_low} onChange={e=>handleUpdate('reward_low', e.target.value)} placeholder="0.1"/></div>
                    </div>
                </section>

                {/* Section 3 */}
                <section>
                    <h3 style={{borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem'}}><span style={{color:'var(--primary)'}}>3.</span> Targeted Scope</h3>
                    
                    <label>Domains & Assets</label>
                    <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem'}}>
                        <input type="text" className="input-field" value={formData.domainInput} onChange={e=>handleUpdate('domainInput', e.target.value)} placeholder="api.company.com" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDomain())} />
                        <button className="btn-secondary" onClick={(e) => { e.preventDefault(); addDomain(); }}>Add Asset</button>
                    </div>
                    {formData.domains.length > 0 && (
                        <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem'}}>
                            {formData.domains.map((dom, i) => (
                                <span key={i} style={{background: 'rgba(255,255,255,0.1)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                    {dom} <X size={14} style={{cursor: 'pointer'}} onClick={()=>removeDomain(i)} />
                                </span>
                            ))}
                        </div>
                    )}

                    <div style={{display: 'flex', gap: '1rem', marginBottom: '1.5rem'}}>
                        <div style={{flex: 1}}>
                            <label>In-Scope (Markdown)</label>
                            <textarea className="input-field" style={{minHeight: '100px'}} value={formData.in_scope} onChange={e=>handleUpdate('in_scope', e.target.value)} />
                        </div>
                        <div style={{flex: 1}}>
                            <label>Out-of-Scope (Markdown)</label>
                            <textarea className="input-field" style={{minHeight: '100px'}} value={formData.out_of_scope} onChange={e=>handleUpdate('out_of_scope', e.target.value)} />
                        </div>
                    </div>

                    <label style={{marginBottom: '0.5rem', display: 'block'}}>Allowed Vulnerabilities</label>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.8rem'}}>
                        {VULN_TYPES.map(v => (
                            <button 
                                key={v} 
                                onClick={(e) => { e.preventDefault(); toggleVuln(v); }}
                                className={formData.allowed_vulns.includes(v) ? 'btn-primary' : 'btn-secondary'}
                                style={{padding: '0.4rem 1rem', fontSize: '0.85rem', borderRadius: 'var(--radius-full)'}}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Section 4 */}
                <section>
                    <h3 style={{borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem'}}><span style={{color:'var(--primary)'}}>4.</span> Rules & Legal Policy</h3>
                    <label>Rules (Markdown)</label>
                    <textarea className="input-field" style={{minHeight: '80px', marginBottom: '1rem'}} value={formData.rules} onChange={e=>handleUpdate('rules', e.target.value)} />
                    <label>Legal Safe Harbor (Markdown)</label>
                    <textarea className="input-field" style={{minHeight: '80px', marginBottom: '1rem'}} value={formData.safe_harbor} onChange={e=>handleUpdate('safe_harbor', e.target.value)} />
                </section>

                {/* Section 5 */}
                <section>
                    <h3 style={{borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem'}}><span style={{color:'var(--primary)'}}>5.</span> Submission Guidelines</h3>
                    <label>Requirements (Markdown)</label>
                    <textarea className="input-field" style={{minHeight: '80px', marginBottom: '1rem'}} value={formData.guidelines} onChange={e=>handleUpdate('guidelines', e.target.value)} />
                    <label>Response Timeline</label>
                    <input type="text" className="input-field" value={formData.timeline} onChange={e=>handleUpdate('timeline', e.target.value)} placeholder="e.g. 5 business days" />
                </section>
                
                {/* Section 6 */}
                <section>
                    <h3 style={{borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem'}}><span style={{color:'var(--primary)'}}>6.</span> Program Visibility</h3>
                    <div style={{display: 'flex', gap: '2rem', marginBottom: '1.5rem'}}>
                        <div style={{flex: 1}}>
                            <label>Visibility Status</label>
                            <select className="input-field" value={formData.visibility} onChange={e=>handleUpdate('visibility', e.target.value)}>
                                <option value="public">Public (Visible to everyone)</option>
                                <option value="private">Private (Invite-only)</option>
                            </select>
                        </div>
                    </div>
                    {formData.visibility === 'private' && (
                        <div>
                            <label>Invited Researchers (Comma separated wallet addresses)</label>
                            <textarea 
                                className="input-field" 
                                style={{minHeight: '80px'}} 
                                value={formData.invited_users_input} 
                                onChange={e=>handleUpdate('invited_users_input', e.target.value)} 
                                placeholder="0x123..., 0x456..." 
                            />
                            <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem'}}>Only these users will be able to see and submit to this bounty.</p>
                        </div>
                    )}
                </section>
            </div>
            
            <div style={{position: 'sticky', bottom: '0', background: 'rgba(5,6,8,0.95)', padding: '1.5rem 0', borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem', marginTop: '4rem'}}>
                <button className="btn-secondary" style={{flex: 1, padding: '1.2rem'}} onClick={() => handlePublish('Draft')} disabled={isSubmitting}>Save as Draft</button>
                <button className="btn-primary" style={{flex: 2, padding: '1.2rem'}} onClick={() => handlePublish('Active')} disabled={isSubmitting}>
                    {isSubmitting ? 'Deploying to Chain...' : 'Publish Bounty Program'}
                </button>
            </div>
        </div>

        {/* Right Side: Live Interactive Preview */}
        <div style={{flex: 1, padding: '3rem 4rem', overflowY: 'auto', background: 'var(--bg-card)'}}>
            <div style={{background: 'rgba(0, 240, 255, 0.1)', display: 'inline-block', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-full)', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '1rem'}}>
                 Live Preview
            </div>
            <h1 style={{fontSize: '2.5rem', margin: '0 0 0.5rem 0', lineHeight: 1.1}}>{formData.title || 'Program Name'}</h1>
            <p style={{fontSize: '1.1rem', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem'}}>
                <ShieldCheck size={18} /> Hosted by {formData.company_name || 'Organization Name'}
            </p>

            <div style={{background: 'rgba(255,255,255,0.02)', padding: '2rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem'}}>
                    <div>
                        <div style={{color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Reward Structure</div>
                        <div className="text-gradient" style={{fontSize: '2rem', fontWeight: 'bold'}}>{formData.reward_type}</div>
                    </div>
                    <div style={{textAlign: 'right'}}>
                         <div style={{color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Max Reward</div>
                         <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)'}}>{formData.max_reward || formData.reward_critical || '0'} ETH</div>
                    </div>
                </div>

                <h4 style={{color: 'var(--text-muted)'}}>Executive Summary</h4>
                <div style={{marginBottom: '2rem', lineHeight: 1.6}}><ReactMarkdown>{formData.description}</ReactMarkdown></div>

                <h4 style={{color: 'var(--text-muted)'}}>In-Scope Targets</h4>
                <div style={{marginBottom: '2rem', color: '#10b981'}}><ReactMarkdown>{formData.in_scope}</ReactMarkdown></div>
                
                <h4 style={{color: 'var(--text-muted)'}}>Allowed Vulnerability Types</h4>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem'}}>
                    {formData.allowed_vulns.length === 0 ? <span style={{opacity:0.5}}>No selections yet</span> : formData.allowed_vulns.map(v => (
                        <span key={v} style={{background: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem'}}>{v}</span>
                    ))}
                </div>

                <div style={{background: 'rgba(250, 204, 21, 0.05)', padding: '1.5rem', borderRadius: '4px', marginTop: '2rem'}}>
                    <h4 style={{margin: '0 0 1rem 0', color: '#facc15'}}>Payout Matrix</h4>
                    <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.5rem'}}><span style={{color:'#ff2a5f'}}>Critical</span> <span>{formData.reward_critical || '0'} ETH</span></div>
                    <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.5rem'}}><span style={{color:'#ff8f00'}}>High</span> <span>{formData.reward_high || '0'} ETH</span></div>
                    <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.5rem'}}><span style={{color:'#facc15'}}>Medium</span> <span>{formData.reward_medium || '0'} ETH</span></div>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}><span style={{color:'#10b981'}}>Low</span> <span>{formData.reward_low || '0'} ETH</span></div>
                </div>
            </div>
        </div>
    </div>
  );
}
