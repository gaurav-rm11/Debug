import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, HelpCircle, User, MessageSquare, Zap, CheckCircle2, AlertOctagon } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const { account, userProfile, login, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = React.useState([]);
  const [showNotifs, setShowNotifs] = React.useState(false);
  
  const role = userProfile?.role || 'researcher';

  React.useEffect(() => {
    if (!account) return;
    async function fetchNotifs() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', account)
        .order('created_at', { ascending: false })
        .limit(10);
      setNotifications(data || []);
    }
    fetchNotifs();
    
    // Simple polling for notification updates
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [account]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllAsRead = async () => {
    if(!account) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', account);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <nav className="navbar" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(5, 6, 8, 0.9)', padding: '0.8rem 0', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
      <div className="container" style={{display: 'flex', alignItems: 'center', width: '100%'}}>
          {/* Left: Logo */}
          <div style={{ flex: '0 0 200px' }}>
            <Link to="/" className="logo glow-text" style={{ textDecoration: 'none', color: 'white', fontSize: '1.8rem' }}>Debug.</Link>
          </div>
          
          {/* Center: Navigation */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '2.5rem' }}>
            <Link to="/bounties" style={{ textDecoration: 'none', color: 'var(--text-main)', fontSize: '1rem', fontWeight: '500', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--primary)'} onMouseOut={e => e.target.style.color = 'var(--text-main)'}>Explore Bounties</Link>
            {role === 'organization' && (
              <Link to="/create-bounty" style={{ textDecoration: 'none', color: 'var(--primary)', fontSize: '1rem', fontWeight: '600', transition: 'opacity 0.2s' }} onMouseOver={e => e.target.style.opacity = '0.8'} onMouseOut={e => e.target.style.opacity = '1'}>+ Create Bounty</Link>
            )}
          </div>
          
          {/* Right: Actions/Account */}
          <div style={{ flex: '0 0 250px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            {account ? (
              <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                <Link to="/faq" title="FAQ & Guidelines" style={{color: 'var(--text-muted)', display: 'flex'}}><HelpCircle size={20} /></Link>
                
                {/* Notification Bell */}
                <div style={{position: 'relative'}}>
                  <div 
                    title="Notifications" 
                    onClick={() => { setShowNotifs(!showNotifs); if(!showNotifs) markAllAsRead(); }}
                    style={{color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', transition: 'color 0.2s'}}
                    onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'}
                    onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span style={{position:'absolute', top: '-4px', right: '-4px', background: '#ff2a5f', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '1px 5px', borderRadius: '10px', boxShadow: '0 0 10px rgba(255, 42, 95, 0.5)', border: '2px solid #050608'}}>
                        {unreadCount}
                      </span>
                    )}
                  </div>

                  {showNotifs && (
                    <div style={{position: 'absolute', top: '100%', right: 0, marginTop: '1rem', width: '320px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 1000, overflow:'hidden'}}>
                      <div style={{padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)'}}>
                        <span style={{fontWeight: 'bold', fontSize: '0.9rem'}}>Central Alerts</span>
                        <span style={{fontSize: '0.75rem', color: 'var(--primary)', cursor: 'pointer'}} onClick={() => setShowNotifs(false)}>Close</span>
                      </div>
                      <div style={{maxHeight: '350px', overflowY: 'auto'}}>
                        {notifications.length === 0 ? (
                          <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem'}}>No new activity logs.</div>
                        ) : notifications.map(n => (
                          <div 
                            key={n.id} 
                            style={{padding: '1rem', borderBottom: '1px solid var(--border)', background: n.is_read ? 'transparent' : 'rgba(0, 240, 255, 0.05)', display: 'flex', gap: '0.8rem', cursor: 'pointer'}}
                            onClick={() => {
                              if(n.bounty_id) navigate(`/bounty/${n.bounty_id}${n.type === 'new_report' ? '/reports' : ''}`);
                              setShowNotifs(false);
                            }}
                          >
                            <div style={{marginTop: '0.2rem'}}>
                              {n.type === 'new_report' ? <MessageSquare size={16} color="var(--primary)"/> : n.type === 'report_accepted' ? <CheckCircle2 size={16} color="#10b981"/> : <AlertOctagon size={16} color="#ff2a5f"/>}
                            </div>
                            <div>
                               <div style={{fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.2rem'}}>{n.message}</div>
                               <div style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>{new Date(n.created_at).toLocaleTimeString()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Link to="/profile" style={{display: 'block', padding: '0.8rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none', background: 'rgba(255,255,255,0.05)'}} onClick={() => setShowNotifs(false)}>View Activity History</Link>
                    </div>
                  )}
                </div>

                <Link to="/profile" title="Profile Settings" className="account-badge" style={{display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 0.8rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)', transition: 'all 0.3s ease'}}>
                  <User size={16} color="var(--primary)" />
                  <span style={{ fontSize: '0.9rem', color: 'white' }}>{account.slice(0, 6)}...{account.slice(-4)}</span>
                </Link>
              </div>
            ) : (
              <button className="btn-primary" onClick={login} style={{ padding: '0.6rem 1.4rem' }}>Connect Wallet</button>
            )}
          </div>
      </div>
    </nav>
  );
}
