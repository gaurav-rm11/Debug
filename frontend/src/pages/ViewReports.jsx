import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ethers } from 'ethers';
import { payoutResearcher } from '../lib/contractUtils';
import { 
  Shield, ChevronLeft, CheckCircle, XCircle, Eye, 
  Zap, AlertTriangle, Terminal, Target, Info, 
  ExternalLink, BarChart3, Fingerprint, Search
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ViewReports() {
  const { id } = useParams(); // bounty id
  const { account } = useAuth();
  const [bounty, setBounty] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState(null);

  useEffect(() => {
    async function loadData() {
        if(!id) return;
        setLoading(true);
        try {
            const { data: bData } = await supabase.from('bounties').select('*').eq('id', id).single();
            setBounty(bData);

            const { data: rData } = await supabase.from('reports').select('*').eq('bounty_id', id).order('created_at', { ascending: false });
            setReports(rData || []);
        } catch(e) { console.error(e); }
        setLoading(false);
    }
    loadData();
  }, [id]);

  const runAiAnalysis = async (report) => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    setDuplicateResult(null);

    try {
        // 1. Deep Analysis
        const analysisRes = await fetch('http://localhost:3001/api/ai/analyze-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: report.title || report.report_desc.split('\n')[0],
                description: report.description || report.report_desc,
                steps: report.steps,
                poc: report.poc,
                impact: report.impact
            })
        });
        const analysisData = await analysisRes.json();
        setAiAnalysis(analysisData);

        // 2. Duplicate Check
        const dupeRes = await fetch('http://localhost:3001/api/ai/check-duplicate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentReport: { title: report.title, description: report.description },
                existingReports: reports.filter(r => r.id !== report.id)
            })
        });
        const dupeData = await dupeRes.json();
        setDuplicateResult(dupeData);

    } catch (err) {
        console.error("AI Service Error:", err);
        alert("Could not connect to AI Triage Engine.");
    }
    setIsAnalyzing(false);
  };

  const handleTriage = async (status, rejectionReason = '') => {
    if(!selectedReport || isProcessing) return;
    
    setIsProcessing(true);
    try {
        if(status === 'accepted') {
            const rewardAmt = prompt("Confirm Reward Amount (ETH):", selectedReport.claimed_severity === 'Critical' ? bounty.reward_critical : bounty.reward_high);
            if(!rewardAmt) { setIsProcessing(false); return; }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            await payoutResearcher(signer, bounty.contract_address, selectedReport.researcher_address, rewardAmt);

            await supabase.from('reports').update({ 
                status: 'accepted',
                ai_feedback: `Accepted with ${rewardAmt} ETH reward.`
            }).eq('id', selectedReport.id);

            // Increment accepted count and total earnings for researcher
            await supabase.rpc('increment_accepted_count', { 
                user_addr: selectedReport.researcher_address,
                earned_amt: parseFloat(rewardAmt)
            });

            await supabase.from('notifications').insert([{
                user_id: selectedReport.researcher_address,
                type: 'report_accepted',
                message: `ACCEPTED! ${bounty.title} reward: ${rewardAmt} ETH.`,
                bounty_id: id,
                report_id: selectedReport.id
            }]);

            alert("Payment successful and reputation updated!");
        } else {
            await supabase.from('reports').update({ 
                status: 'rejected',
                ai_feedback: rejectionReason || "Does not meet program criteria."
            }).eq('id', selectedReport.id);

            alert("Report rejected & researcher notified.");
        }
        window.location.reload();
    } catch(err) {
        console.error(err);
        alert("Action failed: " + err.message);
    }
    setIsProcessing(false);
  };

  if(loading) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}><div className="loading-spinner" /></div>;
  if(!bounty) return <div style={{padding:'4rem'}}>Access Denied or Program Offline.</div>;

  return (
    <div style={{display: 'flex', height: 'calc(100vh - 80px)', background: 'var(--bg-dark)'}}>
        
        {/* SIDEBAR: REPORT LOCKER */}
        <div style={{width: '420px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'rgba(5,6,8,0.98)'}}>
            <div style={{padding: '2rem', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)'}}>
                <Link to={`/bounty/${id}`} style={{color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 'bold'}}>
                    <ChevronLeft size={16}/> BACK TO PROGRAM
                </Link>
                <h2 style={{margin: 0, fontSize: '1.6rem', letterSpacing: '-0.5px'}}>Submission Vault</h2>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem'}}>
                    <span style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>{reports.length} incoming reports</span>
                    <Search size={16} color="var(--text-muted)" />
                </div>
            </div>
            
            <div style={{flex: 1, overflowY: 'auto'}}>
                {reports.length === 0 ? (
                    <div style={{padding: '6rem 3rem', textAlign: 'center', color: 'var(--text-muted)'}}>
                        <Shield size={48} style={{opacity:0.1, marginBottom:'1rem'}} />
                        <p>No researcher activity detected yet.</p>
                    </div>
                ) : reports.map(r => (
                    <div 
                        key={r.id} 
                        onClick={() => { setSelectedReport(r); setAiAnalysis(null); setDuplicateResult(null); }}
                        style={{
                            padding: '1.5rem 2rem', 
                            borderBottom: '1px solid var(--border)', 
                            cursor: 'pointer',
                            background: selectedReport?.id === r.id ? 'rgba(0, 240, 255, 0.04)' : 'transparent',
                            transition: 'all 0.2s',
                            borderLeft: selectedReport?.id === r.id ? '4px solid var(--primary)' : '4px solid transparent'
                        }}
                    >
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem'}}>
                            <span style={{
                                fontSize: '0.7rem', 
                                fontWeight: 'bold', 
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: r.claimed_severity === 'Critical' ? 'rgba(255,42,95,0.1)' : 'rgba(255,143,0,0.1)',
                                color: r.claimed_severity === 'Critical' ? '#ff2a5f' : '#ff8f00'
                            }}>
                                {r.claimed_severity.toUpperCase()}
                            </span>
                            <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>
                                {new Date(r.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <div style={{fontWeight: 'bold', fontSize: '1.05rem', color: 'white', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                            {r.title || r.report_desc.split('\n')[0]}
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.4rem'}}>
                                <Fingerprint size={12} /> {r.researcher_address.slice(0,6)}...{r.researcher_address.slice(-4)}
                            </div>
                            <span style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: r.status === 'accepted' ? '#10b981' : r.status === 'rejected' ? '#ff2a5f' : 'var(--primary)'
                            }}></span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* MAIN DISPLAY: TECHNICAL REVIEW */}
        <div style={{flex: 1, overflowY: 'auto', background: 'var(--bg-main)'}}>
            {!selectedReport ? (
                <div style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: '4rem'}}>
                    <Target size={80} style={{opacity: 0.1, marginBottom: '2rem'}} />
                    <h2 style={{color: 'white', marginBottom: '0.5rem'}}>Select a report for technical triage</h2>
                    <p style={{maxWidth: '400px', textAlign: 'center', lineHeight: 1.6}}>Verify the Proof of Concept using your sandbox environment before executing on-chain rewards.</p>
                </div>
            ) : (
                <div style={{padding: '4rem 6rem'}}>
                    
                    {/* Header: Identity & Actions */}
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4rem'}}>
                        <div style={{flex: 1}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem'}}>
                                <span style={{background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.85rem', border: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 'bold'}}>
                                    ID: {selectedReport.id.slice(0,13).toUpperCase()}
                                </span>
                                {selectedReport.status === 'submitted' && (
                                    <span style={{color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 'bold'}}>
                                        <Zap size={16} fill="var(--primary)" /> READY FOR REVIEW
                                    </span>
                                )}
                            </div>
                            <h1 style={{margin: 0, fontSize: '2.8rem', letterSpacing: '-1px', lineHeight: 1.1}}>{selectedReport.title || selectedReport.report_desc.split('\n')[0]}</h1>
                        </div>
                        
                        {selectedReport.status === 'submitted' && (
                            <div style={{display: 'flex', gap: '1rem', marginLeft: '3rem'}}>
                                <button 
                                    className="btn-secondary" 
                                    style={{color: '#ff2a5f', borderColor: 'rgba(255,42,95,0.3)', padding: '1rem 2rem', fontWeight: 'bold'}}
                                    onClick={() => handleTriage('rejected', prompt("Reasoning for rejection:"))}
                                    disabled={isProcessing}
                                >
                                    REJECT
                                </button>
                                <button 
                                    className="btn-primary" 
                                    style={{background: '#10b981', color: 'black', padding: '1rem 2.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.8rem'}}
                                    onClick={() => handleTriage('accepted')}
                                    disabled={isProcessing}
                                >
                                    <Shield size={20} /> ACCEPT & PAY
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '5rem'}}>
                        
                        {/* LEFT: TECHNICAL DOCUMENTATION */}
                        <div style={{display: 'flex', flexDirection: 'column', gap: '4rem'}}>
                            
                            <section>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem'}}>
                                    <BookOpen size={20} color="var(--primary)" />
                                    <h4 style={{margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem', color: 'var(--text-muted)'}}>Technical Description</h4>
                                </div>
                                <div style={{background: 'var(--bg-card)', padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)', lineHeight: 1.8, fontSize: '1.05rem'}}>
                                    <ReactMarkdown>{selectedReport.description || selectedReport.report_desc}</ReactMarkdown>
                                </div>
                            </section>

                            <section>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem'}}>
                                    <Terminal size={20} color="var(--primary)" />
                                    <h4 style={{margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem', color: 'var(--text-muted)'}}>Step-by-Step Reproduction</h4>
                                </div>
                                <div style={{background: 'rgba(5,6,8,0.5)', padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)', lineHeight: 1.8, fontSize: '1.05rem', borderLeft: '4px solid var(--primary)'}}>
                                    <ReactMarkdown>{selectedReport.steps || '*No reproduction steps provided.*'}</ReactMarkdown>
                                </div>
                            </section>

                            <section>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem'}}>
                                    <Eye size={20} color="var(--primary)" />
                                    <h4 style={{margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem', color: 'var(--text-muted)'}}>PoC Payload / Evidence</h4>
                                </div>
                                <pre style={{background: 'black', padding: '2rem', borderRadius: '1rem', overflowX: 'auto', border: '1px solid var(--border)', color: '#00f0ff', fontFamily: 'monospace'}}>
                                    <code>{selectedReport.poc || '*No direct PoC data.*'}</code>
                                </pre>
                            </section>

                            <section>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem'}}>
                                    <AlertTriangle size={20} color="#ff8f00" />
                                    <h4 style={{margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem', color: 'var(--text-muted)'}}>Impact Analysis</h4>
                                </div>
                                <div style={{background: 'rgba(255,143,0,0.03)', padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid rgba(255,143,0,0.1)', lineHeight: 1.8, fontSize: '1.05rem'}}>
                                    <ReactMarkdown>{selectedReport.impact || '*Researcher provided no impact assessment.*'}</ReactMarkdown>
                                </div>
                            </section>
                        </div>

                        {/* RIGHT: AI ASSISTANT & METRICS */}
                        <div style={{display: 'flex', flexDirection: 'column', gap: '3rem'}}>
                            
                            {/* AI ANALYSIS CARD */}
                            <div style={{background: 'rgba(0, 240, 255, 0.05)', padding: '2.5rem', borderRadius: '2rem', border: '1px solid var(--primary-low)', position: 'relative', overflow: 'hidden'}}>
                                <div style={{position: 'absolute', top: '-15px', right: '-15px', opacity: 0.1}}>
                                    <Zap size={120} color="var(--primary)" />
                                </div>
                                <h3 style={{margin: '0 0 1.5rem 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.3rem'}}>
                                    <Zap size={22} fill="var(--primary)" /> Gemini AI Triage
                                </h3>

                                {!aiAnalysis ? (
                                    <div style={{textAlign: 'center', padding: '2rem 0'}}>
                                        <p style={{fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6}}>Generate an advisory technical assessment, severity score, and duplicate check using Gemini AI.</p>
                                        <button 
                                            className="btn-primary" 
                                            style={{width: '100%', padding: '1rem', fontWeight: 'bold'}}
                                            onClick={() => runAiAnalysis(selectedReport)}
                                            disabled={isAnalyzing}
                                        >
                                            {isAnalyzing ? 'SCANNING ARTIFACTS...' : 'ANALYZE WITH AI'}
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
                                        <div>
                                            <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem'}}>ADVISORY SEVERITY</div>
                                            <div style={{fontSize: '1.8rem', fontWeight: 'bold', color: aiAnalysis.severity === 'Critical' ? '#ff2a5f' : '#ff8f00'}}>
                                                {aiAnalysis.severity} ({aiAnalysis.confidence}%)
                                            </div>
                                        </div>
                                        
                                        {duplicateResult && duplicateResult.isDuplicate && (
                                            <div style={{background: 'rgba(255,42,95,0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,42,95,0.2)', display: 'flex', alignItems: 'center', gap: '1rem'}}>
                                                <AlertTriangle size={24} color="#ff2a5f" />
                                                <div>
                                                    <div style={{fontWeight: 'bold', color: '#ff2a5f', fontSize: '0.9rem'}}>DUPLICATE DETECTED ({duplicateResult.similarityScore}%)</div>
                                                    <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{duplicateResult.reasoning}</div>
                                                </div>
                                            </div>
                                        )}

                                        <div style={{fontSize: '0.9rem', lineHeight: 1.6, color: 'white'}}>
                                            <strong>Key Insight:</strong> {aiAnalysis.summary}
                                        </div>

                                        <div style={{fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '12px'}}>
                                            <strong>Remediation:</strong> {aiAnalysis.recommendation}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* RESEARCHER REPUTATION */}
                            <div style={{background: 'var(--bg-card)', padding: '2.5rem', borderRadius: '2rem', border: '1px solid var(--border)'}}>
                                <h4 style={{margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.1rem'}}>
                                    <BarChart3 size={20} color="var(--primary)" /> Researcher Reputation
                                </h4>
                                <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem'}}>
                                    <div style={{width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--primary), #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', color: 'black'}}>
                                        {selectedReport.researcher_address.slice(2,4).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{color: 'white', fontWeight: 'bold', fontSize: '1.1rem'}}>{selectedReport.researcher_address.slice(0,10)}...</div>
                                        <div style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Certified Level 4 Specialist</div>
                                    </div>
                                </div>
                                
                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
                                    <div style={{textAlign:'center', background:'rgba(255,255,255,0.02)', padding:'1rem', borderRadius:'12px'}}>
                                        <div style={{fontSize:'0.7rem', color:'var(--text-muted)', marginBottom:'0.3rem'}}>SUBMITTED</div>
                                        <div style={{fontSize:'1.3rem', fontWeight:'bold'}}>142</div>
                                    </div>
                                    <div style={{textAlign:'center', background:'rgba(255,255,255,0.02)', padding:'1rem', borderRadius:'12px'}}>
                                        <div style={{fontSize:'0.7rem', color:'var(--text-muted)', marginBottom:'0.3rem'}}>ACCEPTED</div>
                                        <div style={{fontSize:'1.3rem', fontWeight:'bold', color: '#10b981'}}>118</div>
                                    </div>
                                </div>
                            </div>

                            {/* ACCESS LOGS */}
                            <div style={{padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)'}}>
                                <h4 style={{margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px'}}>Evidence Access Log</h4>
                                <div style={{display: 'flex', flexDirection: 'column', gap: '0.8rem'}}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem'}}>
                                        <span>Researcher Submitted</span> <span style={{color: 'var(--text-muted)'}}>10m ago</span>
                                    </div>
                                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem'}}>
                                        <span>AI Analysis Run</span> <span style={{color: 'var(--primary)'}}>Just now</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}
