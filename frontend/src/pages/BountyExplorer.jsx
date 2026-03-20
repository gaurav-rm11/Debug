import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Search, Filter, ChevronDown, LayoutGrid, List, Shield, Trophy, FileText, Settings, LayoutDashboard, Building2, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => (
   <div style={{width: '240px', borderRight: '1px solid var(--border)', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-dark)'}}>
      <div style={{color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing:'1px', marginBottom: '1rem', paddingLeft: '1rem'}}>Researcher Suite</div>
      <button className="btn-secondary" style={{textAlign:'left', background:'transparent', border:'none', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.8rem', padding:'0.8rem 1rem'}}><LayoutDashboard size={18}/> Overview</button>
      <button className="btn-secondary" style={{textAlign:'left', background:'rgba(0,240,255,0.1)', border:'1px solid var(--primary)', color:'var(--primary)', display:'flex', alignItems:'center', gap:'0.8rem', padding:'0.8rem 1rem'}}><Shield size={18}/> Bounties</button>
      <button className="btn-secondary" style={{textAlign:'left', background:'transparent', border:'none', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.8rem', padding:'0.8rem 1rem'}}><FileText size={18}/> My Reports</button>
      <button className="btn-secondary" style={{textAlign:'left', background:'transparent', border:'none', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.8rem', padding:'0.8rem 1rem'}}><Trophy size={18}/> Leaderboard</button>
      <button className="btn-secondary" style={{textAlign:'left', background:'transparent', border:'none', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.8rem', padding:'0.8rem 1rem'}}><Settings size={18}/> Settings</button>
   </div>
);

export default function BountyExplorer() {
  const { account } = useAuth();
  const [bounties, setBounties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ethPriceInr, setEthPriceInr] = useState(245000);

  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr')
      .then(res => res.json())
      .then(data => setEthPriceInr(data.ethereum.inr))
      .catch(() => {});
  }, []);

  const formatINR = (eth) => {
    return (parseFloat(eth) * ethPriceInr).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchBounties();
  }, [account]); // Added account as a dependency

  async function fetchBounties() {
    let { data, error } = await supabase
      .from('bounties')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data) {
      // Filter for private visibility
      const filtered = data.filter(b => {
          // If visibility is null or 'public', show to everyone
          if (!b.visibility || b.visibility === 'public') return true;
          
          if (!account) return false;
          
          // Show if user is the owner or invited
          const userAddr = account.toLowerCase();
          if (b.org_address.toLowerCase() === userAddr) return true;
          if (b.invited_users && b.invited_users.some(addr => addr.toLowerCase() === userAddr)) return true;
          
          return false;
      });
      setBounties(filtered);
    }
    setLoading(false);
  };

  const filtered = bounties.filter(b => b.title?.toLowerCase().includes(searchTerm.toLowerCase()) || b.company_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{display: 'flex', minHeight: 'calc(100vh - 80px)'}}>
      
      <Sidebar />

      <div style={{flex: 1, padding: '2rem 3rem', overflowY: 'auto'}}>
        
        {/* Top Bar */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem'}}>
          <div style={{position: 'relative', flex: 1, maxWidth: '500px'}}>
             <Search size={20} color="var(--text-muted)" style={{position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem'}} />
             <input type="text" placeholder="Search by company, domain, or vulnerability..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)'}} />
          </div>
          
          <div style={{display: 'flex', gap: '1rem'}}>
              <button className={`btn-secondary ${showFilters ? 'btn-primary' : ''}`} style={{display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem'}} onClick={() => setShowFilters(!showFilters)}>
                  <Filter size={18} /> Filters {showFilters ? <ChevronDown size={14}/> : null}
              </button>
              <button className="btn-secondary" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem'}}>
                  Sort: Newest <ChevronDown size={18} />
              </button>
              <div style={{display: 'flex', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)'}}>
                  <button style={{background:'rgba(255,255,255,0.1)', border:'none', padding:'0.8rem 1rem', color:'white'}}><LayoutGrid size={18}/></button>
                  <button style={{background:'transparent', border:'none', padding:'0.8rem 1rem', color:'var(--text-muted)'}}><List size={18}/></button>
              </div>
          </div>
        </div>

        {/* Expandable Filters Panel */}
        {showFilters && (
            <div className="glass-panel fade-in" style={{padding: '2rem', marginBottom: '2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap'}}>
                <div style={{flex: 1, minWidth: '150px'}}>
                    <h5 style={{margin: '0 0 1rem 0', color: 'var(--text-muted)'}}>Status</h5>
                    <label style={{display:'flex', gap:'0.5rem', marginBottom:'0.5rem'}}><input type="checkbox"/> Open</label>
                    <label style={{display:'flex', gap:'0.5rem'}}><input type="checkbox"/> Closed</label>
                </div>
                <div style={{flex: 1, minWidth: '200px'}}>
                    <h5 style={{margin: '0 0 1rem 0', color: 'var(--text-muted)'}}>Severity Rewards</h5>
                    <label style={{display:'flex', gap:'0.5rem', marginBottom:'0.5rem', color: '#10b981'}}><input type="checkbox"/> Low (Under 1 ETH)</label>
                    <label style={{display:'flex', gap:'0.5rem', marginBottom:'0.5rem', color: '#facc15'}}><input type="checkbox"/> Medium (1-5 ETH)</label>
                    <label style={{display:'flex', gap:'0.5rem', marginBottom:'0.5rem', color: '#ff8f00'}}><input type="checkbox"/> High (5-10 ETH)</label>
                    <label style={{display:'flex', gap:'0.5rem', color: '#ff2a5f'}}><input type="checkbox"/> Critical (10+ ETH)</label>
                </div>
                <div style={{flex: 1, minWidth: '150px'}}>
                    <h5 style={{margin: '0 0 1rem 0', color: 'var(--text-muted)'}}>Tags</h5>
                    <label style={{display:'flex', gap:'0.5rem', marginBottom:'0.5rem'}}><input type="checkbox"/> UI/UX</label>
                    <label style={{display:'flex', gap:'0.5rem', marginBottom:'0.5rem'}}><input type="checkbox"/> Smart Contract</label>
                    <label style={{display:'flex', gap:'0.5rem'}}><input type="checkbox"/> Auth Bypass</label>
                </div>
                <div style={{flex: 1, minWidth: '150px'}}>
                    <h5 style={{margin: '0 0 1rem 0', color: 'var(--text-muted)'}}>Environment</h5>
                    <label style={{display:'flex', gap:'0.5rem', marginBottom:'0.5rem'}}><input type="checkbox"/> Production</label>
                    <label style={{display:'flex', gap:'0.5rem'}}><input type="checkbox"/> Staging</label>
                </div>
            </div>
        )}

        <h2 style={{fontSize: '1.5rem', marginBottom: '1.5rem'}}>Active Bug Bounty Programs</h2>

        {loading ? (
             <div className="features-grid">
                 {[1,2,3,4].map(i => <div key={i} className="glass-panel" style={{height: '250px', animation: 'pulse 1.5s infinite'}}></div>)}
             </div>
        ) : (
             <div className="features-grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'}}>
                {filtered.map(bounty => (
                    <div key={bounty.id} className="glass-panel" style={{display: 'flex', flexDirection: 'column', padding: 0}}>
                        
                        <div style={{padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
                                <div style={{width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                                    <Building2 size={24} color="black" />
                                </div>
                                <div>
                                    <h4 style={{margin: 0, fontSize: '1.1rem'}}>{bounty.company_name || 'Organization LLC'}</h4>
                                    <p style={{margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)'}}>Verified Entity</p>
                                </div>
                            </div>
                            <h3 style={{margin: '0 0 0.5rem', fontSize: '1.4rem'}}>{bounty.title}</h3>
                            <p style={{margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{bounty.description?.substring(0, 100)}...</p>
                            
                            <div style={{display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap'}}>
                                {(bounty.allowed_vulns || []).slice(0,3).map((tag, i) => (
                                    <span key={i} style={{background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem'}}>{tag}</span>
                                ))}
                                {bounty.allowed_vulns?.length > 3 && <span style={{color: 'var(--text-muted)', fontSize: '0.8rem'}}>+{bounty.allowed_vulns.length - 3} more</span>}
                            </div>
                        </div>

                        <div style={{padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column'}}>
                             <div style={{color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem'}}>{bounty.reward_type === 'Range' ? 'Reward Range' : 'Up to'}</div>
                             <div className="text-gradient" style={{fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1.5rem'}}>
                                 {bounty.reward_type === 'Range' ? `${bounty.min_reward || 0} - ${bounty.max_reward || bounty.reward_critical} ETH` : `${bounty.reward_critical || bounty.escrow_amount} ETH`}
                             </div>
                             
                             <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: 'auto', marginBottom: '1rem'}}>
                                 <span style={{color: bounty.is_active ? '#10b981' : 'var(--text-muted)', fontWeight: 'bold'}}>{bounty.is_active ? 'Open' : 'Closed'}</span>
                                 <span style={{color: 'var(--text-muted)'}}>0 Reports Submitted</span>
                                 <span style={{color: 'var(--text-muted)'}}>{new Date(bounty.created_at).toLocaleDateString()}</span>
                             </div>

                             <Link to={`/bounty/${bounty.id}`} className="btn-primary" style={{textAlign: 'center', display: 'block', padding: '1rem', width: '100%', boxSizing: 'border-box'}}>View Details</Link>
                        </div>
                    </div>
                ))}
                
                {filtered.length === 0 && (
                    <div style={{gridColumn: '1 / -1', padding: '6rem 0', textAlign: 'center'}}>
                        <h3 style={{color: 'var(--text-muted)', marginBottom: '1rem'}}>No bounties found</h3>
                        <p style={{color: 'var(--text-muted)'}}>Try adjusting your filters or search query.</p>
                    </div>
                )}
             </div>
        )}
      </div>
    </div>
  );
}
