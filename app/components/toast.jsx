"use client";
import { useEffect, useState } from "react";

const COLORS = { 
    success: "#10b981", 
    danger: "#ef4444", 
    accent: "#3b82f6",
    primary: "#0f172a",
    textLight: "#64748b"
};

export default function ToastContainer({ toasts = [], removeToast }) {
    return (
        <div style={{
            position: 'fixed', top: 20, right: 20, zIndex: 10000, 
            display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' 
        }}>
            {toasts.map(t => (
                <div key={t.id} className="toast-enter" style={{
                    background: 'white', padding: '16px 20px', borderRadius: 8, width: 320, pointerEvents: 'auto',
                    borderLeft: `5px solid ${t.type === 'success' ? COLORS.success : t.type === 'error' ? COLORS.danger : COLORS.accent}`,
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 15,
                    animation: 'slideInRight 0.3s ease-out forwards'
                }}>
                    <div style={{fontSize: 20}}>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</div>
                    <div style={{flex: 1}}>
                        <strong style={{display: 'block', fontSize: 14, color: COLORS.primary}}>{t.title}</strong>
                        <span style={{fontSize: 12, color: COLORS.textLight}}>{t.msg}</span>
                    </div>
                    <button onClick={() => removeToast(t.id)} style={{border:'none', background:'transparent', cursor:'pointer', color:'#ccc'}}>✕</button>
                </div>
            ))}
            <style jsx>{`
                @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            `}</style>
        </div>
    );
}