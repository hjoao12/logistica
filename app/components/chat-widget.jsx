"use client";

import { useState, useEffect, useRef } from "react";
import { enviarMensagemAction } from "../actions";

// Cores necessárias
const COLORS = { 
    primary: "#0f172a", 
    accent: "#3b82f6",  
    border: "#e2e8f0", 
    text: "#334155", 
    textLight: "#64748b",
    danger: "#ef4444"
};

// CORREÇÃO AQUI: Adicionei " = []" em viagens e messages para evitar o erro de undefined
export default function ChatWidget({ user, viagens = [], messages = [], onRefresh }) {
    const [isOpen, setIsOpen] = useState(false);
    const [msg, setMsg] = useState("");
    const [activeViagemId, setActiveViagemId] = useState("");
    
    // Filtra viagens ativas (não entregues/canceladas)
    // O erro acontecia aqui pois 'viagens' chegava como undefined
    const viagensAtivas = viagens.filter(v => 
        (user.role === 'admin' || v.clienteId === user.id || v.motoristaId === user.id) && 
        !v.canceled && v.status !== 'entregue'
    );

    // Seleciona automaticamente a primeira viagem ativa se houver
    useEffect(() => {
        if (viagensAtivas.length > 0 && !activeViagemId) {
            setActiveViagemId(viagensAtivas[0].id);
        }
    }, [viagensAtivas, activeViagemId]);

    // O erro também poderia acontecer aqui se 'messages' fosse undefined
    const activeMessages = messages.filter(m => m.viagemId == activeViagemId);
    const scrollRef = useRef(null);

    useEffect(() => {
        if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [activeMessages, isOpen]);

    const send = async (e) => {
        e.preventDefault();
        if (!msg.trim() || !activeViagemId) return;
        await enviarMensagemAction(activeViagemId, user.id, msg);
        setMsg("");
        onRefresh();
    };

    if (!user) return null;

    return (
        <div className="no-print" style={{position: 'fixed', bottom: 30, right: 30, zIndex: 1000, display:'flex', flexDirection:'column', alignItems:'flex-end'}}>
            
            {/* JANELA DO CHAT */}
            {isOpen && (
                <div style={{
                    marginBottom: 15, width: 380, height: 500, background: 'white', borderRadius: 16,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    border: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden'
                }}>
                    {/* CABEÇALHO */}
                    <div style={{padding: '15px 20px', background: COLORS.primary, color: 'white', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <div>
                            <h4 style={{margin:0, fontSize: 14}}>Central de Mensagens</h4>
                            <span style={{fontSize: 11, opacity: 0.8}}>Conectado como {user.name}</span>
                        </div>
                        <button onClick={()=>setIsOpen(false)} style={{background:'rgba(255,255,255,0.2)', border:'none', color:'white', width:24, height:24, borderRadius:'50%', cursor:'pointer'}}>✕</button>
                    </div>

                    {/* SELETOR DE CONTEXTO (VIAGEM) */}
                    <div style={{padding: 10, borderBottom: `1px solid ${COLORS.border}`, background: '#f8fafc'}}>
                        {viagensAtivas.length > 0 ? (
                            <select 
                                value={activeViagemId} 
                                onChange={(e)=>setActiveViagemId(e.target.value)}
                                style={{width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: 12, outline: 'none'}}
                            >
                                {viagensAtivas.map(v => (
                                    <option key={v.id} value={v.id}>
                                        🚚 {v.codigo} - {v.descricao.substring(0, 25)}...
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div style={{fontSize: 12, color: COLORS.textLight, textAlign:'center', padding: 5}}>Nenhuma viagem ativa para conversar.</div>
                        )}
                    </div>

                    {/* ÁREA DE MENSAGENS */}
                    <div ref={scrollRef} style={{flex: 1, padding: 20, overflowY: 'auto', background: '#f8fafc', display:'flex', flexDirection:'column', gap: 10}}>
                        {activeMessages.length === 0 && (
                            <div style={{textAlign:'center', color: COLORS.textLight, marginTop: 40, fontSize: 13}}>
                                👋 Inicie a conversa sobre esta carga.<br/>O histórico ficará salvo aqui.
                            </div>
                        )}
                        {activeMessages.map(m => {
                            const isMe = m.senderId === user.id;
                            return (
                                <div key={m.id} style={{alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%'}}>
                                    <div style={{
                                        padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.4,
                                        background: isMe ? COLORS.primary : 'white',
                                        color: isMe ? 'white' : COLORS.text,
                                        border: isMe ? 'none' : `1px solid ${COLORS.border}`,
                                        borderBottomRightRadius: isMe ? 2 : 12,
                                        borderBottomLeftRadius: isMe ? 12 : 2,
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    }}>
                                        {!isMe && <div style={{fontSize: 10, fontWeight: 700, marginBottom: 4, color: COLORS.accent}}>{m.senderName}</div>}
                                        {m.text}
                                    </div>
                                    <div style={{fontSize: 9, color: COLORS.textLight, marginTop: 4, textAlign: isMe ? 'right' : 'left'}}>
                                        {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* INPUT */}
                    <form onSubmit={send} style={{padding: 15, background: 'white', borderTop: `1px solid ${COLORS.border}`, display:'flex', gap: 10}}>
                        <input 
                            placeholder={activeViagemId ? "Digite sua mensagem..." : "Selecione uma viagem..."}
                            value={msg} 
                            onChange={e=>setMsg(e.target.value)}
                            disabled={!activeViagemId}
                            style={{flex: 1, padding: '10px 15px', borderRadius: 20, border: `1px solid ${COLORS.border}`, outline:'none', fontSize: 13}}
                        />
                        <button 
                            disabled={!msg.trim() || !activeViagemId}
                            style={{
                                background: COLORS.primary, color: 'white', border: 'none', width: 40, height: 40, borderRadius: '50%', 
                                cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition: '0.2s',
                                opacity: (!msg.trim() || !activeViagemId) ? 0.5 : 1
                            }}
                        >
                            ➤
                        </button>
                    </form>
                </div>
            )}

            {/* BOTÃO FLUTUANTE (FAB) */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: 60, height: 60, borderRadius: 30, background: COLORS.primary, color: 'white', border: 'none',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.3)', cursor: 'pointer', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'transform 0.2s'
                }}
                onMouseEnter={e=>e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e=>e.currentTarget.style.transform = 'scale(1)'}
            >
                {isOpen ? '✕' : '💬'}
            </button>
            {!isOpen && <div style={{position:'absolute', top: 0, right: 0, width: 16, height: 16, background: COLORS.danger, borderRadius: '50%', border:'2px solid white'}}></div>}
        </div>
    );
}