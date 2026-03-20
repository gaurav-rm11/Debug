import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import { 
  Shield, LayoutDashboard, FileText, Trophy, Settings, 
  Building2, Globe, Activity, Upload, Eye, CheckCircle, 
  Zap, AlertTriangle, Info, Terminal, Target, BookOpen
} from 'lucide-react';

const LeftSidebar = () => (
   <div style={{width: '260px', borderRight: '1px solid var(--border)', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-dark)', height: '100vh', position:'sticky', top:0, overflowY:'auto', zIndex: 100}}>
      <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2rem', paddingLeft: '0.5rem'}}>
          <div style={{width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Shield size={20} color="black" />
          </div>
          <span style={{fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '1px'}}>DEBUG</span>
      </div>
      
      <div style={{color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing:'1.5px', marginBottom: '1rem', paddingLeft: '0.5rem', fontWeight: 'bold'}}>Researcher Hub</div>
      
      <Link to="/bounties" style={{textDecoration:'none'}}>
        <button className="nav-item" style={{background: 'rgba(0,240,255,0.05)', color: 'var(--primary)', border: '1px solid var(--primary-low)'}}><LayoutDashboard size={18}/> Dashboard</button>
      </Link>
      <button className="nav-item"><FileText size={18}/> My Reports</button>
      <Link to="/bounties" style={{textDecoration:'none'}}>
        <button className="nav-item"><Shield size={18}/> Explore Bounties</button>
      </Link>
      <button className="nav-item"><Trophy size={18}/> Leaderboard</button>
      
      <div style={{marginTop: 'auto', paddingTop: '2rem'}}>
          <Link to="/profile" style={{textDecoration:'none'}}>
            <button className="nav-item"><Settings size={18}/> Settings</button>
          </Link>
      </div>
   </div>
);

const MarkdownEditor = ({ label, value, onChange, placeholder, tab, setTab }) => (
    <div style={{marginBottom: '2rem'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.8rem'}}>
            <label style={{fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: 0}}>{label}</label>
            <div style={{display: 'flex', background: 'var(--bg-card)', padding: '3px', borderRadius: '6px', border: '1px solid var(--border)'}}>
                <button 
                    onClick={() => setTab('write')}
                    style={{
                        padding: '4px 12px', fontSize: '0.75rem', borderRadius: '4px', border: 'none', cursor: 'pointer',
                        background: tab === 'write' ? 'var(--primary)' : 'transparent',
                        color: tab === 'write' ? 'black' : 'var(--text-muted)',
                        fontWeight: tab === 'write' ? 'bold' : 'normal',
                        transition: 'all 0.2s'
                    }}
                >Write</button>
                <button 
                    onClick={() => setTab('preview')}
                    style={{
                        padding: '4px 12px', fontSize: '0.75rem', borderRadius: '4px', border: 'none', cursor: 'pointer',
                        background: tab === 'preview' ? 'var(--primary)' : 'transparent',
                        color: tab === 'preview' ? 'black' : 'var(--text-muted)',
                        fontWeight: tab === 'preview' ? 'bold' : 'normal',
                        transition: 'all 0.2s'
                    }}
                >Preview</button>
            </div>
        </div>
        
        {tab === 'write' ? (
            <textarea 
                className="input-field" 
                style={{minHeight: '150px', fontFamily: 'var(--font-mono)', fontSize: '0.95rem', lineHeight: 1.6, background: 'rgba(0,0,0,0.2)'}} 
                value={value} 
                onChange={e => onChange(e.target.value)} 
                placeholder={placeholder}
            />
        ) : (
            <div className="markdown-preview" style={{minHeight: '150px', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', overflowY: 'auto', lineHeight: 1.6}}>
                <ReactMarkdown>{value || '*Nothing to preview*'}</ReactMarkdown>
            </div>
        )}
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

  // Section 2: Vulnerability Details
  const [weaknessType, setWeaknessType] = useState('Cross-Site Scripting (XSS)');
  const [reproducibility, setReproducibility] = useState('Always');

  // Section 3: Severity (CVSS)
  const [cvss, setCvss] = useState({ AV: 'N', AC: 'L', PR: 'N', UI: 'N', S: 'U', C: 'L', I: 'L', A: 'N' });
  const [cvssScore, setCvssScore] = useState(5.3);

  // Section 4: PoC (Structured Content)
  const [reportTitle, setReportTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [poc, setPoc] = useState('');
  const [impact, setImpact] = useState('');
  
  // Tab states for Markdown Editors
  const [activeTabs, setActiveTabs] = useState({
      description: 'write',
      steps: 'write',
      poc: 'write',
      impact: 'write'
  });

  const setFieldTab = (field, tab) => setActiveTabs(prev => ({ ...prev, [field]: tab }));

  const cvssVector = `CVSS:3.1/AV:${cvss.AV}/AC:${cvss.AC}/PR:${cvss.PR}/UI:${cvss.UI}/S:${cvss.S}/C:${cvss.C}/I:${cvss.I}/A:${cvss.A}`;

  useEffect(() => {
    // Basic CVSS calculation logic
    let score = 4.0;
    if (cvss.AV === 'N') score += 1.0;
    if (cvss.AC === 'L') score += 1.0;
    if (cvss.PR === 'N') score += 1.0;
    if (cvss.UI === 'N') score += 0.5;
    if (cvss.C === 'H') score += 1.5;
    if (cvss.I === 'H') score += 1.5;
    if (cvss.A === 'H') score += 1.0;
    if (cvss.S === 'C') score += 1.0;
    setCvssScore(Math.min(10, score).toFixed(1));
  }, [cvss]);

  useEffect(() => {
    async function load() {
      if(!id) return;
      try {
          const { data } = await supabase.from('bounties').select('*').eq('id', id).single();
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
    if(!reportTitle || !description || !steps || !poc || !impact) {
        return alert("Please complete all required sections. Comprehensive reports are triaged up to 3x faster.");
    }
    
    setIsSubmitting(true);
    
    // Structured payload for the new Phase 13 schema
    const payloadData = {
        bounty_id: id,
        researcher_address: account,
        org_address: bounty.org_address,
        title: reportTitle,
        description: description,
        steps: steps,
        poc: poc,
        impact: impact,
        report_desc: `${reportTitle}\n\n${description}\n\n${steps}\n\n${poc}\n\n${impact}`, // Fallback/Legacy string
        claimed_severity: cvssScore >= 9.0 ? 'Critical' : cvssScore >= 7.0 ? 'High' : cvssScore >= 4.0 ? 'Medium' : 'Low',
        status: 'submitted'
    };

    try {
        const { data: reportData, error: reportError } = await supabase.from('reports').insert([payloadData]).select().single();
        if(reportError) throw reportError;

        // Auto-increment researcher's 'reports_submitted' count
        await supabase.rpc('increment_submitted_count', { user_addr: account });

        await supabase.from('notifications').insert([{
            user_id: bounty.org_address,
            type: 'new_report',
            message: `New Technical Report: ${reportTitle}`,
            bounty_id: id,
            report_id: reportData.id,
            is_read: false
        }]);

        alert("Report securely transmitted and queued for AI analysis.");
        navigate(`/bounty/${id}`);
    } catch(err) {
        console.error(err);
        alert("Transmission failure: " + (err.message || "Endpoint unreachable"));
        setIsSubmitting(false);
    }
  };

  if(loading || !bounty) return <div style={{height: '100vh', display:'flex', alignItems:'center', justifyContent:'center'}}><div className="loading-spinner" /></div>;

  return (
    <div style={{display: 'flex', minHeight: 'calc(100vh - 80px)', background: 'var(--bg-dark)'}}>
      
      {/* COLUMN 1: NAVIGATION */}
      <LeftSidebar />

      {/* COLUMN 2: STRUCTURED FORM */}
      <div style={{flex: 1, padding: '3rem 5rem', overflowY: 'auto', background: 'var(--bg-main)'}}>
          
          <div style={{marginBottom: '4rem'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
                  <span style={{background: 'rgba(0, 240, 255, 0.1)', color: 'var(--primary)', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid var(--primary-low)'}}>
                      NEW SUBMISSION
                  </span>
                  <span style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>Draft saved 2m ago</span>
              </div>
              <h1 className="text-gradient" style={{fontSize: '3rem', marginBottom: '1rem', letterSpacing: '-1px'}}>Submit Vulnerability</h1>
              <p style={{color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '800px', lineHeight: 1.5}}>
                  Targeting <span style={{color: 'white', fontWeight: 'bold'}}>{bounty.company_name}</span>. 
                  Please provide a technical evidence-based report for fast triage.
              </p>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '3.5rem'}}>
              
              {/* SECTION 1: TARGETING */}
              <section className="glass-panel" style={{padding: '2.5rem', borderLeft: '4px solid var(--primary)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem'}}>
                      <div style={{background: 'var(--bg-card)', padding: '0.8rem', borderRadius: '10px', border: '1px solid var(--border)'}}>
                          <Target size={24} color="var(--primary)" />
                      </div>
                      <div>
                          <h3 style={{margin: 0, fontSize: '1.4rem'}}>1. Target Acquisition</h3>
                          <p style={{margin:0, fontSize:'0.85rem', color:'var(--text-muted)'}}>Identify the asset and specific endpoint affected.</p>
                      </div>
                  </div>
                  
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
                      <div className="form-group">
                          <label>In-Scope Asset *</label>
                          <select className="input-field" value={asset} onChange={e=>setAsset(e.target.value)}>
                             {(bounty.domains || []).length > 0 ? bounty.domains.map(d => <option key={d} value={d}>{d}</option>) : <option value="Other">External/Other</option>}
                          </select>
                      </div>
                      <div className="form-group">
                          <label>Affected Endpoint *</label>
                          <input type="text" className="input-field" value={endpoint} onChange={e=>setEndpoint(e.target.value)} placeholder="e.g. https://api.site.com/v1/auth" />
                      </div>
                  </div>
              </section>

              {/* SECTION 2: METADATA */}
              <section className="glass-panel" style={{padding: '2.5rem', borderLeft: '4px solid #a855f7'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem'}}>
                      <div style={{background: 'var(--bg-card)', padding: '0.8rem', borderRadius: '10px', border: '1px solid var(--border)'}}>
                          <Activity size={24} color="#a855f7" />
                      </div>
                      <div>
                          <h3 style={{margin: 0, fontSize: '1.4rem'}}>2. Vulnerability Metadata</h3>
                          <p style={{margin:0, fontSize:'0.85rem', color:'var(--text-muted)'}}>Classify the bug and specify technical context.</p>
                      </div>
                  </div>
                  
                  <div style={{display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '2rem'}}>
                      <div className="form-group">
                          <label>Weakness Type *</label>
                          <select className="input-field" value={weaknessType} onChange={e=>setWeaknessType(e.target.value)}>
                              {['Cross-Site Scripting (XSS)', 'SQL Injection', 'IDOR', 'CSRF', 'Remote Code Execution', 'Auth Bypass', 'Logic Flaw'].map(w => (
                                  <option key={w} value={w}>{w}</option>
                              ))}
                          </select>
                      </div>
                      <div className="form-group">
                          <label>HTTP Method</label>
                          <select className="input-field" value={httpMethod} onChange={e=>setHttpMethod(e.target.value)}>
                              {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => <option key={m}>{m}</option>)}
                          </select>
                      </div>
                      <div className="form-group">
                          <label>Reproducibility</label>
                          <select className="input-field" value={reproducibility} onChange={e=>setReproducibility(e.target.value)}>
                              <option>Always</option><option>Sometimes</option><option>Rarely</option>
                          </select>
                      </div>
                  </div>
              </section>

              {/* SECTION 3: SEVERITY */}
              <section className="glass-panel" style={{padding: '2.5rem', borderLeft: '4px solid #ff8f00'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                          <div style={{background: 'var(--bg-card)', padding: '0.8rem', borderRadius: '10px', border: '1px solid var(--border)'}}>
                              <Zap size={24} color="#ff8f00" />
                          </div>
                          <div>
                              <h3 style={{margin: 0, fontSize: '1.4rem'}}>3. Severity Vector (CVSS 3.1)</h3>
                              <p style={{margin:0, fontSize:'0.85rem', color:'var(--text-muted)'}}>The organization may adjust this during triage based on impact.</p>
                          </div>
                      </div>
                      <div style={{
                          background: cvssScore >= 9.0 ? '#ff2a5f' : cvssScore >= 7.0 ? '#ff8f00' : '#facc15',
                          color: 'black', padding: '0.6rem 1.5rem', borderRadius: 'var(--radius-md)', fontWeight: 'bold', fontSize: '1.1rem'
                      }}>
                          {cvssScore} / {cvssScore >= 9.0 ? 'CRITICAL' : cvssScore >= 7.0 ? 'HIGH' : 'MEDIUM'}
                      </div>
                  </div>

                  <div style={{background: 'rgba(0,0,0,0.4)', padding: '1.2rem', borderRadius: 'var(--radius-sm)', marginBottom: '2.5rem', textAlign: 'center', border: '1px solid var(--border)'}}>
                      <code style={{color: 'var(--primary)', letterSpacing: '2px', fontSize: '1.1rem'}}>{cvssVector}</code>
                  </div>

                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem'}}>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '1.2rem'}}>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}><label style={{marginBottom: 0}}>Attack Vector</label><select className="cvss-select" value={cvss.AV} onChange={e=>setCvss({...cvss, AV: e.target.value})}><option value="N">Network</option><option value="A">Adjacent</option></select></div>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}><label style={{marginBottom: 0}}>Complexity</label><select className="cvss-select" value={cvss.AC} onChange={e=>setCvss({...cvss, AC: e.target.value})}><option value="L">Low</option><option value="H">High</option></select></div>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}><label style={{marginBottom: 0}}>Privileges</label><select className="cvss-select" value={cvss.PR} onChange={e=>setCvss({...cvss, PR: e.target.value})}><option value="N">None</option><option value="L">Low</option></select></div>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}><label style={{marginBottom: 0}}>User Interaction</label><select className="cvss-select" value={cvss.UI} onChange={e=>setCvss({...cvss, UI: e.target.value})}><option value="N">None</option><option value="R">Required</option></select></div>
                      </div>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '1.2rem'}}>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}><label style={{marginBottom: 0}}>Confidentiality</label><select className="cvss-select" value={cvss.C} onChange={e=>setCvss({...cvss, C: e.target.value})}><option value="N">None</option><option value="L">Low</option><option value="H">High</option></select></div>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}><label style={{marginBottom: 0}}>Integrity</label><select className="cvss-select" value={cvss.I} onChange={e=>setCvss({...cvss, I: e.target.value})}><option value="N">None</option><option value="L">Low</option><option value="H">High</option></select></div>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}><label style={{marginBottom: 0}}>Availability</label><select className="cvss-select" value={cvss.A} onChange={e=>setCvss({...cvss, A: e.target.value})}><option value="N">None</option><option value="L">Low</option><option value="H">High</option></select></div>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}><label style={{marginBottom: 0}}>Scope</label><select className="cvss-select" value={cvss.S} onChange={e=>setCvss({...cvss, S: e.target.value})}><option value="U">Unchanged</option><option value="C">Changed</option></select></div>
                      </div>
                  </div>
              </section>

              {/* SECTION 4: TECHNICAL EVIDENCE */}
              <section className="glass-panel" style={{padding: '2.5rem', borderLeft: '4px solid #10b981'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem'}}>
                      <div style={{background: 'var(--bg-card)', padding: '0.8rem', borderRadius: '10px', border: '1px solid var(--border)'}}>
                          <Terminal size={24} color="#10b981" />
                      </div>
                      <div>
                          <h3 style={{margin: 0, fontSize: '1.4rem'}}>4. Technical Evidence</h3>
                          <p style={{margin:0, fontSize:'0.85rem', color:'var(--text-muted)'}}>Document the vulnerability thoroughly using Markdown.</p>
                      </div>
                  </div>

                  <div style={{marginBottom: '3rem'}} className="form-group">
                      <label>Report Title *</label>
                      <input 
                        type="text" className="input-field" value={reportTitle} 
                        onChange={e=>setReportTitle(e.target.value)} 
                        placeholder="e.g. Stored XSS in /user/settings Profile Bio field" 
                        style={{fontSize: '1.1rem', fontWeight: 'bold'}}
                      />
                      <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.6rem'}}>A concise descriptive title for the vulnerability.</p>
                  </div>

                  <MarkdownEditor 
                    label="Vulnerability Description *"
                    value={description}
                    onChange={setDescription}
                    placeholder="Provide a high-level summary of the bug..."
                    tab={activeTabs.description}
                    setTab={(t) => setFieldTab('description', t)}
                  />

                  <MarkdownEditor 
                    label="Steps to Reproduce *"
                    value={steps}
                    onChange={setSteps}
                    placeholder="1. Login to account...\n2. Visit page...\n3. Observe..."
                    tab={activeTabs.steps}
                    setTab={(t) => setFieldTab('steps', t)}
                  />

                  <MarkdownEditor 
                    label="Proof of Concept (PoC) *"
                    value={poc}
                    onChange={setPoc}
                    placeholder="Include payloads, script context, or curl commands here..."
                    tab={activeTabs.poc}
                    setTab={(t) => setFieldTab('poc', t)}
                  />

                  <MarkdownEditor 
                    label="Impact Assessment *"
                    value={impact}
                    onChange={setImpact}
                    placeholder="What can an attacker achieve? Why is this a serious risk?"
                    tab={activeTabs.impact}
                    setTab={(t) => setFieldTab('impact', t)}
                  />
                  
                  <div style={{marginTop: '3rem', padding: '3rem', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', textAlign: 'center', background: 'rgba(255,143,0,0.02)', cursor: 'pointer', transition: 'all 0.3s'}} className="upload-zone">
                      <Upload size={40} color="var(--primary)" style={{marginBottom: '1rem', opacity: 0.6}} />
                      <h4 style={{margin: '0 0 0.5rem 0'}}>Upload Evidence</h4>
                      <p style={{color: 'var(--text-muted)', fontSize: '0.95rem'}}>Drag and drop screenshots, videos (MP4), or HAR logs.</p>
                      <span style={{fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)'}}>Max size: 50MB</span>
                  </div>
              </section>
          </div>

          <div style={{marginTop: '5rem', padding: '2.5rem', background: 'rgba(5,6,8,0.98)', borderTop: '1px solid var(--border)', display: 'flex', gap: '1.5rem', position: 'sticky', bottom: 0, zIndex: 10, borderRadius: 'var(--radius-md) var(--radius-md) 0 0', boxShadow: '0 -10px 30px rgba(0,0,0,0.5)'}}>
              <button 
                className="btn-primary" 
                style={{flex: 1, padding: '1.4rem', fontSize: '1.2rem', background: '#10b981', color: 'black', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem'}} 
                onClick={handleSubmit} 
                disabled={isSubmitting}
              >
                  {isSubmitting ? (
                      <><div className="loading-spinner" style={{width: '20px', height: '20px', borderTopColor: 'black'}} /> Encrypting & Submitting...</>
                  ) : (
                      <><Shield size={22} /> Transmit Structured Report</>
                  )}
              </button>
          </div>
      </div>

      {/* COLUMN 3: BOUNTY CONTEXT */}
      <div style={{width: '360px', padding: '2.5rem', background: 'var(--bg-card)', borderLeft: '1px solid var(--border)', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto'}}>
          
          <div style={{marginBottom: '3rem', background: 'rgba(0, 240, 255, 0.03)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--primary-low)', position: 'relative', overflow: 'hidden'}}>
              <div style={{position: 'absolute', top: '-20px', right: '-20px', opacity: 0.05}}>
                  <Building2 size={120} />
              </div>
              <div style={{color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.8rem'}}>TARGET CONTEXT</div>
              <h3 style={{margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.4rem'}}>
                   {bounty.company_name}
              </h3>
              <p style={{fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4}}>{bounty.title}</p>
              <div style={{marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem'}}>
                  <CheckCircle size={14} /> ACTIVE PROGRAM
              </div>
          </div>

          <div style={{marginBottom: '3rem', padding: '1rem'}}>
              <h4 style={{fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <Trophy size={16} /> REWARD MATRIX (ETH)
              </h4>
              <div style={{display: 'flex', flexDirection: 'column', gap: '1.2rem'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}><span style={{color: '#ff2a5f', fontWeight: 'bold'}}>Critical</span> <span style={{fontSize: '1.1rem'}}>{bounty.reward_critical}</span></div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}><span style={{color: '#ff8f00', fontWeight: 'bold'}}>High</span> <span style={{fontSize: '1.1rem'}}>{bounty.reward_high}</span></div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}><span style={{color: '#facc15', fontWeight: 'bold'}}>Medium</span> <span style={{fontSize: '1.1rem'}}>{bounty.reward_medium}</span></div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}><span style={{color: '#10b981', fontWeight: 'bold'}}>Low</span> <span style={{fontSize: '1.1rem'}}>{bounty.reward_low}</span></div>
              </div>
          </div>

          <div style={{background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)'}}>
              <h4 style={{margin: '0 0 1.2rem 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.6rem'}}>
                  <BookOpen size={18} color="var(--primary)" /> Researcher Tips
              </h4>
              <ul style={{margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '1rem', lineHeight: 1.5}}>
                  <li>Use **Markdown** for clean PoC code blocks.</li>
                  <li>Include a clear **Impact** statement for faster severity validation.</li>
                  <li>Ensure the **Reproducibility** steps are exact.</li>
                  <li>Organization average payout time: **4.2 Days**.</li>
              </ul>
          </div>

          <div style={{marginTop: '4rem', padding: '1rem', borderTop: '1px solid var(--border)', textAlign: 'center'}}>
              <div style={{fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase'}}>SUBMITTING AS</div>
              <code style={{color: 'var(--primary)', fontSize: '0.85rem'}}>{account.slice(0,12)}...{account.slice(-10)}</code>
          </div>
      </div>

    </div>
  );
}
