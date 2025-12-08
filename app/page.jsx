"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// --- NOVOS COMPONENTES IMPORTADOS ---
import AdminUsers from "./components/admin-users";
import AdminFrota from "./components/admin-frota";
import DanfeRealista from "./components/danfe-realista";
import ChatWidget from "./components/chat-widget";
import Timeline from "./components/timeline";
import ToastContainer from "./components/toast";
import LandingPage from "./landingpage";
import { registerAction } from "./actions";

import { 
  getInitialData, 
  criarViagemAction, 
  atualizarViagemAction, 
  popularBancoAction 
} from "./actions";

import { 
  // ... outras
  loginAction, 
  logoutAction,
  checkSessionAction 
} from "./actions";

// --- MAPA DINÂMICO ---
const Map = dynamic(() => import("./components/map"), {
  ssr: false, 
  loading: () => (
    <div style={{
      height: '100%', width: '100%', background: '#f8fafc', 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      color: '#94a3b8'
    }}>
      <span style={{fontSize: 24, marginBottom: 10}}>🛰️</span>
      <span style={{fontWeight: 500}}>Conectando Satélite...</span>
    </div>
  ),
});

const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

/* ============================================================================
   DESIGN SYSTEM & ESTILOS GLOBAIS
============================================================================ */
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  
  body { background-color: #f1f5f9; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
  
  /* Scrollbar bonita */
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; borderRadius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

  @media print {
    body * { visibility: hidden; }
    .printable-area, .printable-area * { visibility: visible; }
    .printable-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
    .no-print { display: none !important; }
    @page { size: A4; margin: 0; }
  }
  .danfe-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(4px); z-index: 9999; display: flex; flex-direction: column; alignItems: center; padding: 20px 0; overflow-y: auto; }
  
  .star-rating { display: flex; gap: 8px; justify-content: center; margin: 15px 0; }
  .star-rating button { background: none; border: none; font-size: 32px; cursor: pointer; transition: transform 0.2s; padding: 0; }
  .star-rating button:hover { transform: scale(1.1); }
  .star-rating button.filled { color: #fbbf24; filter: drop-shadow(0 0 2px rgba(251, 191, 36, 0.5)); }
  .star-rating button.empty { color: #e2e8f0; }

  /* Utilitários de Animação */
  .fade-in { animation: fadeIn 0.4s ease-out; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
`;

const COLORS = { 
    primary: "#0f172a", // Slate 900
    primaryLight: "#1e293b",
    accent: "#3b82f6",  // Blue 500
    success: "#10b981", 
    warning: "#f59e0b", 
    danger: "#ef4444", 
    bg: "#f8fafc",      // Slate 50
    border: "#e2e8f0", 
    text: "#334155", 
    textLight: "#64748b" 
};

const styles = {
  container: { maxWidth: 1400, margin: "0 auto", padding: "0 20px 100px 20px" },
  header: { background: "white", padding: "0 30px", height: 70, display: "flex", justifyContent: "space-between", alignItems: "center", position: 'sticky', top: 0, zIndex: 100, borderBottom: `1px solid ${COLORS.border}`, marginBottom: 30 },
  card: { background: "white", padding: 25, borderRadius: 16, border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.02), 0 1px 2px -1px rgba(0, 0, 0, 0.02)", marginBottom: 20, transition: 'all 0.2s ease' },
  input: { width: "100%", padding: "12px 16px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: '#f8fafc', outline: "none", fontSize: 14, transition: 'all 0.2s', color: COLORS.primary },
  select: { width: "100%", padding: "12px 16px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "white", outline: "none", fontSize: 14, color: COLORS.primary },
  btn: { padding: "12px 24px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: "600", fontSize: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s', letterSpacing: '0.02em' },
  badge: { padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: "700", textTransform: "uppercase", display: 'inline-flex', alignItems: 'center', gap: 6, letterSpacing: '0.5px' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 },
  checklistItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '16px', border: `1px solid ${COLORS.border}`, borderRadius: 8, marginBottom: 8, background: '#f8fafc' },
};

// --- COMPONENTE: INPUT DE ENDEREÇO (Google Style) ---
const AddressInput = ({ label, placeholder, value, onChange, onSelect }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setShowList(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (value && value.length > 3 && showList) {
        setLoading(true);
        try {
          const query = `${value}, Brazil`;
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=4`;
          const res = await fetch(url);
          const data = await res.json();
          setSuggestions(data);
        } catch (e) { console.error(e); }
        setLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [value, showList]);

  const handleSelect = (item) => {
    const mainName = item.address.road || item.address.building || item.display_name.split(',')[0];
    onSelect({ lat: parseFloat(item.lat), lng: parseFloat(item.lon), nome: item.display_name, nomeCurto: mainName });
    setShowList(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', marginBottom: 15 }}>
      <label style={{ fontSize: 11, color: COLORS.textLight, fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>{label}</label>
      <div style={{position: 'relative'}}>
        <span style={{position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, opacity: 0.7}}>
            {label.includes('Origem') ? '🔵' : '🏁'}
        </span>
        <input
          style={{ ...styles.input, marginBottom: 0, paddingLeft: 44, borderColor: showList ? COLORS.accent : COLORS.border }} 
          placeholder={placeholder}
          value={value}
          onChange={(e) => { onChange(e.target.value); setShowList(true); }}
          onFocus={() => value.length > 2 && setShowList(true)}
        />
        {loading && <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12 }}>🔄</div>}
      </div>
      
      {showList && suggestions.length > 0 && (
        <ul style={{
          position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0,
          background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 12,
          listStyle: 'none', padding: 0, margin: 0, zIndex: 9999,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', 
          overflow: 'hidden'
        }}>
          {suggestions.map((s, i) => (
            <li key={i} onClick={() => handleSelect(s)} style={{
              padding: '12px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              <div style={{background: '#e2e8f0', borderRadius: '50%', width: 28, height: 28, display:'flex', alignItems:'center', justifyContent:'center', fontSize: 14}}>📍</div>
              <div style={{display:'flex', flexDirection:'column'}}>
                  <span style={{fontSize: 13, fontWeight: 600, color: COLORS.primary}}>{s.address.road || s.display_name.split(',')[0]}</span>
                  <span style={{fontSize: 11, color: COLORS.textLight}}>{s.address.suburb || s.address.city}, {s.address.state}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Em page.jsx

export default function App() {
  const [user, setUser] = useState(null);
  // Estado inicial dos dados
  const [data, setData] = useState({ users: [], viagens: [], veiculos: [], messages: [] });
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  
  // Controla se mostra a Landing Page ou o Login
  const [showLogin, setShowLogin] = useState(false);

  // Sistema de Notificações (Toasts)
  const notify = (title, msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // 1. EFEITO: VERIFICAR SESSÃO AO CARREGAR (Persistência)
  useEffect(() => {
    const initSession = async () => {
      try {
        const sessionUser = await checkSessionAction();
        if (sessionUser) {
          setUser(sessionUser);
          // Opcional: notify('Bem-vindo de volta', `Sessão restaurada para ${sessionUser.name}`, 'info');
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      } finally {
        // Se não houver sessão, apenas remove o loading inicial da verificação
        // A checagem de dados (fetchData) removerá o loading da tela inteira
      }
    };
    initSession();
  }, []);

  // 2. FUNÇÃO: BUSCAR DADOS DO SERVIDOR (Polling)
  const fetchData = async () => {
    try {
      const serverData = await getInitialData();
      setData(serverData);
    } catch (error) { 
      console.error("Erro dados:", error); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Atualiza a cada 5 segundos para manter o "tempo real"
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // 3. FUNÇÃO: LOGIN REAL (Server Action)
  const handleLogin = async (email, password) => {
    // Chama o Server Action seguro importado de actions.jsx
    const result = await loginAction(email, password);
    
    if (result.success) {
        setUser(result.user);
        notify('Acesso Autorizado', `Bem-vindo à plataforma, ${result.user.name.split(' ')[0]}.`, 'success');
    } else {
        notify('Acesso Negado', result.error, 'error');
    }
  };

  // 4. FUNÇÃO: LOGOUT REAL
  const handleLogout = async () => {
      await logoutAction();
      setUser(null);
      setShowLogin(false);
      notify('Desconectado', 'Sessão encerrada com sucesso.', 'info');
  };

  // --- RENDERIZAÇÃO ---

  // Tela de Carregamento Inicial
  if (loading) {
    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: COLORS.bg, color: COLORS.textLight }}>
            <span style={{ fontSize: 40, marginBottom: 20 }}>📦</span>
            <span style={{ letterSpacing: 2, fontWeight: 600 }}>CAIOLOG SYSTEMS</span>
        </div>
    );
  }

  // A. MOSTRA A LANDING PAGE (Se não logado e não solicitou login)
  if (!user && !showLogin) {
    return (
      <>
        <style>{GLOBAL_STYLES}</style>
        <LandingPage onEnterSystem={() => setShowLogin(true)} />
      </>
    );
  }

  // B. MOSTRA A TELA DE LOGIN (Se não logado e clicou em "Área do Cliente")
  if (!user && showLogin) {
    return (
      <>
        <style>{GLOBAL_STYLES}</style>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <LoginScreen 
            onLogin={handleLogin} // Passa a função corrigida
            hasUsers={data.users.length > 0} 
            onRefresh={fetchData} 
            onBack={() => setShowLogin(false)} 
        />
      </>
    );
  }

  // C. SISTEMA LOGADO (Dashboard)
  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh' }}>
      <style>{GLOBAL_STYLES}</style>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <Header user={user} logout={handleLogout} />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: 20 }}>
        {user.role === "admin" && <AdminDashboard data={data} user={user} onRefresh={fetchData} notify={notify} />}
        {user.role === "motorista" && <MotoristaDashboard user={user} viagens={data.viagens} onRefresh={fetchData} notify={notify} />}
        {user.role === "cliente" && <ClienteDashboard user={user} viagens={data.viagens} onRefresh={fetchData} notify={notify} />}

        <div className="no-print" style={{ marginTop: 80, textAlign: 'center', borderTop: `1px solid ${COLORS.border}`, paddingTop: 30 }}>
          <small style={{ color: COLORS.textLight, fontWeight: 500 }}>CAIOLOG ENTERPRISE v3.0 &bull; Powered by Leaflet & OSRM Routing</small>
        </div>
      </main>

      <ChatWidget user={user} viagens={data.viagens} messages={data.messages} onRefresh={fetchData} />
    </div>
  );
}
// --- DASHBOARD: ADMIN (TORRE DE CONTROLE) ---
function AdminDashboard({ data, user, onRefresh, notify }) {
  const [tab, setTab] = useState('viagens');
  
  const stats = {
    total: data.viagens.length,
    receita: data.viagens.filter(v => !v.canceled).reduce((acc, curr) => acc + Number(curr.valor), 0),
    pendentes: data.viagens.filter(v => v.status === 'pendente').length,
    rota: data.viagens.filter(v => v.status === 'em rota').length
  };

  return (
    <div>
      {/* HEADER DO DASHBOARD */}
      <div style={{marginBottom: 30}}>
        <h2 style={{fontSize: 24, fontWeight: 700, color: COLORS.primary, margin: 0}}>Torre de Controle</h2>
        <p style={{margin: '5px 0 0', color: COLORS.textLight}}>Visão geral da operação logística em tempo real.</p>
      </div>

      {/* KPIs */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40}}>
         <StatCard icon="📦" label="Total de Cargas" value={stats.total} />
         <StatCard icon="💰" label="Receita Projetada" value={formatMoney(stats.receita)} color={COLORS.success} />
         <StatCard icon="🕒" label="Aguardando Motorista" value={stats.pendentes} color={COLORS.warning} />
         <StatCard icon="🚚" label="Veículos em Rota" value={stats.rota} color={COLORS.info} />
      </div>

      {/* ABAS DE NAVEGAÇÃO */}
      <div style={{display: 'flex', gap: 5, marginBottom: 25, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 0}}>
        {[
            {id: 'viagens', label: 'Gestão de Cargas'}, 
            {id: 'usuarios', label: 'Base de Usuários'}, 
            {id: 'frota', label: 'Frota de Veículos'}
        ].map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
                padding: '12px 24px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
                background: tab===t.id ? 'white' : 'transparent', 
                color: tab===t.id ? COLORS.primary : COLORS.textLight,
                borderBottom: tab===t.id ? `2px solid ${COLORS.accent}` : '2px solid transparent',
                marginBottom: -1
            }}>
                {t.label}
            </button>
        ))}
      </div>

      {tab === "viagens" && <AdminViagens viagens={data.viagens} users={data.users} veiculos={data.veiculos} onRefresh={onRefresh} notify={notify} />}
      {tab === "usuarios" && <AdminUsers users={data.users} onRefresh={onRefresh} />}
      {tab === "frota" && <AdminFrota veiculos={data.veiculos} onRefresh={onRefresh} />}
    </div>
  );
}

function AdminViagens({ viagens, users, veiculos, onRefresh, notify }) {
  const [form, setForm] = useState({ desc: "", valor: "", clienteId: "", motoristaId: "" });
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState("");
  const [modalDanfe, setModalDanfe] = useState(null);
  const [modalMapa, setModalMapa] = useState(null);
  const [locOrigem, setLocOrigem] = useState(null);
  const [locDestino, setLocDestino] = useState(null);
  const [txtOrigem, setTxtOrigem] = useState("");
  const [txtDestino, setTxtDestino] = useState("");

  const clientes = users.filter(u => u.role === 'cliente');
  const motoristas = users.filter(u => u.role === 'motorista');

  const criar = async (e) => {
    e.preventDefault();
    if (!form.clienteId || !locOrigem || !locDestino) return notify("Erro", "Preencha todos os dados!", "error");
    setLoading(true);
    await criarViagemAction({
      desc: form.desc, valor: form.valor, clienteId: form.clienteId, motoristaId: form.motoristaId || null, 
      origem: locOrigem.nomeCurto || locOrigem.nome, origemCompleto: locOrigem.nome,
      destino: locDestino.nomeCurto || locDestino.nome, destinoCompleto: locDestino.nome,
      lat: locOrigem.lat, lng: locOrigem.lng, destLat: locDestino.lat, destLng: locDestino.lng
    });
    setLoading(false);
    setForm({ desc: "", valor: "", clienteId: "", motoristaId: "" });
    setLocOrigem(null); setLocDestino(null); setTxtOrigem(""); setTxtDestino("");
    notify("Sucesso", "Ordem de serviço criada com sucesso!", "success");
    onRefresh();
  };

  const handleCancel = async (id) => { if(confirm("Cancelar carga?")) { await atualizarViagemAction(id, { canceled: true, status: 'cancelado' }); onRefresh(); } }
  const viagensFiltradas = viagens.filter(v => v.codigo.toLowerCase().includes(busca.toLowerCase()) || v.descricao.toLowerCase().includes(busca.toLowerCase()) || (v.motoristaNome && v.motoristaNome.toLowerCase().includes(busca.toLowerCase())));

  return (
    <>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 350px', gap: 30, alignItems: 'start'}}>
        {/* FORMULÁRIO DE NOVA CARGA */}
        <div style={styles.card}>
          <div style={{paddingBottom: 15, borderBottom: `1px solid ${COLORS.border}`, marginBottom: 20}}>
              <h3 style={{margin:0, fontSize: 16, display:'flex', alignItems:'center', gap: 10}}>➕ Criar Nova Ordem de Serviço</h3>
          </div>
          <form onSubmit={criar} style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
                <div>
                    <label style={{fontSize:11, fontWeight:'bold', color: COLORS.textLight, marginBottom:5, display:'block'}}>DESCRIÇÃO DA CARGA</label>
                    <input style={styles.input} placeholder="Ex: Eletrônicos Frágeis - Lote 50" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} required />
                </div>
                <div>
                    <label style={{fontSize:11, fontWeight:'bold', color: COLORS.textLight, marginBottom:5, display:'block'}}>VALOR DA NOTA</label>
                    <input style={styles.input} type="number" placeholder="R$ 0,00" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} required />
                </div>
            </div>

            <div style={{background: '#f8fafc', padding: 15, borderRadius: 12, border: `1px solid ${COLORS.border}`}}>
                <AddressInput label="📍 ENDEREÇO DE COLETA (ORIGEM)" placeholder="Digite a rua, número e cidade..." value={txtOrigem} onChange={setTxtOrigem} onSelect={(d) => { setLocOrigem(d); setTxtOrigem(d.nome); }} />
                <div style={{height: 10}}></div>
                <AddressInput label="🏁 ENDEREÇO DE ENTREGA (DESTINO)" placeholder="Digite o endereço final..." value={txtDestino} onChange={setTxtDestino} onSelect={(d) => { setLocDestino(d); setTxtDestino(d.nome); }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                    <label style={{fontSize:11, fontWeight:'bold', color: COLORS.textLight, marginBottom:5, display:'block'}}>CLIENTE SOLICITANTE</label>
                    <select style={{ ...styles.select }} value={form.clienteId} onChange={e => setForm({ ...form, clienteId: e.target.value })} required>
                        <option value="">Selecione na lista...</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{fontSize:11, fontWeight:'bold', color: COLORS.textLight, marginBottom:5, display:'block'}}>MOTORISTA RESPONSÁVEL</label>
                    <select style={{ ...styles.select }} value={form.motoristaId} onChange={e => setForm({ ...form, motoristaId: e.target.value })}>
                        <option value="">-- Deixar em Aberto (Mural) --</option>
                        {motoristas.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
            </div>

            <button disabled={loading} style={{ ...styles.btn, background: loading ? COLORS.textLight : COLORS.primary, color: 'white', height: 50, width: '100%', marginTop: 10 }}>
              {loading ? "PROCESSANDO..." : "EMITIR ORDEM E CALCULAR ROTA"}
            </button>
          </form>
        </div>

        {/* MAPA DE PREVIEW */}
        <div style={{...styles.card, padding: 0, overflow: 'hidden', height: 550, display:'flex', flexDirection:'column', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}>
            <div style={{padding: 15, borderBottom: `1px solid ${COLORS.border}`, background: 'white'}}>
                <h4 style={{margin:0, fontSize: 13, color: COLORS.textLight, fontWeight: 600, textTransform: 'uppercase'}}>📡 Pré-visualização da Rota</h4>
            </div>
            <div style={{flex: 1, position: 'relative'}}>
                <Map origem={locOrigem} destino={locDestino} height="100%" />
            </div>
        </div>
      </div>

      <div style={{marginTop: 50, display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom: 20}}>
          <div>
            <h3 style={{margin:0, fontSize: 18, color: COLORS.primary}}>Histórico de Operações</h3>
            <p style={{margin:'5px 0 0', fontSize: 13, color: COLORS.textLight}}>Acompanhe todas as viagens registradas no sistema.</p>
          </div>
          <div style={{position:'relative'}}>
             <input style={{ ...styles.input, width: 300, paddingLeft: 35, background:'white' }} placeholder="Buscar por código ou descrição..." value={busca} onChange={e => setBusca(e.target.value)} />
             <span style={{position:'absolute', left: 12, top: 12, fontSize: 14, opacity: 0.5}}>🔍</span>
          </div>
      </div>

      <div style={{ display: 'grid', gap: 15 }}>
        {viagensFiltradas.map(v => (
          <div key={v.id} style={{ ...styles.card, padding: 0, display: 'flex', overflow:'hidden', borderLeft: `5px solid ${getStatusColor(v.status, v.canceled)}` }}>
            <div style={{padding: 25, flex: 1}}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                    <span style={{fontFamily: 'monospace', background: COLORS.bg, padding: '4px 8px', borderRadius: 4, fontSize: 12, border: `1px solid ${COLORS.border}`, fontWeight: 600}}>{v.codigo}</span>
                    <StatusBadge status={v.status} canceled={v.canceled} />
                    <span style={{fontSize: 12, color: COLORS.textLight}}>Atualizado em: {new Date(v.updatedAt).toLocaleDateString()}</span>
                </div>
                
                <h4 style={{ margin: '0 0 10px 0', fontSize: 16, fontWeight: 600, color: COLORS.primary }}>{v.descricao}</h4>
                
                <div style={{display:'flex', gap: 30, color: COLORS.text, fontSize: 13}}>
                     <div style={{display:'flex', alignItems:'center', gap: 8}}>
                        <div style={{width: 8, height: 8, borderRadius: '50%', background: COLORS.accent}}></div>
                        <strong>Origem:</strong> {v.origem}
                     </div>
                     <div style={{display:'flex', alignItems:'center', gap: 8}}>
                        <div style={{width: 8, height: 8, borderRadius: '50%', background: COLORS.danger}}></div>
                        <strong>Destino:</strong> {v.destino}
                     </div>
                </div>

                <div style={{marginTop: 15, display:'flex', gap: 15, alignItems:'center'}}>
                    {v.motoristaNome ? (
                         <div style={{background: '#eff6ff', padding: '6px 12px', borderRadius: 20, fontSize: 12, color: COLORS.info, display:'flex', gap: 6, fontWeight: 500}}>
                             🚐 {v.motoristaNome}
                         </div>
                    ) : (!v.canceled && <span style={{fontSize: 12, color: COLORS.warning, fontStyle:'italic'}}>⚠️ Aguardando motorista aceitar</span>)}
                </div>

                {/* TIMELINE VISUAL */}
                <div style={{marginTop: 20, paddingTop: 20, borderTop: `1px dashed ${COLORS.border}`}}>
                    <strong style={{fontSize: 11, color: COLORS.textLight, textTransform: 'uppercase'}}>Rastreamento em Tempo Real</strong>
                    <Timeline history={v.history} />
                </div>

                {/* FEEDBACK BOX - ADMIN VIEW */}
                {(v.rating || v.avaliacao) > 0 && (
                    <div style={{marginTop: 20, padding: 15, background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, display:'flex', gap: 15, alignItems:'flex-start'}}>
                        <div style={{fontSize: 20}}>⭐</div>
                        <div>
                            <div style={{fontSize: 13, fontWeight: 'bold', color: '#b45309', marginBottom: 2}}>Avaliação do Cliente: {v.rating || v.avaliacao}.0</div>
                            <p style={{margin: 0, fontSize: 13, fontStyle: 'italic', color: '#78350f'}}>"{v.feedback || v.comentario || 'Nenhum comentário textual.'}"</p>
                        </div>
                    </div>
                )}
            </div>

            <div style={{ width: 180, background: '#f8fafc', borderLeft: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', gap: 10, padding: 20, justifyContent: 'center' }}>
                <button onClick={() => setModalMapa(v)} style={{ ...styles.btn, background: 'white', border: `1px solid ${COLORS.border}`, color: COLORS.text, width: '100%', fontSize: 12 }}>🗺️ Ver Rota</button>
                <button onClick={() => setModalDanfe(v)} style={{ ...styles.btn, background: 'white', border: `1px solid ${COLORS.border}`, color: COLORS.text, width: '100%', fontSize: 12 }}>📄 Nota Fiscal</button>
                {v.status === 'pendente' && !v.canceled && (
                    <button onClick={() => handleCancel(v.id)} style={{ ...styles.btn, background: '#fef2f2', border: '1px solid #fecaca', color: COLORS.danger, width: '100%', fontSize: 12 }}>✕ Cancelar</button>
                )}
            </div>
          </div>
        ))}
      </div>
      {modalDanfe && <DanfeRealista viagem={modalDanfe} users={users} veiculos={veiculos} onClose={()=>setModalDanfe(null)} />}
      {modalMapa && <RouteModal viagem={modalMapa} onClose={()=>setModalMapa(null)} />}
    </>
  );
}

// --- DASHBOARD: MOTORISTA (MOBILE FIRST) ---
function MotoristaDashboard({ user, viagens, onRefresh, notify }) {
    const [checklistModal, setChecklistModal] = useState(null);
    const [modalMapa, setModalMapa] = useState(null);
    
    const disponiveis = viagens.filter(v => v.status === 'pendente' && !v.motoristaId && !v.canceled);
    const minhas = viagens.filter(v => v.motoristaId === user.id && !v.canceled);

    const assumir = async (id) => { if(confirm("Confirma que irá realizar esta corrida?")) { await atualizarViagemAction(id, { motoristaId: user.id }); notify("Corrida Aceita!", "Dirija-se à coleta.", "success"); onRefresh(); } };
    const iniciar = async (id, checklist) => { await atualizarViagemAction(id, { status: 'em rota', checklist }); setChecklistModal(null); notify("Em Rota!", "Cuidado na estrada.", "success"); onRefresh(); };
    const entregar = async (id, otp) => {
        const senha = prompt("🔒 SENHA DE SEGURANÇA:\nSolicite os 4 dígitos ao cliente para finalizar:");
        if(senha === otp) { await atualizarViagemAction(id, { status: 'entregue' }); notify("Entrega Confirmada!", "Parabéns pelo serviço.", "success"); onRefresh(); } 
        else { notify("Senha Incorreta", "Tente novamente.", "error"); }
    };

    return (
        <div style={{maxWidth: 800, margin: '0 auto'}}>
            {/* MINHAS TAREFAS (DESTAQUE) */}
            <h3 style={{fontSize: 18, color: COLORS.primary, marginBottom: 15, display:'flex', alignItems:'center', gap: 8}}>
                📍 Minhas Missões Atuais <span style={{fontSize:12, background: COLORS.accent, color:'white', padding:'2px 8px', borderRadius:10}}>{minhas.filter(v=>v.status!=='entregue').length}</span>
            </h3>
            
            <div style={{display:'grid', gap: 20, marginBottom: 50}}>
                {minhas.filter(v => v.status !== 'entregue').length === 0 && (
                    <div style={{textAlign:'center', padding: 40, border: `2px dashed ${COLORS.border}`, borderRadius: 16, color: COLORS.textLight}}>
                        <div style={{fontSize: 40, marginBottom: 10}}>💤</div>
                        Sem corridas ativas no momento.<br/>Verifique o mural abaixo.
                    </div>
                )}
                {minhas.filter(v => v.status !== 'entregue').map(v => (
                    <div key={v.id} style={{...styles.card, borderLeft: `6px solid ${v.status === 'em rota' ? COLORS.info : COLORS.warning}`, padding: 25}}>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom: 15}}>
                             <StatusBadge status={v.status} />
                             <button onClick={()=>setModalMapa(v)} style={{background: '#eff6ff', border: 'none', borderRadius: '50%', width: 44, height: 44, fontSize: 20, cursor: 'pointer', color: COLORS.accent}}>🗺️</button>
                        </div>
                        
                        <h2 style={{margin:'0 0 5px 0', fontSize: 18, color: COLORS.primary}}>{v.descricao}</h2>
                        <div style={{marginBottom: 20, fontSize: 14, color: COLORS.textLight}}>Cod: {v.codigo}</div>

                        <div style={{background: '#f8fafc', padding: 15, borderRadius: 8, marginBottom: 20, display:'flex', flexDirection:'column', gap: 10}}>
                             <div style={{display:'flex', gap: 10}}><span style={{width: 20}}>🟦</span> <div><small style={{fontWeight:'bold', color: COLORS.textLight}}>COLETA</small><br/>{v.origem}</div></div>
                             <div style={{display:'flex', gap: 10}}><span style={{width: 20}}>🏁</span> <div><small style={{fontWeight:'bold', color: COLORS.textLight}}>ENTREGA</small><br/>{v.destino}</div></div>
                        </div>

                        {v.status === 'pendente' && (
                             <button onClick={()=>setChecklistModal(v)} style={{...styles.btn, background: COLORS.primary, color:'white', width:'100%', height: 50, fontSize: 14}}>▶️ INICIAR ROTA</button>
                        )}
                        {v.status === 'em rota' && (
                             <button onClick={()=>entregar(v.id, v.otp)} style={{...styles.btn, background: COLORS.success, color:'white', width:'100%', height: 50, fontSize: 14}}>✅ FINALIZAR ENTREGA</button>
                        )}
                    </div>
                ))}
            </div>

            {/* MURAL */}
            <h3 style={{fontSize: 18, color: COLORS.primary, marginBottom: 15}}>📡 Mural de Oportunidades</h3>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 15}}>
                {disponiveis.length === 0 && <p style={{color: COLORS.textLight}}>Nenhuma nova corrida na região.</p>}
                {disponiveis.map(v => (
                    <div key={v.id} style={styles.card}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <strong style={{color: COLORS.success, fontSize: 18}}>{formatMoney(v.valor)}</strong>
                            <span style={{fontSize:11, background: '#f1f5f9', padding:'2px 6px', borderRadius: 4}}>{v.codigo}</span>
                        </div>
                        <p style={{fontWeight:600, margin: '10px 0', color: COLORS.primary}}>{v.descricao}</p>
                        <div style={{fontSize:12, color: COLORS.textLight, lineHeight: 1.6}}>
                            <strong>De:</strong> {v.origem}<br/><strong>Para:</strong> {v.destino}
                        </div>
                        <button onClick={() => assumir(v.id)} style={{...styles.btn, background: COLORS.primary, color: 'white', marginTop: 15, width: '100%'}}>ACEITAR CORRIDA</button>
                    </div>
                ))}
            </div>

            {checklistModal && <ChecklistModal v={checklistModal} onConfirm={iniciar} onCancel={()=>setChecklistModal(null)} />}
            {modalMapa && <RouteModal viagem={modalMapa} onClose={()=>setModalMapa(null)} />}
        </div>
    );
}

// --- DASHBOARD: CLIENTE (E-COMMERCE TRACKING) ---
function ClienteDashboard({ user, viagens, onRefresh, notify }) {
    const [ratingModal, setRatingModal] = useState(null);
    const [modalMapa, setModalMapa] = useState(null);
    const minhas = viagens.filter(v => v.clienteId === user.id);

    const enviarAvaliacao = async (id, stars, comment) => {
        await atualizarViagemAction(id, { rating: stars, feedback: comment });
        setRatingModal(null);
        notify("Obrigado!", "Sua avaliação foi enviada.", "success");
        onRefresh();
    };

    return (
        <div>
            <h3 style={{fontSize: 22, marginBottom: 20}}>📦 Meus Pedidos</h3>
            {minhas.length === 0 && <div style={{...styles.card, textAlign:'center', color: COLORS.textLight, padding: 50}}>Você ainda não realizou nenhum pedido conosco.</div>}
            
            <div style={{display:'grid', gap: 25}}>
                {minhas.map(v => (
                    <div key={v.id} style={{...styles.card, padding: 0, overflow: 'hidden'}}>
                        {/* Header do Pedido */}
                        <div style={{background: '#f8fafc', padding: '15px 25px', borderBottom: `1px solid ${COLORS.border}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div>
                                <span style={{fontSize: 11, fontWeight: 'bold', color: COLORS.textLight, textTransform: 'uppercase'}}>PEDIDO REALIZADO EM</span><br/>
                                <span style={{fontSize: 13}}>{new Date(v.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div>
                                <span style={{fontSize: 11, fontWeight: 'bold', color: COLORS.textLight, textTransform: 'uppercase'}}>TOTAL</span><br/>
                                <span style={{fontSize: 13}}>{formatMoney(v.valor)}</span>
                            </div>
                            <div style={{textAlign: 'right'}}>
                                <span style={{fontSize: 11, fontWeight: 'bold', color: COLORS.textLight, textTransform: 'uppercase'}}>CÓDIGO</span><br/>
                                <span style={{fontSize: 13, fontFamily: 'monospace'}}>{v.codigo}</span>
                            </div>
                        </div>

                        <div style={{padding: 25, display: 'grid', gridTemplateColumns: '1fr 300px', gap: 30}}>
                            <div>
                                <h3 style={{margin: '0 0 10px 0', fontSize: 18, color: COLORS.accent}}>{v.descricao}</h3>
                                <p style={{fontSize: 14, color: COLORS.textLight, margin: 0}}>Enviado para: <strong>{v.destino}</strong></p>
                                
                                <div style={{marginTop: 25, display:'flex', alignItems:'center', gap: 15}}>
                                    <StatusBadge status={v.status} canceled={v.canceled} />
                                    {v.status === 'em rota' && <span style={{fontSize: 12, color: COLORS.info, fontWeight:'bold'}}>Chega hoje!</span>}
                                </div>

                                {/* TIMELINE PARA O CLIENTE */}
                                <div style={{marginTop: 20}}>
                                    <Timeline history={v.history} />
                                </div>
                            </div>

                            <div style={{display:'flex', flexDirection:'column', gap: 10}}>
                                <button onClick={()=>setModalMapa(v)} style={{...styles.btn, background: COLORS.primary, color:'white', width:'100%'}}>Rastrear Pacote</button>
                                
                                {v.status !== 'entregue' && !v.canceled && (
                                    <div style={{background: '#fff7ed', border: `1px dashed ${COLORS.accent}`, padding: 15, borderRadius: 8, textAlign:'center'}}>
                                        <small style={{fontWeight:'bold', color: COLORS.accent, display:'block', marginBottom: 5}}>SENHA DE RECEBIMENTO</small>
                                        <span style={{fontSize: 24, fontWeight: 800, color: COLORS.primary, letterSpacing: 2}}>{v.otp}</span>
                                        <small style={{display:'block', fontSize: 10, color: '#78350f', marginTop: 5}}>Informe ao motorista na entrega</small>
                                    </div>
                                )}

                                {v.status === 'entregue' && !v.avaliacao && (
                                    <button onClick={()=>setRatingModal(v)} style={{...styles.btn, background: COLORS.warning, color:'white', width:'100%'}}>Avaliar Entrega</button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {ratingModal && <FeedbackModal viagem={ratingModal} onConfirm={enviarAvaliacao} onClose={()=>setRatingModal(null)} />}
            {modalMapa && <RouteModal viagem={modalMapa} onClose={()=>setModalMapa(null)} />}
        </div>
    );
}

// --- TELAS E MODAIS AUXILIARES ---

// Em page.jsx -> Substitua apenas o componente LoginScreen

function LoginScreen({ onLogin, hasUsers, onRefresh, onBack }) {
    const [loading, setLoading] = useState(false);
    
    // Apenas Login
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async () => {
        setLoading(true);
        await onLogin(email, password);
        setLoading(false);
    };

    const whatsappLink = "https://wa.me/558185219181?text=Olá,%20gostaria%20de%20solicitar%20um%20acesso%20de%20cliente%20ao%20sistema.";

    return (
        <div style={{height:'100vh', width:'100%', display:'grid', gridTemplateColumns: '1fr 1fr', fontFamily: "'Inter', sans-serif"}}>
            
            {/* LADO ESQUERDO - LOGIN */}
            <div style={{display:'flex', flexDirection:'column', justifyContent:'center', padding: '0 100px', background:'white', position:'relative'}}>
                <button onClick={onBack} style={{position:'absolute', top: 40, left: 40, background:'none', border:'none', cursor:'pointer', color: COLORS.textLight, fontSize: 14}}>← Voltar para Home</button>
                
                <div style={{marginBottom: 30}}>
                    <img src="/logo.png" alt="CAIOLOG" style={{height: 55, marginBottom: 25, objectFit: 'contain', display: 'block'}} />

                    <h1 style={{fontSize: 32, fontWeight: 900, color: '#0f172a', margin: '0 0 10px 0', letterSpacing: -1}}>
                        Bem-vindo de volta.
                    </h1>
                    <p style={{color: '#64748b', fontSize: 16, lineHeight: 1.6}}>
                        Insira suas credenciais corporativas para acessar.
                    </p>
                </div>

                <div style={{display:'flex', flexDirection:'column', gap: 15}}>
                    
                    <div className="fade-in">
                        <label style={{display:'block', fontSize: 12, fontWeight:'bold', color:'#334155', marginBottom: 5}}>EMAIL CORPORATIVO</label>
                        <input 
                            style={{width:'100%', padding:'16px', borderRadius: 12, border:'1px solid #e2e8f0', background:'#f8fafc', outline:'none', fontSize: 15, color: COLORS.primary}} 
                            placeholder="ex: nome@empresa.com" 
                            value={email} 
                            onChange={e=>setEmail(e.target.value)} 
                        />
                    </div>
                    
                    <div className="fade-in">
                        <label style={{display:'block', fontSize: 12, fontWeight:'bold', color:'#334155', marginBottom: 5}}>SENHA</label>
                        <input 
                            style={{width:'100%', padding:'16px', borderRadius: 12, border:'1px solid #e2e8f0', background:'#f8fafc', outline:'none', fontSize: 15, color: COLORS.primary}} 
                            type="password" 
                            placeholder="••••••••" 
                            value={password} 
                            onChange={e=>setPassword(e.target.value)} 
                        />
                    </div>

                    <button 
                        onClick={handleSubmit} 
                        disabled={loading}
                        style={{marginTop: 10, padding: 18, borderRadius: 12, border:'none', background: '#0f172a', color:'white', fontWeight:'bold', fontSize: 16, cursor:'pointer', transition: '0.2s', opacity: loading ? 0.7 : 1}}
                    >
                        {loading ? 'AUTENTICANDO...' : 'ACESSAR PAINEL →'}
                    </button>
                </div>

                {/* RODAPÉ - REDIRECIONA PARA WHATSAPP */}
                <div style={{marginTop: 30, textAlign:'center', fontSize: 14, color: COLORS.textLight}}>
                    Não possui acesso? <a href={whatsappLink} target="_blank" style={{color: COLORS.accent, fontWeight:'bold', textDecoration:'none'}}>Fale com nosso comercial</a>
                </div>

                {/* BOTÃO DE DEV (Aparece apenas se banco vazio) */}
                {!hasUsers && <button onClick={async ()=>{ await popularBancoAction(); onRefresh(); }} style={{marginTop:30, color: '#b45309', background:'none', border:'none', cursor:'pointer', fontSize:12, display:'block', margin:'20px auto'}}>🛠️ Popular Banco de Dados (Modo Dev)</button>}
            </div>

            {/* LADO DIREITO (Imagem) */}
            <div style={{background: '#0f172a', position:'relative', overflow:'hidden', display: 'flex', alignItems:'flex-end'}}>
                <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop" style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', objectFit:'cover', opacity: 0.6}} />
                <div style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', background: 'linear-gradient(to top, #0f172a 10%, transparent 80%)'}}></div>
                <div style={{position:'relative', zIndex: 10, padding: 60, color: 'white'}}>
                    <div style={{background:'rgba(255,255,255,0.1)', backdropFilter:'blur(10px)', padding: '20px 30px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.2)', maxWidth: 500}}>
                        <h2 style={{marginTop:0, fontSize: 24}}>Logística Segura</h2>
                        <p style={{opacity: 0.8, lineHeight: 1.6}}>Área restrita para clientes e parceiros autorizados CAIOLOG.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
function RouteModal({ viagem, onClose }) {
    const o = { lat: viagem.lat, lng: viagem.lng, nome: viagem.origem };
    const d = { lat: viagem.destLat, lng: viagem.destLng, nome: viagem.destino };
    return (
        <div style={styles.modal} onClick={onClose}>
            <div style={{background:'white', width: '90%', maxWidth: 900, borderRadius: 16, overflow:'hidden', position:'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'}} onClick={e=>e.stopPropagation()}>
                <div style={{padding: 20, background: 'white', borderBottom: `1px solid ${COLORS.border}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>
                        <strong style={{fontSize: 16, color: COLORS.primary}}>Monitoramento de Rota</strong>
                        <div style={{fontSize: 12, color: COLORS.textLight}}>{viagem.origem} ➝ {viagem.destino}</div>
                    </div>
                    <button onClick={onClose} style={{border:'none', background:'#f1f5f9', width:30, height:30, borderRadius:15, cursor:'pointer'}}>✕</button>
                </div>
                <Map origem={o} destino={d} height="550px" />
            </div>
        </div>
    );
}

function FeedbackModal({ viagem, onConfirm, onClose }) {
    const [stars, setStars] = useState(0);
    const [comment, setComment] = useState("");
    return (
        <div style={styles.modal}>
             <div style={{background:'white', padding: 40, borderRadius:24, width: 450, textAlign:'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'}}>
                 <div style={{fontSize: 50, marginBottom: 10}}>🎉</div>
                 <h2 style={{marginTop:0, color: COLORS.primary}}>Pedido Entregue!</h2>
                 <p style={{color: COLORS.textLight, marginBottom: 30}}>Sua encomenda chegou ao destino. Como você avalia o serviço do motorista?</p>
                 <div className="star-rating">
                    {[1,2,3,4,5].map(s => (<button key={s} className={s <= stars ? 'filled' : 'empty'} onClick={()=>setStars(s)}>★</button>))}
                 </div>
                 <textarea style={{...styles.input, height: 100, marginTop: 25, resize: 'none'}} placeholder="Conte-nos sua experiência (opcional)..." value={comment} onChange={e=>setComment(e.target.value)} />
                 <div style={{display:'flex', gap: 10, marginTop: 30}}>
                     <button onClick={()=>onConfirm(viagem.id, stars, comment)} disabled={stars===0} style={{...styles.btn, background: stars===0 ? COLORS.border : COLORS.primary, color:'white', flex:1, height: 45}}>ENVIAR AVALIAÇÃO</button>
                     <button onClick={onClose} style={{...styles.btn, background: 'transparent', color: COLORS.textLight}}>Pular</button>
                 </div>
             </div>
        </div>
    );
}

function ChecklistModal({ v, onConfirm, onCancel }) {
    const [check, setCheck] = useState({ pneus: false, oleo: false, carga: false, doc: false });
    const allChecked = Object.values(check).every(Boolean);
    return (
        <div style={styles.modal}>
            <div style={{background:'white', padding:30, borderRadius:16, width:400}}>
                <h3 style={{marginTop:0, color: COLORS.primary}}>🛡️ Protocolo de Segurança</h3>
                <p style={{fontSize:13, color: COLORS.textLight, marginBottom:20}}>Para iniciar a viagem <strong>{v.codigo}</strong>, é obrigatório a conferência dos itens abaixo:</p>
                <div style={styles.checklistItem}><input type="checkbox" onChange={e=>setCheck({...check, pneus:e.target.checked})} /> <span>🛞 Pneus calibrados e estepe ok</span></div>
                <div style={styles.checklistItem}><input type="checkbox" onChange={e=>setCheck({...check, oleo:e.target.checked})} /> <span>🛢️ Níveis de óleo e fluídos ok</span></div>
                <div style={styles.checklistItem}><input type="checkbox" onChange={e=>setCheck({...check, carga:e.target.checked})} /> <span>📦 Carga acondicionada e segura</span></div>
                <div style={styles.checklistItem}><input type="checkbox" onChange={e=>setCheck({...check, doc:e.target.checked})} /> <span>📄 Documentação (CNH e CRLV)</span></div>
                <button onClick={()=>onConfirm(v.id, check)} disabled={!allChecked} style={{...styles.btn, background: allChecked ? COLORS.success : COLORS.border, color:'white', width:'100%', marginTop:20, height: 45}}>CONFIRMAR CHECKLIST E PARTIR</button>
                <button onClick={onCancel} style={{...styles.btn, background:'transparent', color:COLORS.textLight, width:'100%', marginTop:5}}>Cancelar Operação</button>
            </div>
        </div>
    );
}

// --- PEQUENOS COMPONENTES VISUAIS ---
function Header({ user, logout }) {
  return (
    <header style={styles.header} className="no-print">
      {/* LOGO NOVA NO HEADER DO SISTEMA */}
      <img src="/logo.png" alt="CAIOLOG Logo" style={{height: 40}} />
      <div style={{display:'flex', alignItems:'center', gap: 20}}>
          <div style={{textAlign:'right', display:'none', sm: 'block'}}>
              <div style={{fontSize: 13, fontWeight: 600, color: COLORS.primary}}>{user.name}</div>
              <div style={{fontSize: 11, color: COLORS.textLight, textTransform: 'uppercase'}}>{user.role}</div>
          </div>
          <button onClick={logout} style={{...styles.btn, background: '#fee2e2', color: COLORS.danger, padding: '8px 16px', fontSize: 12}}>SAIR</button>
      </div>
    </header>
  );
}

function StatCard({ icon, label, value, color = COLORS.primary }) {
    return (
        <div style={{...styles.card, padding: 25, display:'flex', alignItems:'center', gap: 20, marginBottom: 0, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'}}>
            <div style={{width: 50, height: 50, borderRadius: 12, background: `${color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize: 24, color: color}}>{icon}</div>
            <div>
                <h2 style={{margin:0, fontSize: 28, fontWeight: 700, color: COLORS.primary, letterSpacing: -1}}>{value}</h2>
                <span style={{fontSize: 12, color: COLORS.textLight, fontWeight: 600, textTransform:'uppercase', letterSpacing: 0.5}}>{label}</span>
            </div>
        </div>
    );
}

function StatusBadge({ status, canceled }) {
    let bg = COLORS.border, col = COLORS.text, icon = '⚪';
    if(canceled) { bg = '#fef2f2'; col = COLORS.danger; icon='🔴'; }
    else if(status==='entregue') { bg = '#ecfdf5'; col = COLORS.success; icon='🟢'; }
    else if(status==='em rota') { bg = '#eff6ff'; col = COLORS.info; icon='🔵'; }
    else if(status==='pendente') { bg = '#fffbeb'; col = COLORS.warning; icon='🟠'; }
    return <span style={{...styles.badge, background: bg, color: col}}>{icon} {canceled ? "CANCELADO" : status}</span>;
}

function getStatusColor(status, canceled) {
    if(canceled) return COLORS.danger;
    if(status==='entregue') return COLORS.success;
    if(status==='em rota') return COLORS.info;
    return COLORS.warning;
}