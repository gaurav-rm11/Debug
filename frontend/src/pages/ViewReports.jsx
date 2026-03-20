import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ethers } from 'ethers';
import { payoutResearcher } from '../lib/contractUtils';
import { Shield, ChevronLeft, CheckCircle, XCircle, Eye, Zap, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ViewReports() {
  const { id } = useParams(); // bounty id
  const { account } = useAuth();
  const [bounty, setBounty] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
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

  useEffect(() => {
    async function loadData() {
        if(!id) return;
        setLoading(true);
        try {
            // Fetch bounty info
            const { data: bData } = await supabase.from('bounties').select('*').eq('id', id).single();
            setBounty(bData);

            // Fetch reports for this bounty
            const { data: rData } = await supabase.from('reports').select('*').eq('bounty_id', id).order('created_at', { ascending: false });
            setReports(rData || []);
        } catch(e) { console.error(e); }
        setLoading(false);
    }
    loadData();
  }, [id]);

  const handleTriage = async (status, rejectionReason = '') => {
    if(!selectedReport || isProcessing) return;
    
    setIsProcessing(true);
    try {
        if(status === 'accepted') {
            const rewardAmt = prompt("Confirm Reward Amount (ETH):", selectedReport.claimed_severity === 'Critical' ? '1.0' : '0.1');
            if(!rewardAmt) { setIsProcessing(false); return; }

            // 1. On-chain transaction
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            await payoutResearcher(signer, bounty.contract_address, selectedReport.researcher_address, rewardAmt);

            // 2. Update DB Report Status
            await supabase.from('reports').update({ 
                status: 'accepted',
                ai_feedback: `Accepted with ${rewardAmt} ETH reward.`
            }).eq('id', selectedReport.id);

            // 3. Update Bounty Escrow (optional sync, or just rely on contract state)
            const newBalance = (parseFloat(bounty.escrow_amount) - parseFloat(rewardAmt)).toFixed(4);
            await supabase.from('bounties').update({ escrow_amount: newBalance }).eq('id', id);

            // 4. Notify Researcher
            await supabase.from('notifications').insert([{
                user_id: selectedReport.researcher_address,
                type: 'report_accepted',
                message: `Your report for ${bounty.title} has been ACCEPTED! Reward: ${rewardAmt} ETH.`,
                bounty_id: id,
                report_id: selectedReport.id
            }]);

            alert("Payment successful and report accepted!");
        } else {
            // Reject
            await supabase.from('reports').update({ 
                status: 'rejected',
                ai_feedback: rejectionReason || "Does not meet program criteria."
            }).eq('id', selectedReport.id);

            // Notify Researcher
            await supabase.from('notifications').insert([{
                user_id: selectedReport.researcher_address,
                type: 'report_rejected',
                message: `Your report for ${bounty.title} has been rejected.`,
                bounty_id: id,
                report_id: selectedReport.id
            }]);

            alert("Report rejected.");
        }
        
        // Refresh
        window.location.reload();
    } catch(err) {
        console.error(err);
        alert("Action failed: " + err.message);
    }
    setIsProcessing(false);
  };

  if(loading) return <div style={{padding:'4rem', color:'var(--text-muted)'}}>Scanning report archives...</div>;
  if(!bounty) return <div style={{padding:'4rem'}}>Bounty not found.</div>;

  return (
    <div style={{display: 'flex', height: 'calc(100vh - 80px)', background: 'var(--bg-dark)'}}>
        {/* Sidebar: Report List */}
        <div style={{width: '400px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column'}}>
            <div style={{padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)'}}>
                <Link to={`/bounty/${id}`} style={{color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem'}}>
                    <ChevronLeft size={16}/> Back to Bounty
                </Link>
                <h2 style={{margin: 0, fontSize: '1.4rem'}}>Vulnerability Reports</h2>
                <p style={{fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0'}}>
                    {reports.length} submissions found
                </p>
            </div>
            
            <div style={{flex: 1, overflowY: 'auto'}}>
                {reports.length === 0 ? (
                    <div style={{padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)'}}>
                        No reports submitted yet.
                    </div>
                ) : reports.map(r => (
                    <div 
                        key={r.id} 
                        onClick={() => setSelectedReport(r)}
                        style={{
                            padding: '1.5rem', 
                            borderBottom: '1px solid var(--border)', 
                            cursor: 'pointer',
                            background: selectedReport?.id === r.id ? 'rgba(0, 240, 255, 0.05)' : 'transparent',
                            transition: 'all 0.2s',
                            borderLeft: selectedReport?.id === r.id ? '4px solid var(--primary)' : '4px solid transparent'
                        }}
                    >
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                            <span style={{
                                fontSize: '0.75rem', 
                                fontWeight: 'bold', 
                                textTransform: 'uppercase', 
                                color: r.claimed_severity === 'Critical' ? '#ff2a5f' : r.claimed_severity === 'High' ? '#ff8f00' : '#facc15'
                            }}>
                                {r.claimed_severity}
                            </span>
                            <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>
                                {new Date(r.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <div style={{fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                            {r.report_desc.split('\n')[0]}
                        </div>
                        <div style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>
                            From: {r.researcher_address.slice(0,6)}...{r.researcher_address.slice(-4)}
                        </div>
                        <div style={{marginTop: '0.8rem'}}>
                            <span style={{
                                padding: '2px 8px', 
                                borderRadius: '4px', 
                                fontSize: '0.7rem', 
                                background: r.status === 'accepted' ? 'rgba(16,185,129,0.1)' : r.status === 'rejected' ? 'rgba(255,42,95,0.1)' : 'rgba(255,255,255,0.1)',
                                color: r.status === 'accepted' ? '#10b981' : r.status === 'rejected' ? '#ff2a5f' : 'white'
                            }}>
                                {r.status.toUpperCase()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Main Content: Report Detail & Triage */}
        <div style={{flex: 1, overflowY: 'auto', background: 'var(--bg-dark)'}}>
            {!selectedReport ? (
                <div style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: '4rem'}}>
                    <Shield size={64} style={{opacity: 0.1, marginBottom: '2rem'}} />
                    <h3>Select a report to begin triage</h3>
                    <p style={{maxWidth: '300px', textAlign: 'center'}}>Verify the vulnerability, check reproduction steps, and issue on-chain rewards.</p>
                </div>
            ) : (
                <div style={{padding: '3rem 4rem'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem'}}>
                        <div>
                            <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
                                <span style={{background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.9rem', border: '1px solid var(--border)'}}>
                                    REPORT #{selectedReport.id.slice(0,8)}
                                </span>
                                {selectedReport.status === 'submitted' && (
                                    <span style={{color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem'}}>
                                        <Zap size={16} /> Needs Review
                                    </span>
                                )}
                            </div>
                            <h1 style={{margin: 0, fontSize: '2.5rem'}}>{selectedReport.report_desc.split('\n')[0]}</h1>
                        </div>
                        
                        {selectedReport.status === 'submitted' && (
                            <div style={{display: 'flex', gap: '1rem'}}>
                                <button 
                                    className="btn-secondary" 
                                    style={{color: '#ff2a5f', borderColor: 'rgba(255,42,95,0.3)', padding: '0.8rem 1.5rem'}}
                                    onClick={() => handleTriage('rejected', prompt("Reason for rejection:"))}
                                    disabled={isProcessing}
                                >
                                    Reject
                                </button>
                                <button 
                                    className="btn-primary" 
                                    style={{background: '#10b981', color: 'black', padding: '0.8rem 2rem'}}
                                    onClick={() => handleTriage('accepted')}
                                    disabled={isProcessing}
                                >
                                    Accept & Pay ETH
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '3rem'}}>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '3rem'}}>
                            <section>
                                <h4 style={{textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '1rem'}}>Technical Description</h4>
                                <div style={{background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', lineHeight: 1.6}}>
                                    <ReactMarkdown>{selectedReport.report_desc}</ReactMarkdown>
                                </div>
                            </section>

                            <section>
                                <h4 style={{textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '1rem'}}>Researcher Wallet</h4>
                                <div style={{background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '4px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem'}}>
                                    <div style={{width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '50%', display:'flex', alignItems:'center', justifyContent:'center'}}>
                                        {selectedReport.researcher_address.slice(2,4).toUpperCase()}
                                    </div>
                                    <code style={{fontSize: '1rem', color: 'var(--primary)'}}>{selectedReport.researcher_address}</code>
                                </div>
                            </section>
                        </div>

                        <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
                            <div style={{background: 'rgba(0, 240, 255, 0.03)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-low)', position: 'relative', overflow: 'hidden'}}>
                                <div style={{position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1}}>
                                    <Zap size={100} color="var(--primary)" />
                                </div>
                                <h4 style={{margin: '0 0 1rem 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                    <Zap size={18} /> Triage Insight
                                </h4>
                                <div style={{marginBottom: '1.5rem'}}>
                                    <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem'}}>CLAIMED SEVERITY</div>
                                    <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: selectedReport.claimed_severity === 'Critical' ? '#ff2a5f' : '#ff8f00'}}>
                                        {selectedReport.claimed_severity}
                                    </div>
                                </div>
                                <div>
                                    <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem'}}>ESTIMATED REWARD</div>
                                    <div style={{fontSize: '1.2rem', fontWeight: 'bold'}}>
                                        {selectedReport.claimed_severity === 'Critical' ? '1.0 - 5.0' : '0.1 - 0.5'} ETH
                                    </div>
                                    <div style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>
                                        ~₹{selectedReport.claimed_severity === 'Critical' ? formatINR(1.0) + ' - ' + formatINR(5.0) : formatINR(0.1) + ' - ' + formatINR(0.5)}
                                    </div>
                                </div>
                            </div>

                            <div style={{background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)'}}>
                                <h4 style={{margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                    <CheckCircle size={18} color="#10b981" /> Decision Status
                                </h4>
                                <p style={{fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5}}>
                                    {selectedReport.status === 'submitted' 
                                        ? "This report is currently in the 'submitted' queue. Please verify technical validity on the testnet before issuing payment."
                                        : `This report has been finalized as '${selectedReport.status}'. No further on-chain actions are possible for this specific record.`
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}
