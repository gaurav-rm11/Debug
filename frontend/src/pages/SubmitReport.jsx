import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import { Shield, LayoutDashboard, FileText, Trophy, Settings, Building2, Globe, Activity, Upload, Eye, CheckCircle } from 'lucide-react';

const LeftSidebar = () => (
   <div style={{width: '240px', borderRight: '1px solid var(--border)', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-dark)', height: '100vh', position:'sticky', top:0, overflowY:'auto'}}>
      <div style={{color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing:'1px', marginBottom: '1rem', paddingLeft: '1rem'}}>Researcher Navigation</div>
      <Link to="/bounties" style={{textDecoration:'none'}}><button className="btn-secondary" style={{width:'100%', textAlign:'left', background:'transparent', border:'none', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.8rem', padding:'0.8rem 1rem'}}><LayoutDashboard size={18}/> Dashboard</button></Link>
      <button className="btn-secondary" style={{textAlign:'left', background:'transparent', border:'none', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.8rem', padding:'0.8rem 1rem'}}><FileText size={18}/> My Reports</button>
      <Link to="/bounties" style={{textDecoration:'none'}}><button className="btn-secondary" style={{width:'100%', textAlign:'left', background:'rgba(0,240,255,0.1)', border:'1px solid var(--primary)', color:'var(--primary)', display:'flex', alignItems:'center', gap:'0.8rem', padding:'0.8rem 1rem'}}><Shield size={18}/> Bounties</button></Link>
      <button className="btn-secondary" style={{textAlign:'left', background:'transparent', border:'none', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.8rem', padding:'0.8rem 1rem'}}><Trophy size={18}/> Leaderboard</button>
      <Link to="/profile" style={{textDecoration:'none'}}><button className="btn-secondary" style={{width:'100%', textAlign:'left', background:'transparent', border:'none', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.8rem', padding:'0.8rem 1rem'}}><Settings size={18}/> Settings</button></Link>
   </div>
);

export default function SubmitReport() {
  const { id } = useParams();
  const { account } = useAuth();
  const navigate = useNavigate();
  
  const [bounty, setBounty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Section 1: Target Info
  const [asset, setAsset] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [httpMethod, setHttpMethod] = useState('GET');
  const [environment, setEnvironment] = useState('Production');

  // Section 2: Vulnerability Details
  const [weaknessType, setWeaknessType] = useState('Cross-Site Scripting (XSS)');
  
  // Section 3: Access
  const [authRequired, setAuthRequired] = useState('No');
  const [userRole, setUserRole] = useState('None');
  const [reproducibility, setReproducibility] = useState('Always');

  // Section 4: CVSS
  const [cvss, setCvss] = useState({ AV: 'N', AC: 'L', PR: 'N', UI: 'N', S: 'U', C: 'L', I: 'L', A: 'N' });
  const [cvssScore, setCvssScore] = useState(5.3); // Mock score

  // Section 6: PoC
  const [reportTitle, setReportTitle] = useState('');
  const [description, setDescription] = useState('Provide a high-level summary of the vulnerability...');
  const [steps, setSteps] = useState('1. Navigate to...\n2. Input payload...\n3. Observe execution...');
  const [payload, setPayload] = useState('<script>alert("XSS")</script>');
  const [impact, setImpact] = useState('An attacker can hijack user sessions...');
  const [previewMode, setPreviewMode] = useState(false);

  // Section 8: Additional
  const [sensitiveData, setSensitiveData] = useState('No');
  
  // Dynamic UI state
  const cvssVector = `CVSS:3.1/AV:${cvss.AV}/AC:${cvss.AC}/PR:${cvss.PR}/UI:${cvss.UI}/S:${cvss.S}/C:${cvss.C}/I:${cvss.I}/A:${cvss.A}`;

  useEffect(() => {
    async function load() {
      if(!id) return;
      try {
          const { data, error } = await supabase.from('bounties').select('*').eq('id', id).single();
          if(data) {
              setBounty(data);
              if(data.domains && data.domains.length > 0) setAsset(data.domains[0]);
          }
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [id]);

  const handleSubmit = async () => {
    if(!reportTitle || !description || !steps) return alert("Please fill out the necessary Proof of Concept fields.");
    setIsSubmitting(true);
    
    // 1. Prepare Report Payload
    const payloadData = {
        bounty_id: id,
        researcher_address: account,
        org_address: bounty.org_address, // CRITICAL: Link to organization for triage views
        report_desc: `${reportTitle}\n\n${description}`, 
        claimed_severity: cvssScore >= 9.0 ? 'Critical' : cvssScore >= 7.0 ? 'High' : cvssScore >= 4.0 ? 'Medium' : 'Low',
        status: 'submitted' // New schema status
    };

    try {
        // 2. Persist Report
        const { data: reportData, error: reportError } = await supabase.from('reports').insert([payloadData]).select().single();
        if(reportError) throw reportError;

        // 3. Notify Organization
        await supabase.from('notifications').insert([{
            user_id: bounty.org_address,
            type: 'new_report',
            message: `New vulnerability report submitted for ${bounty.title}`,
            bounty_id: id,
            report_id: reportData.id,
            is_read: false
        }]);

        alert("Report submitted successfully! The organization has been notified.");
        navigate(`/bounty/${id}`);
    } catch(err) {
        console.error(err);
        alert("Submission failed: " + (err.message || "Check network."));
        setIsSubmitting(false);
    }
  };

  if(loading || !bounty) return <div className="container" style={{padding: '4rem 0', color: 'var(--text-muted)'}}>Loading Target Acquisition System... If you are stuck here, ensure the Bounty ID is correct.</div>;

  return (
    <div style={{display: 'flex', minHeight: 'calc(100vh - 80px)'}}>
        
      {/* 1. Left Sidebar Navigation */}
      <LeftSidebar />

      {/* 2. Main Center Content: Report Form */}
      <div style={{flex: 1, padding: '3rem', overflowY: 'auto', background: 'var(--bg-main)'}}>
          
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
              <div>
                  <h1 className="text-gradient" style={{margin: '0 0 0.5rem 0'}}>Submit Vulnerability Report</h1>
                  <p style={{color: 'var(--text-muted)', margin: 0}}>Targeting: <span style={{color:'white', fontWeight:'bold'}}>{bounty.title}</span></p>
              </div>
              <button className="btn-secondary" style={{display:'flex', alignItems:'center', gap:'0.5rem'}} onClick={()=>setPreviewMode(!previewMode)}>
                  <Eye size={16}/> {previewMode ? 'Return to Editor' : 'Toggle Live Preview'}
              </button>
          </div>

          {!previewMode ? (
              <div style={{display: 'flex', flexDirection: 'column', gap: '3rem'}}>
                  
                  {/* Section 1: Target Info */}
                  <section className="glass-panel" style={{padding: '2rem'}}>
                      <h3 style={{borderBottom: '1px solid var(--border)', paddingBottom: '0.8rem', margin: '0 0 1.5rem 0', color: 'var(--primary)'}}>1. Target Information</h3>
                      <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem'}}>
                          <div style={{flex: 1}}>
                              <label>Select Asset / Domain *</label>
                              <select className="input-field" value={asset} onChange={e=>setAsset(e.target.value)}>
                                 {(bounty.domains || []).length > 0 ? bounty.domains.map(d => <option key={d} value={d}>{d}</option>) : <option value="Other">External/Other</option>}
                              </select>
                          </div>
                          <div style={{flex: 2}}>
                              <label>Affected URL / Endpoint *</label>
                              <input type="text" className="input-field" value={endpoint} onChange={e=>setEndpoint(e.target.value)} placeholder="https://api.example.com/v1/users" />
                          </div>
                      </div>
                      <div style={{display: 'flex', gap: '1rem'}}>
                          <div style={{flex: 1}}>
                              <label>HTTP Method</label>
                              <select className="input-field" value={httpMethod} onChange={e=>setHttpMethod(e.target.value)}>
                                  <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option><option>PATCH</option>
                              </select>
                          </div>
                          <div style={{flex: 1}}>
                              <label>Environment</label>
                              <select className="input-field" value={environment} onChange={e=>setEnvironment(e.target.value)}>
                                  <option>Production</option><option>Staging</option><option>Development</option>
                              </select>
                          </div>
                      </div>
                  </section>

                  {/* Section 2 & 3: Details & Access */}
                  <div style={{display: 'flex', gap: '2rem'}}>
                      <section className="glass-panel" style={{padding: '2rem', flex: 1}}>
                          <h3 style={{borderBottom: '1px solid var(--border)', paddingBottom: '0.8rem', margin: '0 0 1.5rem 0', color: 'var(--primary)'}}>2. Vulnerability Details</h3>
                          <label>Weakness Type *</label>
                          <select className="input-field" value={weaknessType} onChange={e=>setWeaknessType(e.target.value)}>
                              {['Cross-Site Scripting (XSS)', 'SQL Injection', 'Insecure Direct Object Reference (IDOR)', 'Cross-Site Request Forgery (CSRF)', 'Remote Code Execution (RCE)'].map(w => (
                                  <option key={w} value={w}>{w}</option>
                              ))}
                          </select>
                          <div style={{background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '4px', marginTop: '1rem', borderLeft: '3px solid var(--primary)'}}>
                              <p style={{margin: 0, fontSize: '0.9rem', color: 'white'}}><strong>CWE-79</strong></p>
                              <p style={{margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)'}}>Improper Neutralization of Input During Web Page Generation.</p>
                          </div>
                      </section>

                      <section className="glass-panel" style={{padding: '2rem', flex: 1}}>
                          <h3 style={{borderBottom: '1px solid var(--border)', paddingBottom: '0.8rem', margin: '0 0 1.5rem 0', color: 'var(--primary)'}}>3. Access Required</h3>
                          <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem'}}>
                              <div style={{flex: 1}}>
                                  <label>Auth Required</label>
                                  <select className="input-field" value={authRequired} onChange={e=>setAuthRequired(e.target.value)}><option>Yes</option><option>No</option></select>
                              </div>
                              <div style={{flex: 1}}>
                                  <label>User Role</label>
                                  <select className="input-field" value={userRole} onChange={e=>setUserRole(e.target.value)}><option>None</option><option>Standard User</option><option>Admin</option></select>
                              </div>
                          </div>
                          <label>Reproducibility</label>
                          <select className="input-field" value={reproducibility} onChange={e=>setReproducibility(e.target.value)}>
                              <option>Always</option><option>Sometimes</option><option>Rarely</option>
                          </select>
                      </section>
                  </div>

                  {/* Section 4 & 5: Severity & Impact Summary */}
                  <section className="glass-panel" style={{padding: '2rem'}}>
                      <h3 style={{borderBottom: '1px solid var(--border)', paddingBottom: '0.8rem', margin: '0 0 1.5rem 0', color: 'var(--primary)', display:'flex', justifyContent:'space-between'}}>
                          <span>4. Severity (CVSS 3.1)</span>
                          <span style={{color: 'white', background: '#ff8f00', padding: '0.2rem 0.8rem', borderRadius: '12px', fontSize: '0.9rem'}}>Score: {cvssScore} / High</span>
                      </h3>
                      <p style={{color: 'var(--primary)', fontFamily: 'monospace', letterSpacing: '1px', padding: '0.8rem', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', textAlign: 'center'}}>{cvssVector}</p>
                      
                      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem'}}>
                          <div>
                              <h5 style={{color: 'var(--text-muted)', marginBottom:'0.5rem'}}>Base Metrics</h5>
                              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom:'0.5rem'}}><label>Attack Vector</label><select className="input-field" style={{width:'50%', padding:'0.4rem'}} value={cvss.AV} onChange={e=>setCvss({...cvss, AV: e.target.value})}><option value="N">Network</option><option value="A">Adjacent</option></select></div>
                              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom:'0.5rem'}}><label>Attack Complexity</label><select className="input-field" style={{width:'50%', padding:'0.4rem'}} value={cvss.AC} onChange={e=>setCvss({...cvss, AC: e.target.value})}><option value="L">Low</option><option value="H">High</option></select></div>
                              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom:'0.5rem'}}><label>Privileges Required</label><select className="input-field" style={{width:'50%', padding:'0.4rem'}} value={cvss.PR} onChange={e=>setCvss({...cvss, PR: e.target.value})}><option value="N">None</option><option value="L">Low</option></select></div>
                              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom:'0.5rem'}}><label>User Interaction</label><select className="input-field" style={{width:'50%', padding:'0.4rem'}} value={cvss.UI} onChange={e=>setCvss({...cvss, UI: e.target.value})}><option value="N">None</option><option value="R">Required</option></select></div>
                          </div>
                          <div>
                              <h5 style={{color: 'var(--text-muted)', marginBottom:'0.5rem'}}>Impact Metrics</h5>
                              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom:'0.5rem'}}><label>Confidentiality</label><select className="input-field" style={{width:'50%', padding:'0.4rem'}} value={cvss.C} onChange={e=>setCvss({...cvss, C: e.target.value})}><option value="N">None</option><option value="L">Low</option><option value="H">High</option></select></div>
                              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom:'0.5rem'}}><label>Integrity</label><select className="input-field" style={{width:'50%', padding:'0.4rem'}} value={cvss.I} onChange={e=>setCvss({...cvss, I: e.target.value})}><option value="N">None</option><option value="L">Low</option><option value="H">High</option></select></div>
                              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom:'0.5rem'}}><label>Availability</label><select className="input-field" style={{width:'50%', padding:'0.4rem'}} value={cvss.A} onChange={e=>setCvss({...cvss, A: e.target.value})}><option value="N">None</option><option value="L">Low</option><option value="H">High</option></select></div>
                          </div>
                      </div>
                  </section>

                  {/* Section 6: Proof of Concept */}
                  <section className="glass-panel" style={{padding: '2rem'}}>
                      <h3 style={{borderBottom: '1px solid var(--border)', paddingBottom: '0.8rem', margin: '0 0 1.5rem 0', color: 'var(--primary)'}}>6. Proof of Concept</h3>
                      <label>Report Title *</label>
                      <input type="text" className="input-field" value={reportTitle} onChange={e=>setReportTitle(e.target.value)} placeholder="Stored XSS in User Profile via Bio Field" style={{marginBottom: '1rem'}} />
                      
                      <label>Summary Description (Markdown) *</label>
                      <textarea className="input-field" style={{minHeight: '100px', marginBottom: '1rem'}} value={description} onChange={e=>setDescription(e.target.value)} />
                      
                      <label>Steps to Reproduce (Markdown) *</label>
                      <textarea className="input-field" style={{minHeight: '150px', marginBottom: '1rem'}} value={steps} onChange={e=>setSteps(e.target.value)} />

                      <label>Payload Used (Optional)</label>
                      <textarea className="input-field" style={{minHeight: '60px', fontFamily: 'monospace', marginBottom: '1rem'}} value={payload} onChange={e=>setPayload(e.target.value)} />
                      
                      <label>Impact & Remediation (Markdown) *</label>
                      <textarea className="input-field" style={{minHeight: '100px'}} value={impact} onChange={e=>setImpact(e.target.value)} />
                  </section>

                  {/* Section 7 & 8: Attachments & Additional Info */}
                  <div style={{display: 'flex', gap: '2rem'}}>
                      <section className="glass-panel" style={{padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)'}}>
                          <Upload size={32} color="var(--primary)" style={{marginBottom: '1rem'}} />
                          <h4 style={{margin: '0 0 0.5rem 0'}}>Section 7: Attachments</h4>
                          <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center'}}>Drag and drop Images, Videos, or HAR files here.</p>
                          <button className="btn-secondary" style={{marginTop: '1rem'}}>Browse Files</button>
                      </section>

                      <section className="glass-panel" style={{padding: '2rem', flex: 1}}>
                          <h3 style={{borderBottom: '1px solid var(--border)', paddingBottom: '0.8rem', margin: '0 0 1.5rem 0', color: 'var(--primary)'}}>8. Additional Info</h3>
                          <label style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
                              Sensitive PII Data Included?
                              <select className="input-field" style={{width: 'auto', padding:'0.4rem'}} value={sensitiveData} onChange={e=>setSensitiveData(e.target.value)}><option>No</option><option>Yes</option></select>
                          </label>
                          <label>Collaborator Emails</label>
                          <input type="text" className="input-field" placeholder="hacker@xyz.com..." />
                      </section>
                  </div>
              </div>
          ) : (
              /* Live Preview Template */
              <div className="glass-panel" style={{padding: '3rem', background: 'var(--bg-card)', borderTop: '4px solid var(--primary)'}}>
                  <h1 style={{fontSize: '2.5rem', marginTop: 0, marginBottom: '2rem'}}>{reportTitle || '[Untitled Vulnerability Form]'}</h1>
                  
                  <h2 style={{borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem'}}>Summary</h2>
                  <div style={{lineHeight: 1.6, marginBottom: '2rem'}}><ReactMarkdown>{description}</ReactMarkdown></div>

                  <h2 style={{borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem'}}>Steps to Reproduce</h2>
                  <div style={{lineHeight: 1.6, marginBottom: '2rem'}}><ReactMarkdown>{steps}</ReactMarkdown></div>

                  <h2 style={{borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem'}}>Payload Context</h2>
                  <pre style={{background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '4px', overflowX: 'auto', marginBottom: '2rem'}}><code>{payload}</code></pre>

                  <h2 style={{borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem'}}>Impact Scope</h2>
                  <div style={{lineHeight: 1.6, marginBottom: '2rem'}}><ReactMarkdown>{impact}</ReactMarkdown></div>

                  <h2 style={{borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem'}}>Calculated Vector</h2>
                  <div style={{background: 'rgba(255,143,0,0.1)', color: '#ff8f00', padding: '1rem', borderRadius: '4px', fontWeight: 'bold'}}>{cvssVector} (Score: {cvssScore})</div>
              </div>
          )}

      </div>

      {/* 3. Right Sidebar: Bounty Context Info */}
      <div style={{width: '320px', padding: '2rem', background: 'var(--bg-card)', borderLeft: '1px solid var(--border)', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto'}}>
          
          <button className="btn-primary" style={{width: '100%', padding: '1.2rem', fontSize: '1.1rem', marginBottom: '1rem', background: '#10b981', color: 'black'}} onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Encrypting & Triaging...' : 'Submit Report'}
          </button>
          <button className="btn-secondary" style={{width: '100%', padding: '1rem', marginBottom: '2rem'}}>Save as Draft</button>

          <h4 style={{margin: '0 0 1rem 0', color: 'var(--text-muted)'}}>Target Execution Context</h4>
          
          <div style={{marginBottom: '2rem'}}>
             <div style={{width: '48px', height: '48px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem'}}><Building2 size={24} color="black" /></div>
             <h3 style={{margin: '0 0 0.2rem 0', fontSize: '1.1rem'}}>{bounty.company_name}</h3>
             <a href="#" style={{color: 'var(--primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none'}}><Globe size={14}/> View Origin</a>
          </div>

          <div style={{marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)'}}>
              <h4 style={{margin: '0 0 0.5rem 0', fontSize: '1rem', lineHeight: 1.3}}>{bounty.title}</h4>
              <p style={{fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
                  Status <span style={{color: bounty.is_active ? '#10b981' : '#ff2a5f'}}>{bounty.is_active ? 'Active' : 'Closed'}</span>
              </p>
              
              <div style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem'}}>Max Escrow Coverage</div>
              <div className="text-gradient" style={{fontSize: '1.5rem', fontWeight: 'bold'}}>{bounty.max_reward || bounty.reward_critical || bounty.escrow_amount} ETH</div>
          </div>

          <div>
             <h4 style={{margin: '0 0 0.8rem 0', color: 'var(--text-muted)', fontSize: '0.9rem'}}>Organization Statistics</h4>
             <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-main)'}}><span><Activity size={14} style={{display:'inline', verticalAlign:'middle', marginRight:'0.3rem'}}/> Total Reports</span> <span>241</span></div>
             <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-main)'}}><span><CheckCircle size={14} style={{display:'inline', verticalAlign:'middle', marginRight:'0.3rem'}}/> Acceptance Rate</span> <span style={{color:'#10b981'}}>89%</span></div>
          </div>
      </div>

    </div>
  );
}
