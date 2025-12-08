"use client";

const COLORS = { 
    primary: "#0f172a", 
    success: "#10b981", 
    textLight: "#64748b",
    border: "#e2e8f0"
};

export default function Timeline({ history = [] }) {
    // Ordena do mais recente para o mais antigo para visualização
    // Garante que é um array para evitar erro de .reverse() em undefined
    const sorted = Array.isArray(history) ? [...history].reverse() : [];

    return (
        <div style={{ position: 'relative', paddingLeft: 20, borderLeft: `2px solid ${COLORS.border}`, marginTop: 15 }}>
            {sorted.map((h, i) => (
                <div key={i} style={{ position: 'relative', marginBottom: 20 }}>
                    {/* Bolinha da linha do tempo */}
                    <div style={{ 
                        position: 'absolute', left: -27, top: 0, width: 12, height: 12, borderRadius: '50%', 
                        background: i === 0 ? COLORS.success : '#cbd5e1', 
                        border: `2px solid #f8fafc`,
                        boxShadow: i === 0 ? `0 0 0 3px rgba(16, 185, 129, 0.2)` : 'none'
                    }}></div>
                    
                    {/* Texto do status */}
                    <div style={{ fontSize: 13, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? COLORS.primary : COLORS.textLight }}>
                        {h.descricao}
                    </div>
                    
                    {/* Data e Hora */}
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        {new Date(h.date).toLocaleString('pt-BR')}
                    </div>
                </div>
            ))}
            {sorted.length === 0 && <span style={{fontSize: 12, color: '#94a3b8', fontStyle:'italic'}}>Aguardando início...</span>}
        </div>
    );
}