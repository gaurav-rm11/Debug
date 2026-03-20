import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, FileText, Trophy, Settings, Building2, Globe, Activity, CheckCircle, Edit3, Plus, Target, CheckSquare, XSquare, Briefcase, Zap } from 'lucide-react';

const LeftSidebar = ({ role }) => (
   <div style={{width: '240px', borderRight: '1px solid var(--border)', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-dark)', height: '100vh', position:'sticky', top:0, overflowY:'auto'}}>
      <div style={{color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing:'1px', marginBottom: '1rem', paddingLeft: '1rem'}}>Profile Navigation</div>
      
      {role === 'researcher' ? (
          <>
             <Link to="/bounties" style={{textDecoration:'none'}}><button className="btn-secondary" style={{width:'100%', textAlign:'left', background:'transparent', border:'none', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.8rem', padding:'0.8rem 1rem'}}><LayoutDashboard size={18}/> Explore</button></Link>
             <button className="btn-secondary" style={{textAlign:'left', background:'transparent', border:'none', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.8rem', padding:'0.8rem 1rem'}}><FileText size={18}/> My Reports</button>
             <button className="btn-secondary" style={{textAlign:'left', background:'transparent', border:'none', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.8rem', padding:'0.8rem 1rem'}}><Trophy size={18}/> Leaderboard</button>
          </>
      ) : (
          <>
             <Link to="/create-bounty" style={{textDecoration:'none'}}><button className="btn-secondary" style={{width:'100%', textAlign:'left', background:'transparent', border:'none', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.8rem', padding:'0.8rem 1rem'}}><LayoutDashboard size={18}/> Dashboard</button></Link>
             <button className="btn-secondary" style={{textAlign:'left', background:'transparent', border:'none', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.8rem', padding:'0.8rem 1rem'}}><Briefcase size={18}/> My Programs</button>
          </>
      )}
      <Link to="/profile" style={{textDecoration:'none'}}><button className="btn-secondary" style={{width:'100%', textAlign:'left', background:'rgba(0,240,255,0.1)', border:'1px solid var(--primary)', color:'var(--primary)', display:'flex', alignItems:'center', gap:'0.8rem', padding:'0.8rem 1rem'}}><Settings size={18}/> Settings</button></Link>
   </div>
);

export default function Profile() {
  const { account, userProfile } = useAuth();
  const navigate = useNavigate();
  const role = userProfile?.role || 'researcher';

  const [activeTab, setActiveTab] = useState(role === 'researcher' ? 'Reports' : 'Bounties');
  const [bounties, setBounties] = useState([]);
  const [reports, setReports] = useState([]);
  
  useEffect(() => {
    async function fetchData() {
        if(role === 'organization') {
            const { data: b } = await supabase.from('bounties').select('*').eq('org_address', account);
            if(b) setBounties(b);
            const { data: r } = await supabase.from('reports').select('*, bounties!inner(org_address)').eq('bounties.org_address', account);
            if(r) setReports(r);
        } else {
            const { data: r } = await supabase.from('reports').select('*, bounties(title, company_name)').eq('researcher_address', account);
            if(r) setReports(r);
        }
    }
    fetchData();
  }, [account, role]);

  return (
    <div style={{display: 'flex', minHeight: 'calc(100vh - 80px)'}}>
        
      <LeftSidebar role={role} />

      <div style={{flex: 1, padding: '3rem 4rem', overflowY: 'auto', background: 'var(--bg-main)'}}>
          
          {/* Section 1: Profile Header */}
          <div className="glass-panel" style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '2rem', marginBottom: '2rem'}}>
              <div style={{display: 'flex', gap: '2rem', alignItems: 'center'}}>
                  <div style={{width: '100px', height: '100px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                      {role === 'organization' ? <Building2 size={48} color="black"/> : <Shield size={48} color="black"/>}
                  </div>
                  <div>
                      <h1 style={{margin: '0 0 0.5rem 0', display:'flex', alignItems:'center', gap:'0.5rem'}}>
                          {userProfile?.name || 'Anonymous User'} 
                          {role === 'organization' && <CheckCircle size={20} color="#10b981" fill="#10b981" style={{opacity:0.2, strokeWidth:1}}/>}
                      </h1>
                      <div style={{color: 'var(--text-muted)', marginBottom: '1rem'}}>
                          <span>{account.slice(0,6)}...{account.slice(-4)}</span> • Joined Mar 2026
                      </div>
                      
                      {role === 'researcher' ? (
                          <div style={{display: 'flex', gap: '0.5rem'}}>
                              <span style={{background: 'rgba(255,143,0,0.2)', color: '#ff8f00', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem'}}>Top 5% Hacker</span>
                              <span style={{background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem'}}>Smart Contracts</span>
                              <span style={{background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem'}}>Web APIs</span>
                          </div>
                      ) : (
                          <div style={{display: 'flex', gap: '0.5rem'}}>
                              <span style={{background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem'}}>DeFi Protocol</span>
                              <span style={{background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem'}}>Enterprise Grade</span>
                          </div>
                      )}
                  </div>
              </div>
              
              <div style={{display: 'flex', gap: '1rem'}}>
                  <button className="btn-secondary" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Edit3 size={16}/> Edit Profile</button>
                  {role === 'organization' && (
                      <Link to="/create-bounty">
                         <button className="btn-primary" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Plus size={16}/> New Bounty</button>
                      </Link>
                  )}
              </div>
          </div>

          {/* Section 2: Stats Overview */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem'}}>
              {role === 'researcher' ? (
                  <>
                     <div className="glass-panel stat-card" style={{padding:'1.5rem'}}>
                        <div style={{color:'var(--text-muted)', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'0.5rem'}}>Total Reports</div>
                        <div className="text-gradient" style={{fontSize:'2.5rem', fontWeight:'bold'}}>{reports.length}</div>
                     </div>
                     <div className="glass-panel stat-card" style={{padding:'1.5rem'}}>
                        <div style={{color:'var(--text-muted)', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'0.5rem', display:'flex', alignItems:'center', gap:'0.4rem'}}><CheckSquare size={14}/> Accepted</div>
                        <div style={{color:'#10b981', fontSize:'2.5rem', fontWeight:'bold'}}>0</div>
                     </div>
                     <div className="glass-panel stat-card" style={{padding:'1.5rem'}}>
                        <div style={{color:'var(--text-muted)', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'0.5rem', display:'flex', alignItems:'center', gap:'0.4rem'}}><Target size={14}/> Avg Severity</div>
                        <div style={{color:'#facc15', fontSize:'2.5rem', fontWeight:'bold'}}>High</div>
                     </div>
                     <div className="glass-panel stat-card" style={{padding:'1.5rem'}}>
                        <div style={{color:'var(--text-muted)', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'0.5rem'}}>Total Earnings</div>
                        <div style={{color:'white', fontSize:'2.5rem', fontWeight:'bold'}}>0 ETH</div>
                     </div>
                  </>
              ) : (
                  <>
                     <div className="glass-panel stat-card" style={{padding:'1.5rem'}}>
                        <div style={{color:'var(--text-muted)', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'0.5rem'}}>Total Bounties</div>
                        <div className="text-gradient" style={{fontSize:'2.5rem', fontWeight:'bold'}}>{bounties.length}</div>
                     </div>
                     <div className="glass-panel stat-card" style={{padding:'1.5rem'}}>
                        <div style={{color:'var(--text-muted)', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'0.5rem'}}>Reports Received</div>
                        <div style={{color:'white', fontSize:'2.5rem', fontWeight:'bold'}}>{reports.length}</div>
                     </div>
                     <div className="glass-panel stat-card" style={{padding:'1.5rem'}}>
                        <div style={{color:'var(--text-muted)', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'0.5rem', display:'flex', alignItems:'center', gap:'0.4rem'}}><CheckSquare size={14}/> Acceptance Rate</div>
                        <div style={{color:'#10b981', fontSize:'2.5rem', fontWeight:'bold'}}>0%</div>
                     </div>
                     <div className="glass-panel stat-card" style={{padding:'1.5rem'}}>
                        <div style={{color:'var(--text-muted)', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'0.5rem', display:'flex', alignItems:'center', gap:'0.4rem'}}><Zap size={14}/> Avg Response</div>
                        <div style={{color:'white', fontSize:'2.5rem', fontWeight:'bold'}}>2 Days</div>
                     </div>
                  </>
              )}
          </div>

          {/* Section 3: Dynamic Tabs Content */}
          <div style={{borderBottom: '1px solid var(--border)', marginBottom: '2rem', display: 'flex', gap: '2rem'}}>
              {(role === 'researcher' ? ['Reports', 'Earnings', 'Achievements', 'Activity'] : ['Bounties', 'Reports Received', 'Analytics', 'Activity']).map(tab => (
                  <button 
                     key={tab} 
                     onClick={() => setActiveTab(tab)}
                     style={{background: 'transparent', border: 'none', color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)', fontSize: '1.1rem', paddingBottom: '1rem', borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: activeTab === tab ? 'bold' : 'normal', transition: 'all 0.3s ease'}}
                  >
                      {tab}
                  </button>
              ))}
          </div>

          <div className="fade-in">
              {role === 'researcher' ? (
                  /* RESEARCHER TABS */
                  activeTab === 'Reports' ? (
                      reports.length > 0 ? (
                          <div className="glass-panel" style={{overflow: 'hidden'}}>
                              <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
                                  <thead>
                                      <tr style={{background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)'}}>
                                          <th style={{padding: '1.5rem'}}>Report Title</th>
                                          <th style={{padding: '1.5rem'}}>Bounty Target</th>
                                          <th style={{padding: '1.5rem'}}>Severity</th>
                                          <th style={{padding: '1.5rem'}}>Status</th>
                                          <th style={{padding: '1.5rem'}}>Date</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {reports.map((r, i) => (
                                          <tr key={i} style={{borderTop: '1px solid var(--border)'}}>
                                              <td style={{padding: '1.5rem', color: 'white'}}>{r.report_desc?.substring(0,40)}...</td>
                                              <td style={{padding: '1.5rem', color: 'var(--text-muted)'}}>{r.bounties?.title || 'Unknown Target'}</td>
                                              <td style={{padding: '1.5rem'}}><span style={{background: 'rgba(255,255,255,0.1)', padding: '0.4rem 0.8rem', borderRadius: '4px'}}>{r.claimed_severity}</span></td>
                                              <td style={{padding: '1.5rem'}}><span style={{color: '#facc15'}}>Under Review</span></td>
                                              <td style={{padding: '1.5rem', color: 'var(--text-muted)'}}>{new Date(r.created_at).toLocaleDateString()}</td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      ) : (
                          <div style={{padding: '4rem 0', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)'}}>
                              <FileText size={48} style={{opacity: 0.3, marginBottom: '1rem'}} />
                              <h3>You haven't submitted any reports yet</h3>
                              <p>Start hunting and submit bugs to see them tracked here.</p>
                          </div>
                      )
                  ) : activeTab === 'Earnings' ? (
                      <div className="glass-panel" style={{padding: '3rem', textAlign: 'center'}}><h2 style={{color: 'var(--text-muted)'}}>No Earnings Withdrawn Yet.</h2></div>
                  ) : activeTab === 'Achievements' ? (
                      <div className="glass-panel" style={{padding: '3rem', textAlign: 'center'}}><h2 style={{color: 'var(--text-muted)'}}>Complete Bounties to Mint NFTs!</h2></div>
                  ) : (
                      <div className="glass-panel" style={{padding: '3rem', textAlign: 'center'}}><h2 style={{color: 'var(--text-muted)'}}>Activity Feed Empty.</h2></div>
                  )
              ) : (
                  /* ORGANIZATION TABS */
                  activeTab === 'Bounties' ? (
                      bounties.length > 0 ? (
                          <div className="glass-panel" style={{overflow: 'hidden'}}>
                              <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
                                  <thead>
                                      <tr style={{background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)'}}>
                                          <th style={{padding: '1.5rem'}}>Program Title</th>
                                          <th style={{padding: '1.5rem'}}>Status</th>
                                          <th style={{padding: '1.5rem'}}>Max Reward</th>
                                          <th style={{padding: '1.5rem', textAlign: 'right'}}>Actions</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {bounties.map((b, i) => (
                                          <tr key={i} style={{borderTop: '1px solid var(--border)'}}>
                                              <td style={{padding: '1.5rem', color: 'white'}}>{b.title}</td>
                                              <td style={{padding: '1.5rem'}}><span style={{color: b.is_active ? '#10b981' : 'var(--text-muted)'}}>{b.is_active ? 'Active' : 'Draft'}</span></td>
                                              <td style={{padding: '1.5rem', color: 'var(--text-muted)'}}>{b.max_reward || b.reward_critical || b.escrow_amount} ETH</td>
                                              <td style={{padding: '1.5rem', textAlign: 'right'}}>
                                                  <Link to={`/bounty/${b.id}`}><button className="btn-secondary" style={{padding: '0.4rem 1rem'}}>View Page</button></Link>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      ) : (
                          <div style={{padding: '4rem 0', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)'}}>
                              <Briefcase size={48} style={{opacity: 0.3, marginBottom: '1rem'}} />
                              <h3>Create your first bounty to get started</h3>
                              <p>Once deployed, your smart contracts will appear here.</p>
                          </div>
                      )
                  ) : activeTab === 'Reports Received' ? (
                      reports.length > 0 ? (
                           <div className="glass-panel" style={{overflow: 'hidden'}}>
                              <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
                                  <thead>
                                      <tr style={{background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)'}}>
                                          <th style={{padding: '1.5rem'}}>Report Snippet</th>
                                          <th style={{padding: '1.5rem'}}>Researcher</th>
                                          <th style={{padding: '1.5rem'}}>Severity</th>
                                          <th style={{padding: '1.5rem'}}>Status</th>
                                          <th style={{padding: '1.5rem', textAlign: 'right'}}>Actions</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {reports.map((r, i) => (
                                          <tr key={i} style={{borderTop: '1px solid var(--border)'}}>
                                              <td style={{padding: '1.5rem', color: 'white'}}>{r.report_desc?.substring(0,30)}...</td>
                                              <td style={{padding: '1.5rem', color: 'var(--primary)', fontFamily: 'monospace'}}>{r.researcher_address?.slice(0,6)}...</td>
                                              <td style={{padding: '1.5rem'}}><span style={{background: 'rgba(255,255,255,0.1)', padding: '0.4rem 0.8rem', borderRadius: '4px'}}>{r.claimed_severity}</span></td>
                                              <td style={{padding: '1.5rem'}}><span style={{color: '#facc15'}}>Pending Logic Review</span></td>
                                              <td style={{padding: '1.5rem', textAlign: 'right'}}>
                                                  <button className="btn-secondary" style={{padding: '0.4rem 1rem'}}>Review Subpoena</button>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      ) : (
                          <div style={{padding: '4rem 0', textAlign: 'center', color: 'var(--text-muted)'}}>No reports queued.</div>
                      )
                  ) : activeTab === 'Analytics' ? (
                      <div className="glass-panel" style={{padding: '3rem', textAlign: 'center'}}><h2 style={{color: 'var(--text-muted)'}}>Accepting Reports required for Analytics payload.</h2></div>
                  ) : (
                      <div className="glass-panel" style={{padding: '3rem', textAlign: 'center'}}><h2 style={{color: 'var(--text-muted)'}}>Activity Feed Empty.</h2></div>
                  )
              )}
          </div>
      </div>
    </div>
  );
}
