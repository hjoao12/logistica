"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// --- MAPA DINÂMICO ---
const Map = dynamic(() => import("./components/map"), {
  ssr: false,
  loading: () => <div className="loading-map">📡 Satélite CAIOLOG...</div>,
});

/* ============================================================================
   ESTRUTURA INTELIGENTE DE CIDADES POR ESTADO
============================================================================ */
const ESTADOS_E_CIDADES = {
  "AC": { nome: "Acre", cidades: ["Rio Branco", "Cruzeiro do Sul", "Sena Madureira"] },
  "AL": { nome: "Alagoas", cidades: ["Maceió", "Arapiraca", "Palmeira dos Índios"] },
  "AP": { nome: "Amapá", cidades: ["Macapá", "Santana", "Laranjal do Jari"] },
  "AM": { nome: "Amazonas", cidades: ["Manaus", "Parintins", "Itacoatiara", "Manacapuru"] },
  "BA": { nome: "Bahia", cidades: ["Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari", "Juazeiro"] },
  "CE": { nome: "Ceará", cidades: ["Fortaleza", "Caucaia", "Juazeiro do Norte", "Maracanaú", "Sobral"] },
  "DF": { nome: "Distrito Federal", cidades: ["Brasília"] },
  "ES": { nome: "Espírito Santo", cidades: ["Vitória", "Vila Velha", "Serra", "Cariacica", "Linhares"] },
  "GO": { nome: "Goiás", cidades: ["Goiânia", "Aparecida de Goiânia", "Anápolis", "Rio Verde", "Luziânia"] },
  "MA": { nome: "Maranhão", cidades: ["São Luís", "Imperatriz", "Timon", "Caxias", "Codó"] },
  "MT": { nome: "Mato Grosso", cidades: ["Cuiabá", "Várzea Grande", "Rondonópolis", "Sinop", "Tangará da Serra"] },
  "MS": { nome: "Mato Grosso do Sul", cidades: ["Campo Grande", "Dourados", "Três Lagoas", "Corumbá", "Ponta Porã"] },
  "MG": { nome: "Minas Gerais", cidades: ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Betim", "Montes Claros", "Ribeirão das Neves"] },
  "PA": { nome: "Pará", cidades: ["Belém", "Ananindeua", "Santarém", "Marabá", "Castanhal"] },
  "PB": { nome: "Paraíba", cidades: ["João Pessoa", "Campina Grande", "Santa Rita", "Patos", "Bayeux"] },
  "PR": { nome: "Paraná", cidades: ["Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel", "São José dos Pinhais"] },
  "PE": { nome: "Pernambuco", cidades: ["Recife", "Jaboatão dos Guararapes", "Olinda", "Caruaru", "Petrolina", "Paulista"] },
  "PI": { nome: "Piauí", cidades: ["Teresina", "Parnaíba", "Picos", "Piripiri", "Floriano"] },
  "RJ": { nome: "Rio de Janeiro", cidades: ["Rio de Janeiro", "São Gonçalo", "Duque de Caxias", "Nova Iguaçu", "Niterói", "Belford Roxo", "Campos dos Goytacazes"] },
  "RN": { nome: "Rio Grande do Norte", cidades: ["Natal", "Mossoró", "Parnamirim", "São Gonçalo do Amarante", "Macaíba"] },
  "RS": { nome: "Rio Grande do Sul", cidades: ["Porto Alegre", "Caxias do Sul", "Pelotas", "Canoas", "Santa Maria", "Gravataí", "Novo Hamburgo"] },
  "RO": { nome: "Rondônia", cidades: ["Porto Velho", "Ji-Paraná", "Ariquemes", "Vilhena", "Cacoal"] },
  "RR": { nome: "Roraima", cidades: ["Boa Vista", "Rorainópolis", "Caracaraí", "Alto Alegre"] },
  "SC": { nome: "Santa Catarina", cidades: ["Florianópolis", "Joinville", "Blumenau", "São José", "Criciúma", "Chapecó", "Itajaí"] },
  "SP": { nome: "São Paulo", cidades: ["São Paulo", "Guarulhos", "Campinas", "São Bernardo do Campo", "Santo André", "Osasco", "São José dos Campos", "Ribeirão Preto", "Sorocaba", "Mauá"] },
  "SE": { nome: "Sergipe", cidades: ["Aracaju", "Nossa Senhora do Socorro", "Lagarto", "Itabaiana", "Estância"] },
  "TO": { nome: "Tocantins", cidades: ["Palmas", "Araguaína", "Gurupi", "Porto Nacional", "Paraíso do Tocantins"] }
};

// Coordenadas aproximadas para cada capital
const COORDENADAS_CIDADES = {
  "São Paulo": { lat: -23.55, lng: -46.63 },
  "Rio de Janeiro": { lat: -22.90, lng: -43.17 },
  "Belo Horizonte": { lat: -19.91, lng: -43.93 },
  "Porto Alegre": { lat: -30.03, lng: -51.21 },
  "Salvador": { lat: -12.97, lng: -38.50 },
  "Recife": { lat: -8.05, lng: -34.88 },
  "Fortaleza": { lat: -3.73, lng: -38.52 },
  "Manaus": { lat: -3.12, lng: -60.02 },
  "Curitiba": { lat: -25.43, lng: -49.27 },
  "Goiânia": { lat: -16.69, lng: -49.26 },
  "Campinas": { lat: -22.90, lng: -47.06 },
  "Santos": { lat: -23.96, lng: -46.33 },
  "Niterói": { lat: -22.88, lng: -43.11 },
  "Uberlândia": { lat: -18.91, lng: -48.27 },
  "Feira de Santana": { lat: -12.27, lng: -38.95 },
  "Caxias do Sul": { lat: -29.16, lng: -51.17 }
};

/* ============================================================================
   ESTILOS GLOBAIS & UTILITÁRIOS (ATUALIZADO)
============================================================================ */
const GLOBAL_STYLES = `
  @media print {
    body * { visibility: hidden; }
    .printable-area, .printable-area * { visibility: visible; }
    .printable-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
    .no-print { display: none !important; }
    @page { size: A4; margin: 0; }
  }
  
  /* Estilos da DANFE Realista */
  .danfe-box { border: 1px solid #000; margin-bottom: -1px; margin-right: -1px; padding: 2px 4px; position: relative; }
  .danfe-label { font-size: 8px; text-transform: uppercase; color: #444; display: block; line-height: 1; margin-bottom: 2px; }
  .danfe-value { font-size: 11px; font-weight: bold; color: #000; display: block; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .danfe-group { display: flex; width: 100%; }
  .danfe-col { flex: 1; border: 1px solid #000; margin-right: -1px; margin-bottom: -1px; padding: 2px 4px; }
  .danfe-title { font-weight: bold; font-size: 10px; background: #eee; padding: 2px; border: 1px solid #000; border-bottom: none; margin-top: 5px; text-transform: uppercase; }
  
  .barcode {
    height: 35px;
    background: repeating-linear-gradient(90deg, #000 0px, #000 1px, #fff 1px, #fff 3px);
    width: 100%;
    margin-top: 5px;
  }
  
  /* Estrelas e UI Geral */
  .star-rating { display: inline-flex; gap: 5px; }
  .star-rating .star { font-size: 24px; cursor: pointer; transition: transform 0.2s; }
  .star-rating .star:hover { transform: scale(1.2); }
  .star-rating .star.filled { color: #fbbf24; }
  .star-rating .star.empty { color: #d1d5db; }
  
  @keyframes slideInUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .chat-message { animation: slideInUp 0.3s ease-out; }
`;

const COLORS = {
  primary: "#0f172a", 
  accent: "#f97316",
  success: "#15803d",
  warning: "#f59e0b",
  danger: "#dc2626",
  info: "#3b82f6",
  bg: "#f8fafc",
  border: "#e2e8f0",
  text: "#334155",
  textLight: "#64748b"
};

const styles = {
  container: { padding: 20, maxWidth: 1400, margin: "0 auto", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", background: COLORS.bg, minHeight: "100vh", color: COLORS.text, paddingBottom: 100 },
  header: { background: COLORS.primary, color: "white", padding: "15px 30px", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30, boxShadow: "0 4px 10px rgba(0,0,0,0.1)" },
  card: { background: "white", padding: 25, borderRadius: 12, border: `1px solid ${COLORS.border}`, boxShadow: "0 2px 4px rgba(0,0,0,0.05)", marginBottom: 20, position: 'relative' },
  input: { width: "100%", padding: 12, borderRadius: 6, border: `1px solid ${COLORS.border}`, outline: "none", marginBottom: 10, fontSize: 14 },
  textarea: { width: "100%", padding: 12, borderRadius: 6, border: `1px solid ${COLORS.border}`, outline: "none", marginBottom: 10, fontSize: 14, minHeight: 80, resize: "vertical" },
  select: { width: "100%", padding: 12, borderRadius: 6, border: `1px solid ${COLORS.border}`, outline: "none", marginBottom: 10, fontSize: 14, background: "white" },
  btn: { padding: "12px 20px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: "600", fontSize: 12, letterSpacing: 0.5, transition: "0.2s", display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  badge: { padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: "800", textTransform: "uppercase", display: 'inline-flex', alignItems: 'center', gap: 4 },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 },
  chatBtn: { position: 'fixed', bottom: 20, right: 20, width: 60, height: 60, borderRadius: '50%', background: COLORS.accent, color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', zIndex: 1000, fontSize: 24, display: 'flex', alignItems:'center', justifyContent:'center' },
  chatWindow: { position: 'fixed', bottom: 90, right: 20, width: 320, height: 400, background: 'white', borderRadius: 12, boxShadow: '0 5px 20px rgba(0,0,0,0.2)', zIndex: 1000, display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'slideInUp 0.3s ease-out' },
  checklistItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f1f5f9' },
  timeline: { display: 'flex', justifyContent: 'space-between', position: 'relative', marginTop: 30, padding: "0 20px" }
};

const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();
const getCityCoords = (cityName) => COORDENADAS_CIDADES[cityName] || { lat: -23.55, lng: -46.63 };

/* ============================================================================
   HOOK: LOCALSTORAGE
============================================================================ */
function useLocalStorage(key, initialValue) {
  const [val, setVal] = useState(initialValue);
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) setVal(JSON.parse(item));
    } catch (e) { console.error(e); }
  }, [key]);

  const setSticky = (v) => {
    try {
      const valueToStore = v instanceof Function ? v(val) : v;
      setVal(valueToStore);
      if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (e) { console.error(e); }
  };
  return [val, setSticky];
}

/* ============================================================================
   DADOS PADRÃO (Base v9.0 com todas as novas funcionalidades)
============================================================================ */
const DATA_SEED = {
  users: [
    { id: 1, name: "Admin Geral", email: "admin", password: "123", role: "admin", cnpj: "00.000.000/0001-91", phone: "(11) 99999-9999", company: "CAIOLOG" },
    { id: 2, name: "Magazine Luiza", email: "magalu", password: "123", role: "cliente", cnpj: "47.960.950/0001-21", phone: "(11) 3333-4444", company: "Magazine Luiza S.A." },
    { id: 3, name: "Carlos Motorista", email: "carlos", password: "123", role: "motorista", cnh: "12345678900", phone: "(11) 98888-8888", vehicle: "Fiorino" },
    { id: 4, name: "Americanas S.A.", email: "americanas", password: "123", role: "cliente", cnpj: "33.000.118/0001-36", phone: "(21) 2222-3333", company: "Americanas" }
  ],
  viagens: [
    { 
      id: 1054, 
      codigo: "CL-9981", 
      descricao: "Lote de Notebooks Dell - 50 unidades", 
      clienteId: 2, 
      motoristaId: 3, 
      veiculo: "ABC-1234", 
      status: "pendente", 
      valor: 45000, 
      origem: "São Paulo - SP", 
      destino: "Rio de Janeiro - RJ", 
      lat: -23.55, 
      lng: -46.63, 
      destLat: -22.90, 
      destLng: -43.17, 
      otp: "9988", 
      peso: "350kg",
      dimensoes: "2.5x1.8x2.0m",
      canceled: false, 
      cancelReason: null, 
      rating: null,
      feedback: null,
      feedbackDate: null,
      history: [{status: 'pendente', date: new Date().toISOString(), descricao: 'Pedido registrado no sistema'}],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      checklist: { pneus: false, oleo: false, carga_presa: false, documentacao: false }
    },
    { 
      id: 1055, 
      codigo: "CL-5512", 
      descricao: "Eletrodomésticos - Geladeiras e Fogões", 
      clienteId: 4, 
      motoristaId: null, 
      veiculo: null, 
      status: "pendente", 
      valor: 32000, 
      origem: "Campinas - SP", 
      destino: "Belo Horizonte - MG", 
      lat: -22.90, 
      lng: -47.06, 
      destLat: -19.91, 
      destLng: -43.93, 
      otp: "5512", 
      peso: "850kg",
      dimensoes: "4.0x2.2x2.5m",
      canceled: false,
      rating: null,
      feedback: null,
      history: [{status: 'pendente', date: new Date().toISOString(), descricao: 'Pedido registrado no sistema'}],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      checklist: { pneus: false, oleo: false, carga_presa: false, documentacao: false }
    },
    { 
      id: 1053, 
      codigo: "CL-3344", 
      descricao: "Móveis Escritório - Mesas e Cadeiras", 
      clienteId: 2, 
      motoristaId: 3, 
      veiculo: "ABC-1234", 
      status: "entregue", 
      valor: 18500, 
      origem: "São Paulo - SP", 
      destino: "Santos - SP", 
      lat: -23.55, 
      lng: -46.63, 
      destLat: -23.96, 
      destLng: -46.33, 
      otp: "3344", 
      peso: "280kg",
      canceled: false,
      rating: 5,
      feedback: "Entrega rápida e segura. Motorista muito educado!",
      feedbackDate: new Date().toISOString(),
      history: [
        {status: 'pendente', date: new Date(Date.now() - 172800000).toISOString(), descricao: 'Pedido registrado'},
        {status: 'em rota', date: new Date(Date.now() - 86400000).toISOString(), descricao: 'Saiu para entrega'},
        {status: 'entregue', date: new Date(Date.now() - 43200000).toISOString(), descricao: 'Entrega confirmada'}
      ],
      signature: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDIwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEwIDUwQzIwIDMwIDQwIDYwIDYwIDQwQzgwIDIwIDEwMCA3MCAxMjAgNTBDMTQwIDMwIDE2MCA4MCAxODAgNjAiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 43200000).toISOString(),
      checklist: { pneus: true, oleo: true, carga_presa: true, documentacao: true }
    }
  ],
  veiculos: [
    { placa: "ABC-1234", modelo: "Fiat Fiorino", tipo: "Furgão", capacidade: "800kg", status: "ativo", ano: 2022 },
    { placa: "XYZ-9876", modelo: "Mercedes Atego", tipo: "Caminhão", capacidade: "5ton", status: "ativo", ano: 2021 }
  ],
  // Novo: Sistema de mensagens/chat
  messages: [
    { id: 1, viagemId: 1054, senderId: 2, senderName: "Magazine Luiza", text: "Quando será entregue?", timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 2, viagemId: 1054, senderId: 3, senderName: "Carlos Motorista", text: "Estou a caminho, chegarei em 30min", timestamp: new Date(Date.now() - 1800000).toISOString() }
  ]
};

/* ============================================================================
   APP ROOT
============================================================================ */
export default function App() {
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState(null);

  // Tabelas do "Banco de Dados"
  const [users, setUsers] = useLocalStorage("caiolog_v9_users", DATA_SEED.users);
  const [viagens, setViagens] = useLocalStorage("caiolog_v9_viagens", DATA_SEED.viagens);
  const [veiculos, setVeiculos] = useLocalStorage("caiolog_v9_veiculos", DATA_SEED.veiculos);
  const [messages, setMessages] = useLocalStorage("caiolog_v9_messages", DATA_SEED.messages);

  useEffect(() => setIsMounted(true), []);

  const login = (email, password) => {
    const found = users.find(u => u.email === email && u.password === password);
    if (found) setUser(found);
    else alert("Usuário não encontrado! Tente: admin / 123");
  };

  const resetData = () => {
    if(confirm("Factory Reset: Isso apagará todos os dados!")) { 
      localStorage.clear(); 
      window.location.reload(); 
    }
  };

  if (!isMounted) return null;
  if (!user) return <LoginScreen onLogin={login} />;

  return (
    <div style={styles.container}>
      <style>{GLOBAL_STYLES}</style>
      <Header user={user} logout={() => setUser(null)} onReset={resetData} />
      
      <main style={{maxWidth: 1200, margin: "0 auto", padding: 20}}>
        {user.role === "admin" && <AdminDashboard data={{ viagens, veiculos, users, messages }} actions={{ setViagens, setVeiculos, setUsers, setMessages }} user={user} />}
        {user.role === "motorista" && <MotoristaDashboard user={user} viagens={viagens} setViagens={setViagens} messages={messages} setMessages={setMessages} />}
        {user.role === "cliente" && <ClienteDashboard user={user} viagens={viagens} setViagens={setViagens} users={users} messages={messages} setMessages={setMessages} />}
        
        {/* Merchandising no rodapé */}
        <CaiologAds />
      </main>

      {/* Chat de Suporte Global */}
      <ChatWidget user={user} viagens={viagens} messages={messages} setMessages={setMessages} />
    </div>
  );
}

/* ============================================================================
   MERCHANDISING COMPONENT
============================================================================ */
function CaiologAds() {
  return (
    <div style={{marginTop: 60, padding: 30, background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "white", borderRadius: 16, textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.3)"}} className="no-print">
      <div style={{fontSize: 40, marginBottom: 10}}>🚀</div>
      <h2 style={{margin:0, fontWeight:900, letterSpacing:1}}>CAIOLOG  — O FUTURO DA LOGÍSTICA</h2>
      <p style={{opacity:0.8, marginTop:10, fontSize:14, maxWidth: 600, margin: "10px auto"}}>
        Sistema completo com checklist de segurança, avaliação pós-entrega, chat integrado e gestão inteligente de cidades por estado.
      </p>
      <div style={{display:'flex', justifyContent:'center', gap: 20, marginTop: 20, fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.6}}>
        <span>🔒 Checklist Segurança</span> • <span>⭐ Avaliação 5 estrelas</span> • <span>💬 Chat Integrado</span> • <span>🗺️ Cidades Inteligentes</span>
      </div>
    </div>
  )
}

/* ============================================================================
   CHAT WIDGET (ATUALIZADO COM VIAGEM ESPECÍFICA)
============================================================================ */
function ChatWidget({ user, viagens, messages, setMessages }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeViagem, setActiveViagem] = useState(null);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  // Filtra viagens do usuário atual
  const userViagens = viagens.filter(v => 
    user.role === 'cliente' ? v.clienteId === user.id :
    user.role === 'motorista' ? v.motoristaId === user.id :
    true // admin vê todas
  );

  // Filtra mensagens para a viagem ativa
  const filteredMessages = messages.filter(m => 
    activeViagem ? m.viagemId === activeViagem : true
  );

  useEffect(() => { 
    endRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [filteredMessages, isOpen]);

  const sendMessage = (e) => {
    e.preventDefault();
    if(!input.trim() || !activeViagem) return;
    
    const newMessage = { 
      id: Date.now(), 
      viagemId: activeViagem,
      senderId: user.id, 
      senderName: user.name,
      text: input, 
      timestamp: new Date().toISOString() 
    };
    
    setMessages([...messages, newMessage]);
    setInput("");
  };

  const getViagemInfo = (id) => {
    return viagens.find(v => v.id === id);
  };

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} style={styles.chatBtn}>
        {isOpen ? "✕" : "💬"}
        {userViagens.filter(v => v.status === 'em rota').length > 0 && (
          <span style={{
            position: 'absolute',
            top: -5,
            right: -5,
            background: COLORS.danger,
            color: 'white',
            borderRadius: '50%',
            width: 20,
            height: 20,
            fontSize: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {userViagens.filter(v => v.status === 'em rota').length}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div style={styles.chatWindow}>
          <div style={{background: COLORS.primary, color:'white', padding: 15, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span style={{fontWeight:'bold'}}>💬 Suporte CAIOLOG</span>
            <button onClick={() => setIsOpen(false)} style={{background:'transparent', border:'none', color:'white', cursor:'pointer', fontSize: 16}}>✕</button>
          </div>
          
          {/* Seletor de Viagem */}
          <div style={{padding: 10, borderBottom: '1px solid #eee', background: '#f8fafc'}}>
            <select 
              style={{...styles.select, marginBottom: 0, fontSize: 12}}
              value={activeViagem || ""}
              onChange={(e) => setActiveViagem(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Selecione uma viagem...</option>
              {userViagens.map(v => (
                <option key={v.id} value={v.id}>
                  {v.codigo} - {v.descricao.substring(0, 20)}...
                </option>
              ))}
            </select>
          </div>
          
          {/* Área de mensagens */}
          <div style={{flex: 1, padding: 10, overflowY:'auto', background: '#f8fafc', display:'flex', flexDirection:'column', gap: 10}}>
            {!activeViagem ? (
              <div style={{textAlign: 'center', padding: 20, color: COLORS.textLight}}>
                Selecione uma viagem para ver o histórico de mensagens
              </div>
            ) : filteredMessages.length === 0 ? (
              <div style={{textAlign: 'center', padding: 20, color: COLORS.textLight}}>
                Nenhuma mensagem nesta viagem. Inicie a conversa!
              </div>
            ) : (
              filteredMessages.map(m => {
                const isOwn = m.senderId === user.id;
                const viagemInfo = getViagemInfo(m.viagemId);
                return (
                  <div key={m.id} className="chat-message" style={{
                    alignSelf: isOwn ? 'flex-end' : 'flex-start',
                    background: isOwn ? COLORS.primary : 'white',
                    color: isOwn ? 'white' : COLORS.text,
                    padding: "8px 12px", 
                    borderRadius: 12, 
                    maxWidth: '85%',
                    fontSize: 13,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    borderBottomRightRadius: isOwn ? 4 : 12,
                    borderBottomLeftRadius: isOwn ? 12 : 4
                  }}>
                    <div style={{fontSize: 11, opacity: 0.8, marginBottom: 2}}>
                      {isOwn ? 'Você' : m.senderName} • {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div>{m.text}</div>
                    {viagemInfo && (
                      <div style={{fontSize: 10, opacity: 0.6, marginTop: 4}}>
                        Viagem: {viagemInfo.codigo}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={endRef}></div>
          </div>
          
          {/* Input de mensagem */}
          {activeViagem && (
            <form onSubmit={sendMessage} style={{display:'flex', borderTop: '1px solid #eee'}}>
              <input 
                style={{flex:1, border:'none', padding: 12, outline:'none', fontSize: 13}} 
                placeholder={`Digite uma mensagem para ${getViagemInfo(activeViagem)?.codigo}...`} 
                value={input} 
                onChange={e => setInput(e.target.value)} 
              />
              <button 
                type="submit" 
                disabled={!input.trim()}
                style={{
                  border:'none', 
                  background: input.trim() ? COLORS.primary : COLORS.border, 
                  color: input.trim() ? 'white' : COLORS.textLight, 
                  padding: "0 20px", 
                  cursor: input.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold'
                }}
              >
                ➤
              </button>
            </form>
          )}
        </div>
      )}
    </>
  )
}

/* ============================================================================
   UI COMPONENTS BASE
============================================================================ */
function Header({ user, logout, onReset }) {
  return (
    <header style={styles.header} className="no-print">
      <div style={{display:'flex', alignItems:'center', gap: 15}}>
        <div style={{fontSize: 28, background:'white', width:50, height:50, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color: COLORS.primary}}>📦</div>
        <div>
          <h1 style={{margin:0, fontSize: 22, fontWeight: 900, letterSpacing: 1}}>CAIOLOG </h1>
          <span style={{fontSize: 11, opacity: 0.8, textTransform:'uppercase'}}>
            {user.name} • {user.role.toUpperCase()}
          </span>
        </div>
      </div>
      <div style={{display:'flex', gap: 10}}>
        <button onClick={logout} style={{...styles.btn, background: COLORS.accent, color:'white'}}>SAIR</button>
        {user.role === 'admin' && (
          <button onClick={onReset} style={{...styles.btn, background:'transparent', border: '1px solid rgba(255,255,255,0.3)'}}>RESET</button>
        )}
      </div>
    </header>
  );
}

function StatusBadge({ status, canceled }) {
  if (canceled) {
    return (
      <span style={{...styles.badge, background: '#fee2e2', color: COLORS.danger}}>
        ⚠️ CANCELADO
      </span>
    );
  }
  
  const statusConfig = {
    pendente: { bg: "#fff7ed", color: "#c2410c", label: "AGUARDANDO", icon: "⏱️" },
    "em rota": { bg: "#eff6ff", color: "#1d4ed8", label: "EM TRÂNSITO", icon: "🚚" },
    entregue: { bg: "#f0fdf4", color: "#15803d", label: "ENTREGUE", icon: "✅" },
  };
  
  const config = statusConfig[status] || statusConfig.pendente;
  
  return (
    <span style={{...styles.badge, background: config.bg, color: config.color}}>
      {config.icon} {config.label}
    </span>
  );
}

/* ============================================================================
   COMPONENTES DE ESTRELAS DE AVALIAÇÃO
============================================================================ */
function StarRating({ rating, onRate, interactive = false, size = 24 }) {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= rating ? 'filled' : 'empty'}`}
          onClick={() => interactive && onRate(star)}
          style={{ 
            fontSize: `${size}px`,
            cursor: interactive ? 'pointer' : 'default'
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

/* ============================================================================
   COMPONENTE DE CHECKLIST DE SEGURANÇA
============================================================================ */
function SafetyChecklist({ checklist, onUpdate, disabled = false }) {
  const items = [
    { key: 'pneus', label: 'Pneus calibrados e em bom estado', icon: '🛞' },
    { key: 'oleo', label: 'Óleo do motor verificado', icon: '🛢️' },
    { key: 'carga_presa', label: 'Carga devidamente presa e segura', icon: '🔗' },
    { key: 'documentacao', label: 'Documentação em ordem (CT-e, DANFE)', icon: '📄' },
  ];

  const handleToggle = (key) => {
    if (disabled) return;
    onUpdate({ ...checklist, [key]: !checklist[key] });
  };

  const allChecked = items.every(item => checklist[item.key]);

  return (
    <div style={{ background: '#f8fafc', padding: 15, borderRadius: 8, marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h4 style={{ margin: 0, fontSize: 14 }}>🔒 Checklist de Segurança</h4>
        {allChecked && (
          <span style={{ fontSize: 12, color: COLORS.success, fontWeight: 'bold' }}>
            ✅ Tudo verificado
          </span>
        )}
      </div>
      
      {items.map(item => (
        <div key={item.key} style={styles.checklistItem}>
          <input
            type="checkbox"
            id={`checklist-${item.key}`}
            checked={checklist[item.key] || false}
            onChange={() => handleToggle(item.key)}
            disabled={disabled}
            style={{ width: 18, height: 18, cursor: disabled ? 'not-allowed' : 'pointer' }}
          />
          <label 
            htmlFor={`checklist-${item.key}`}
            style={{ 
              flex: 1, 
              fontSize: 13, 
              color: checklist[item.key] ? COLORS.text : COLORS.textLight,
              cursor: disabled ? 'default' : 'pointer',
              textDecoration: checklist[item.key] ? 'none' : 'none'
            }}
          >
            {item.icon} {item.label}
          </label>
          {checklist[item.key] && (
            <span style={{ color: COLORS.success, fontSize: 12 }}>✓</span>
          )}
        </div>
      ))}
      
      {!allChecked && (
        <div style={{ marginTop: 10, fontSize: 12, color: COLORS.warning, fontStyle: 'italic' }}>
          Todos os itens devem ser verificados antes de iniciar a rota
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   MODALS: QR, ASSINATURA, CANCELAMENTO, AVALIAÇÃO, DANFE
============================================================================ */

function SignaturePad({ onSave, onClose }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if(canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 3; 
      ctx.lineCap = 'round'; 
      ctx.strokeStyle = '#000';
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { 
      x: (e.clientX || e.touches[0].clientX) - rect.left, 
      y: (e.clientY || e.touches[0].clientY) - rect.top 
    };
  };

  const start = (e) => { 
    setIsDrawing(true); 
    const {x,y} = getPos(e); 
    const ctx = canvasRef.current.getContext('2d'); 
    ctx.beginPath(); 
    ctx.moveTo(x,y); 
  };
  
  const draw = (e) => { 
    if(!isDrawing) return; 
    const {x,y} = getPos(e); 
    const ctx = canvasRef.current.getContext('2d'); 
    ctx.lineTo(x,y); 
    ctx.stroke(); 
  };
  
  const stop = () => setIsDrawing(false);
  
  const save = () => onSave(canvasRef.current.toDataURL());

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={{background:'white', padding: 20, borderRadius: 10, width: '90%', maxWidth: 500}} onClick={e => e.stopPropagation()}>
        <h3>✍️ Assinatura do Recebedor</h3>
        <div style={{border:'2px dashed #ccc', height: 200, marginBottom: 15, touchAction: 'none'}}>
          <canvas 
            ref={canvasRef} 
            style={{width:'100%', height:'100%'}} 
            onMouseDown={start} 
            onMouseMove={draw} 
            onMouseUp={stop} 
            onMouseLeave={stop}
            onTouchStart={start} 
            onTouchMove={draw} 
            onTouchEnd={stop}
          />
        </div>
        <div style={{display: 'flex', gap: 10, marginBottom: 15}}>
          <button onClick={clearCanvas} style={{...styles.btn, background: COLORS.border, color: COLORS.text, flex: 1}}>
            🗑️ Limpar
          </button>
        </div>
        <div style={{display:'flex', gap: 10}}>
          <button onClick={save} style={{...styles.btn, background: COLORS.success, color:'white', flex: 1}}>CONFIRMAR</button>
          <button onClick={onClose} style={{...styles.btn, background: COLORS.primary, color:'white', flex: 1}}>CANCELAR</button>
        </div>
      </div>
    </div>
  )
}

function CancelModal({ onClose, onConfirm, isAdmin = false }) {
  const [reason, setReason] = useState("");
  const reasons = isAdmin 
    ? [
        "Cliente solicitou cancelamento",
        "Endereço incorreto",
        "Problema com a carga",
        "Motorista indisponível",
        "Outro motivo"
      ]
    : [
        "Arrependimento da compra",
        "Endereço incorreto",
        "Prazo muito longo",
        "Encontrei preço melhor",
        "Outro motivo"
      ];

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={{background:'white', padding: 20, borderRadius: 10, width: 400}} onClick={e => e.stopPropagation()}>
        <h3 style={{color: COLORS.danger, display: 'flex', alignItems: 'center', gap: 8}}>
          🚫 Cancelar Pedido
        </h3>
        <p style={{fontSize: 14, color: COLORS.text}}>
          {isAdmin 
            ? "Informe o motivo do cancelamento desta viagem:"
            : "Por que você deseja cancelar este pedido?"
          }
        </p>
        
        <div style={{marginBottom: 15}}>
          {reasons.map((r, i) => (
            <button
              key={i}
              onClick={() => setReason(r)}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                marginBottom: 5,
                background: reason === r ? '#fee2e2' : '#f8fafc',
                border: `1px solid ${reason === r ? COLORS.danger : COLORS.border}`,
                borderRadius: 6,
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 13,
                color: reason === r ? COLORS.danger : COLORS.text
              }}
            >
              {r}
            </button>
          ))}
        </div>
        
        <textarea 
          style={{...styles.textarea, marginBottom: 15}}
          placeholder="Descreva detalhes adicionais (opcional)..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
        
        <div style={{display:'flex', gap: 10}}>
          <button 
            onClick={() => { if(reason.trim()) onConfirm(reason); else alert("Por favor, informe um motivo."); }} 
            style={{...styles.btn, background: COLORS.danger, color:'white', flex: 1}}
          >
            CONFIRMAR CANCELAMENTO
          </button>
          <button onClick={onClose} style={{...styles.btn, background: '#f1f5f9', color: COLORS.text, flex: 1}}>
            VOLTAR
          </button>
        </div>
      </div>
    </div>
  )
}

function RatingModal({ onClose, onRate, viagem }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = () => {
    if (rating === 0) {
      alert("Por favor, selecione uma avaliação com estrelas.");
      return;
    }
    onRate(rating, feedback);
  };

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={{background:'white', padding: 30, borderRadius: 10, width: 400}} onClick={e => e.stopPropagation()}>
        <h3 style={{marginBottom: 5}}>Avalie sua Entrega</h3>
        <p style={{color: COLORS.textLight, fontSize: 14, marginBottom: 20}}>
          Viagem: <strong>{viagem?.codigo}</strong> • {viagem?.descricao?.substring(0, 30)}...
        </p>
        
        <div style={{textAlign: 'center', marginBottom: 20}}>
          <StarRating rating={rating} onRate={setRating} interactive={true} size={32} />
          <div style={{marginTop: 10, fontSize: 12, color: COLORS.textLight}}>
            {rating === 0 && "Selecione a quantidade de estrelas"}
            {rating === 1 && "Péssimo"}
            {rating === 2 && "Ruim"}
            {rating === 3 && "Regular"}
            {rating === 4 && "Bom"}
            {rating === 5 && "Excelente!"}
          </div>
        </div>
        
        <div style={{marginBottom: 20}}>
          <label style={{display: 'block', marginBottom: 5, fontSize: 14, fontWeight: 500}}>
            Comentário (opcional):
          </label>
          <textarea
            style={{...styles.textarea, minHeight: 80}}
            placeholder="Conte-nos sobre sua experiência com esta entrega..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>
        
        <div style={{display:'flex', gap: 10}}>
          <button 
            onClick={handleSubmit}
            style={{...styles.btn, background: COLORS.success, color:'white', flex: 1}}
          >
            ENVIAR AVALIAÇÃO
          </button>
          <button onClick={onClose} style={{...styles.btn, background: COLORS.border, color: COLORS.text, flex: 1}}>
            PULAR
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============================================================================
   DANFE REALISTA 2.0 (ORGANIZADO & COM BARRA DE AÇÕES)
============================================================================ */
function DanfeRealista({ viagem, users, veiculos, onClose }) {
  const cliente = users.find(u => u.id === Number(viagem.clienteId)) || { name: "Consumidor Final", cnpj: "000.000.000-00" };
  const motorista = users.find(u => u.id === Number(viagem.motoristaId));
  const veiculoInfo = veiculos.find(v => v.placa === viagem.veiculo);
  const nfeNum = `000.${String(viagem.id).padStart(3, '0')}.${String(viagem.id * 2).padStart(3, '0')}`;
  
  // CSS Específico para este componente (Scoped visualmente)
  const danfeStyles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' },
    toolbar: { background: '#1e293b', width: '210mm', padding: '10px 20px', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' },
    paper: { width: '210mm', minHeight: '297mm', background: 'white', padding: '10mm', position: 'relative', boxSizing: 'border-box', boxShadow: '0 0 20px rgba(0,0,0,0.5)', overflow: 'hidden' },
    row: { display: 'flex', border: '1px solid #000', borderBottom: 'none' },
    col: (flex = 1) => ({ flex, padding: 2, borderRight: '1px solid #000', fontSize: 10, overflow: 'hidden' }),
    label: { fontSize: 7, fontWeight: 'bold', color: '#555', textTransform: 'uppercase', display: 'block' },
    value: { fontSize: 10, fontWeight: 'bold', color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }
  };

  return (
    <div style={danfeStyles.overlay}>
      {/* BARRA DE FERRAMENTAS (Não sai na impressão) */}
      <div className="no-print" style={danfeStyles.toolbar}>
        <div style={{display:'flex', alignItems:'center', gap: 10}}>
           <span>📄 Visualização de Impressão</span>
        </div>
        <div style={{display:'flex', gap: 10}}>
          <button onClick={() => window.print()} style={{background: '#3b82f6', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold'}}>🖨️ IMPRIMIR</button>
          <button onClick={onClose} style={{background: '#ef4444', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold'}}>✕ FECHAR</button>
        </div>
      </div>

      {/* ÁREA IMPRESSA (Folha A4) */}
      <div className="printable-area" style={danfeStyles.paper}>
        
        {/* CANHOTO */}
        <div style={{...danfeStyles.row, height: 25}}>
          <div style={{...danfeStyles.col(8)}}>
            <span style={danfeStyles.label}>RECEBEMOS DE CAIOLOG OS PRODUTOS CONSTANTES DA NOTA FISCAL INDICADA AO LADO</span>
          </div>
          <div style={{...danfeStyles.col(2), borderRight: 'none', textAlign:'center'}}>
            <strong style={{fontSize: 14}}>NF-e</strong><br/>Nº {nfeNum}
          </div>
        </div>
        <div style={{...danfeStyles.row, borderBottom: '1px solid #000', marginBottom: 15}}>
          <div style={danfeStyles.col(2)}><span style={danfeStyles.label}>DATA DE RECEBIMENTO</span></div>
          <div style={{...danfeStyles.col(8), borderRight: 'none'}}><span style={danfeStyles.label}>IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR</span></div>
        </div>

        {/* EMITENTE */}
        <div style={{...danfeStyles.row, height: 110, borderBottom: '1px solid #000'}}>
           <div style={{...danfeStyles.col(4), display:'flex', alignItems:'center', justifyContent:'center'}}>
              <h2 style={{margin:0, fontSize:24, fontWeight:900}}>CAIOLOG</h2>
           </div>
           <div style={{...danfeStyles.col(2), textAlign:'center'}}>
              <h3 style={{margin:'5px 0'}}>DANFE</h3>
              <span style={{fontSize:8}}>Documento Auxiliar da<br/>Nota Fiscal Eletrônica</span>
              <div style={{border:'1px solid #000', margin:'5px 10px', padding:2}}>1 - SAÍDA</div>
              <strong style={{fontSize:10}}>Nº {nfeNum}</strong><br/>
              <span style={{fontSize:9}}>SÉRIE 1</span>
           </div>
           <div style={{...danfeStyles.col(6), borderRight:'none'}}>
              <div className="barcode" style={{height: 40, background: 'repeating-linear-gradient(90deg,#000,#000 1px,#fff 1px,#fff 3px)', margin:'5px 0'}}></div>
              <span style={danfeStyles.label}>CHAVE DE ACESSO</span>
              <span style={danfeStyles.value}>3523 1234 5678 9000 1234 5500 1000 0012 3456 7890</span>
           </div>
        </div>

        {/* DESTINATÁRIO */}
        <div style={{background:'#eee', padding:2, fontSize:10, fontWeight:'bold', border:'1px solid #000', borderTop:'none', borderBottom:'none'}}>DESTINATÁRIO / REMETENTE</div>
        <div style={danfeStyles.row}><div style={{...danfeStyles.col(6)}}><span style={danfeStyles.label}>NOME / RAZÃO SOCIAL</span><span style={danfeStyles.value}>{cliente.name}</span></div><div style={{...danfeStyles.col(3)}}><span style={danfeStyles.label}>CNPJ / CPF</span><span style={danfeStyles.value}>{cliente.cnpj}</span></div><div style={{...danfeStyles.col(2), borderRight:'none'}}><span style={danfeStyles.label}>DATA DA EMISSÃO</span><span style={danfeStyles.value}>{new Date(viagem.createdAt).toLocaleDateString()}</span></div></div>
        
        <div style={{...danfeStyles.row, borderBottom: '1px solid #000'}}><div style={{...danfeStyles.col(5)}}><span style={danfeStyles.label}>ENDEREÇO</span><span style={danfeStyles.value}>{viagem.destino}</span></div><div style={{...danfeStyles.col(4)}}><span style={danfeStyles.label}>BAIRRO / DISTRITO</span><span style={danfeStyles.value}>CENTRO</span></div><div style={{...danfeStyles.col(2), borderRight:'none'}}><span style={danfeStyles.label}>CEP</span><span style={danfeStyles.value}>00000-000</span></div></div>

        {/* VALORES */}
        <div style={{background:'#eee', padding:2, fontSize:10, fontWeight:'bold', border:'1px solid #000', borderTop:'none', borderBottom:'none', marginTop: 5}}>CÁLCULO DO IMPOSTO</div>
        <div style={{...danfeStyles.row, borderBottom: '1px solid #000'}}>
          <div style={danfeStyles.col(1)}><span style={danfeStyles.label}>BASE ICMS</span>0,00</div>
          <div style={danfeStyles.col(1)}><span style={danfeStyles.label}>VALOR ICMS</span>0,00</div>
          <div style={danfeStyles.col(1)}><span style={danfeStyles.label}>TOTAL PROD.</span>{viagem.valor.toFixed(2)}</div>
          <div style={{...danfeStyles.col(1), borderRight:'none', background:'#f1f5f9'}}><span style={danfeStyles.label}>TOTAL NOTA</span>{viagem.valor.toFixed(2)}</div>
        </div>

        {/* TRANSPORTADOR */}
        <div style={{background:'#eee', padding:2, fontSize:10, fontWeight:'bold', border:'1px solid #000', borderTop:'none', borderBottom:'none', marginTop: 5}}>TRANSPORTADOR / VOLUMES</div>
        <div style={{...danfeStyles.row, borderBottom: '1px solid #000'}}>
           <div style={danfeStyles.col(4)}><span style={danfeStyles.label}>RAZÃO SOCIAL</span><span style={danfeStyles.value}>{motorista ? motorista.name : 'A CONTRATAR'}</span></div>
           <div style={danfeStyles.col(1)}><span style={danfeStyles.label}>FRETE</span>0-Emitente</div>
           <div style={danfeStyles.col(2)}><span style={danfeStyles.label}>PLACA</span><span style={danfeStyles.value}>{veiculoInfo ? veiculoInfo.placa : '---'}</span></div>
           <div style={{...danfeStyles.col(1), borderRight:'none'}}><span style={danfeStyles.label}>UF</span>SP</div>
        </div>

        {/* PRODUTOS */}
        <div style={{background:'#eee', padding:2, fontSize:10, fontWeight:'bold', border:'1px solid #000', borderTop:'none', borderBottom:'none', marginTop: 5}}>DADOS DO PRODUTO / SERVIÇO</div>
        <div style={{border:'1px solid #000', height: 400}}>
           <div style={{display:'flex', borderBottom:'1px solid #000', fontSize:9, padding:4, fontWeight:'bold'}}>
             <div style={{flex:1}}>COD</div>
             <div style={{flex:5}}>DESCRIÇÃO</div>
             <div style={{flex:1}}>QTD</div>
             <div style={{flex:1, textAlign:'right'}}>UNIT</div>
             <div style={{flex:1, textAlign:'right'}}>TOTAL</div>
           </div>
           {/* Item único */}
           <div style={{display:'flex', fontSize:10, padding:4}}>
             <div style={{flex:1}}>001</div>
             <div style={{flex:5}}>{viagem.descricao}</div>
             <div style={{flex:1}}>1</div>
             <div style={{flex:1, textAlign:'right'}}>{viagem.valor.toFixed(2)}</div>
             <div style={{flex:1, textAlign:'right'}}>{viagem.valor.toFixed(2)}</div>
           </div>
        </div>

      </div>
    </div>
  );
}
        {/* CÁLCULO DO IMPOSTO */}
        <div className="danfe-title">CÁLCULO DO IMPOSTO</div>
        <div className="danfe-group">
           <div className="danfe-col"><span className="danfe-label">BASE CÁLC. ICMS</span><span className="danfe-value">0,00</span></div>
           <div className="danfe-col"><span className="danfe-label">VALOR DO ICMS</span><span className="danfe-value">0,00</span></div>
           <div className="danfe-col"><span className="danfe-label">BASE CÁLC. ST</span><span className="danfe-value">0,00</span></div>
           <div className="danfe-col"><span className="danfe-label">VALOR ICMS ST</span><span className="danfe-value">0,00</span></div>
           <div className="danfe-col"><span className="danfe-label">VALOR TOTAL PRODUTOS</span><span className="danfe-value">{formatMoney(viagem.valor)}</span></div>
        </div>
        <div className="danfe-group">
           <div className="danfe-col"><span className="danfe-label">VALOR FRETE</span><span className="danfe-value">0,00</span></div>
           <div className="danfe-col"><span className="danfe-label">VALOR SEGURO</span><span className="danfe-value">0,00</span></div>
           <div className="danfe-col"><span className="danfe-label">DESCONTO</span><span className="danfe-value">0,00</span></div>
           <div className="danfe-col"><span className="danfe-label">OUTRAS DESP.</span><span className="danfe-value">0,00</span></div>
           <div className="danfe-col"><span className="danfe-label">VALOR TOTAL NOTA</span><span className="danfe-value">{formatMoney(viagem.valor)}</span></div>
        </div>

        {/* TRANSPORTADOR */}
        <div className="danfe-title">TRANSPORTADOR / VOLUMES TRANSPORTADOS</div>
        <div className="danfe-group">
           <div className="danfe-col" style={{flex: 4}}>
             <span className="danfe-label">RAZÃO SOCIAL</span>
             <span className="danfe-value">{motorista ? motorista.name.toUpperCase() : "A CONTRATAR"}</span>
           </div>
           <div className="danfe-col" style={{flex: 1}}>
             <span className="danfe-label">FRETE POR CONTA</span>
             <span className="danfe-value">0 - EMITENTE</span>
           </div>
           <div className="danfe-col" style={{flex: 1}}>
             <span className="danfe-label">CÓDIGO ANTT</span>
             <span className="danfe-value">123456</span>
           </div>
           <div className="danfe-col" style={{flex: 1}}>
             <span className="danfe-label">PLACA VEÍCULO</span>
             <span className="danfe-value">{veiculoInfo ? veiculoInfo.placa : "---"}</span>
           </div>
           <div className="danfe-col" style={{flex: 1}}>
             <span className="danfe-label">UF</span>
             <span className="danfe-value">SP</span>
           </div>
        </div>
        <div className="danfe-group">
           <div className="danfe-col"><span className="danfe-label">QUANTIDADE</span><span className="danfe-value">1</span></div>
           <div className="danfe-col"><span className="danfe-label">ESPÉCIE</span><span className="danfe-value">VOLUME</span></div>
           <div className="danfe-col"><span className="danfe-label">MARCA</span><span className="danfe-value">DIVERSAS</span></div>
           <div className="danfe-col"><span className="danfe-label">NUMERAÇÃO</span><span className="danfe-value">001</span></div>
           <div className="danfe-col"><span className="danfe-label">PESO BRUTO</span><span className="danfe-value">{viagem.peso || "---"}</span></div>
        </div>

        {/* DADOS DO PRODUTO */}
        <div className="danfe-title">DADOS DO PRODUTO / SERVIÇO</div>
        <div style={{border: '1px solid #000', height: 300, padding: 5, fontSize: 10}}>
          <div style={{display:'flex', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: 5, marginBottom: 5}}>
            <div style={{flex: 1}}>CÓDIGO</div>
            <div style={{flex: 4}}>DESCRIÇÃO</div>
            <div style={{flex: 1}}>NCM/SH</div>
            <div style={{flex: 1, textAlign:'right'}}>QTD</div>
            <div style={{flex: 1, textAlign:'right'}}>VLR. UNIT</div>
            <div style={{flex: 1, textAlign:'right'}}>VLR. TOTAL</div>
          </div>
          {/* Item Único (Sintético) */}
          <div style={{display:'flex'}}>
            <div style={{flex: 1}}>001</div>
            <div style={{flex: 4}}>{viagem.descricao.toUpperCase()}</div>
            <div style={{flex: 1}}>8500.00</div>
            <div style={{flex: 1, textAlign:'right'}}>1</div>
            <div style={{flex: 1, textAlign:'right'}}>{formatMoney(viagem.valor)}</div>
            <div style={{flex: 1, textAlign:'right'}}>{formatMoney(viagem.valor)}</div>
          </div>
        </div>

        {/* RODAPÉ E BOTÕES */}
        <div className="no-print" style={{position:'absolute', top: 20, right: -80, display:'flex', flexDirection:'column', gap: 10}}>
          <button onClick={() => window.print()} style={{...styles.btn, background: COLORS.primary, color:'white', width: 60, height: 60, borderRadius: '50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 24, boxShadow: '0 4px 10px rgba(0,0,0,0.3)'}} title="Imprimir">🖨️</button>
          <button onClick={onClose} style={{...styles.btn, background: COLORS.danger, color:'white', width: 60, height: 60, borderRadius: '50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 24, boxShadow: '0 4px 10px rgba(0,0,0,0.3)'}} title="Fechar">❌</button>
        </div>
      </div>
    </div>
  )
}

/* ============================================================================
   ADMIN DASHBOARD
============================================================================ */
function AdminDashboard({ data, actions, user }) {
  const { viagens, veiculos, users, messages } = data;
  const { setViagens, setVeiculos, setUsers, setMessages } = actions;
  const [tab, setTab] = useState('viagens');
  const [modal, setModal] = useState({ type: null, data: null });
  const [cancelId, setCancelId] = useState(null);
  const [stats, setStats] = useState({
    totalViagens: 0,
    pendentes: 0,
    emRota: 0,
    entregues: 0,
    canceladas: 0,
    avaliacoes: 0,
    mediaAvaliacoes: 0
  });

  useEffect(() => {
    const statsCalc = {
      totalViagens: viagens.length,
      pendentes: viagens.filter(v => v.status === 'pendente' && !v.canceled).length,
      emRota: viagens.filter(v => v.status === 'em rota' && !v.canceled).length,
      entregues: viagens.filter(v => v.status === 'entregue' && !v.canceled).length,
      canceladas: viagens.filter(v => v.canceled).length,
      avaliacoes: viagens.filter(v => v.rating && v.rating > 0).length
    };
    
    const avaliacoes = viagens.filter(v => v.rating && v.rating > 0);
    statsCalc.mediaAvaliacoes = avaliacoes.length > 0 
      ? (avaliacoes.reduce((acc, v) => acc + v.rating, 0) / avaliacoes.length).toFixed(1)
      : 0;
    
    setStats(statsCalc);
  }, [viagens]);

  const handleCancel = (reason) => {
    setViagens(viagens.map(v => v.id === cancelId ? { 
      ...v, 
      canceled: true, 
      cancelReason: reason, 
      status: 'cancelado',
      updatedAt: new Date().toISOString()
    } : v));
    setCancelId(null);
  };

  // Filtra apenas clientes e motoristas para os selects
  const clientes = users.filter(u => u.role === 'cliente');
  const motoristas = users.filter(u => u.role === 'motorista');

  return (
    <div>
      {modal.type === 'danfe' && <DanfeRealista viagem={modal.data} users={users} veiculos={veiculos} onClose={() => setModal({type:null})} />}
      {cancelId && <CancelModal onClose={() => setCancelId(null)} onConfirm={handleCancel} isAdmin={true} />}

      {/* Estatísticas Rápidas */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15, marginBottom: 25}}>
        <div style={{...styles.card, textAlign: 'center', padding: 15}}>
          <div style={{fontSize: 32, fontWeight: 'bold', color: COLORS.primary}}>{stats.totalViagens}</div>
          <div style={{fontSize: 12, color: COLORS.textLight}}>Total de Viagens</div>
        </div>
        <div style={{...styles.card, textAlign: 'center', padding: 15}}>
          <div style={{fontSize: 32, fontWeight: 'bold', color: COLORS.warning}}>{stats.pendentes}</div>
          <div style={{fontSize: 12, color: COLORS.textLight}}>Pendentes</div>
        </div>
        <div style={{...styles.card, textAlign: 'center', padding: 15}}>
          <div style={{fontSize: 32, fontWeight: 'bold', color: COLORS.info}}>{stats.emRota}</div>
          <div style={{fontSize: 12, color: COLORS.textLight}}>Em Rota</div>
        </div>
        <div style={{...styles.card, textAlign: 'center', padding: 15}}>
          <div style={{fontSize: 32, fontWeight: 'bold', color: COLORS.success}}>{stats.entregues}</div>
          <div style={{fontSize: 12, color: COLORS.textLight}}>Entregues</div>
        </div>
        <div style={{...styles.card, textAlign: 'center', padding: 15}}>
          <div style={{fontSize: 32, fontWeight: 'bold', color: COLORS.warning}}>{stats.mediaAvaliacoes}</div>
          <div style={{fontSize: 12, color: COLORS.textLight}}>⭐ Média Avaliações</div>
        </div>
      </div>

      <div style={{display: 'flex', gap: 10, marginBottom: 25, overflowX: 'auto', paddingBottom: 5}}>
        {['viagens', 'frota', 'usuarios', 'avaliacoes', 'chat'].map(t => (
          <button 
            key={t} 
            onClick={() => setTab(t)} 
            style={{
              ...styles.btn, 
              background: tab === t ? COLORS.primary : 'white', 
              color: tab === t ? 'white' : COLORS.text, 
              border: `1px solid ${COLORS.border}`,
              whiteSpace: 'nowrap'
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "viagens" && (
        <AdminViagens 
          viagens={viagens} 
          setViagens={setViagens} 
          motoristas={motoristas} 
          clientes={clientes} 
          veiculos={veiculos} 
          onOpenDanfe={(v) => setModal({type:'danfe', data:v})} 
          onCancel={setCancelId} 
        />
      )}
      {tab === "frota" && <AdminFrota veiculos={veiculos} setVeiculos={setVeiculos} />}
      {tab === "usuarios" && <AdminUsers users={users} setUsers={setUsers} />}
      {tab === "avaliacoes" && <AdminAvaliacoes viagens={viagens} users={users} />}
      {tab === "chat" && <AdminChat viagens={viagens} messages={messages} setMessages={setMessages} user={user} />}
    </div>
  );
}

function AdminViagens({ viagens, setViagens, motoristas, clientes, veiculos, onOpenDanfe, onCancel }) {
  const [form, setForm] = useState({ 
    desc: "", 
    valor: "", 
    clienteId: "", 
    origemUF: "SP", 
    origemCidade: "", 
    destinoUF: "RJ", 
    destinoCidade: "" 
  });

  const criar = (e) => {
    e.preventDefault();
    if(!form.origemCidade || !form.destinoCidade || !form.clienteId || !form.desc || !form.valor) {
      alert("Preencha todos os campos obrigatórios!");
      return;
    }

    const origemCoords = getCityCoords(form.origemCidade);
    const destinoCoords = getCityCoords(form.destinoCidade);

    const nova = {
      id: Date.now(),
      codigo: `CL-${Math.floor(Math.random() * 10000)}`,
      descricao: form.desc,
      valor: Number(form.valor),
      clienteId: Number(form.clienteId),
      motoristaId: "",
      veiculo: "",
      status: "pendente",
      origem: `${form.origemCidade} - ${form.origemUF}`,
      destino: `${form.destinoCidade} - ${form.destinoUF}`,
      lat: origemCoords.lat, 
      lng: origemCoords.lng, 
      destLat: destinoCoords.lat, 
      destLng: destinoCoords.lng,
      otp: generateOTP(),
      peso: "",
      dimensoes: "",
      canceled: false, 
      cancelReason: null, 
      rating: null,
      feedback: null,
      feedbackDate: null,
      history: [{status: 'pendente', date: new Date().toISOString(), descricao: 'Pedido registrado no sistema'}],
      checklist: { pneus: false, oleo: false, carga_presa: false, documentacao: false },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setViagens([...viagens, nova]);
    setForm({ 
      desc: "", 
      valor: "", 
      clienteId: "", 
      origemUF: "SP", 
      origemCidade: "", 
      destinoUF: "RJ", 
      destinoCidade: "" 
    });
    alert(`Pedido criado! Senha do Cliente: ${nova.otp}\nCódigo: ${nova.codigo}`);
  };

  const update = (id, field, val) => {
    setViagens(viagens.map(v => v.id === id ? { ...v, [field]: val, updatedAt: new Date().toISOString() } : v));
  };

  return (
    <>
      <div style={styles.card} className="no-print">
        <h3 style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20}}>
          <span>📦</span> Nova Carga
        </h3>
        <form onSubmit={criar} style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap: 15}}>
          <div>
            <label style={{display: 'block', fontSize: 12, marginBottom: 5, color: COLORS.textLight}}>Descrição *</label>
            <input style={styles.input} required placeholder="Ex: Notebooks Dell, 50 unidades" value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} />
          </div>
          <div>
            <label style={{display: 'block', fontSize: 12, marginBottom: 5, color: COLORS.textLight}}>Valor (R$) *</label>
            <input style={styles.input} required type="number" placeholder="45000" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} />
          </div>
          <div>
            <label style={{display: 'block', fontSize: 12, marginBottom: 5, color: COLORS.textLight}}>Cliente *</label>
            <select style={styles.select} value={form.clienteId} onChange={e => setForm({...form, clienteId: e.target.value})} required>
              <option value="">Selecione...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          <div>
            <label style={{display: 'block', fontSize: 12, marginBottom: 5, color: COLORS.textLight}}>Estado Origem *</label>
            <select style={styles.select} value={form.origemUF} onChange={e => setForm({...form, origemUF: e.target.value, origemCidade: ""})} required>
              <option value="">Selecione...</option>
              {Object.keys(ESTADOS_E_CIDADES).map(uf => (
                <option key={uf} value={uf}>{uf} - {ESTADOS_E_CIDADES[uf].nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{display: 'block', fontSize: 12, marginBottom: 5, color: COLORS.textLight}}>Cidade Origem *</label>
            <select style={styles.select} value={form.origemCidade} onChange={e => setForm({...form, origemCidade: e.target.value})} required>
              <option value="">Selecione...</option>
              {form.origemUF && ESTADOS_E_CIDADES[form.origemUF]?.cidades.map(cidade => (
                <option key={cidade} value={cidade}>{cidade}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{display: 'block', fontSize: 12, marginBottom: 5, color: COLORS.textLight}}>Estado Destino *</label>
            <select style={styles.select} value={form.destinoUF} onChange={e => setForm({...form, destinoUF: e.target.value, destinoCidade: ""})} required>
              <option value="">Selecione...</option>
              {Object.keys(ESTADOS_E_CIDADES).map(uf => (
                <option key={uf} value={uf}>{uf} - {ESTADOS_E_CIDADES[uf].nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{display: 'block', fontSize: 12, marginBottom: 5, color: COLORS.textLight}}>Cidade Destino *</label>
            <select style={styles.select} value={form.destinoCidade} onChange={e => setForm({...form, destinoCidade: e.target.value})} required>
              <option value="">Selecione...</option>
              {form.destinoUF && ESTADOS_E_CIDADES[form.destinoUF]?.cidades.map(cidade => (
                <option key={cidade} value={cidade}>{cidade}</option>
              ))}
            </select>
          </div>
          <div style={{gridColumn: '1 / -1'}}>
            <button style={{...styles.btn, background: COLORS.primary, color:'white', height: 45, width: '100%'}}>
              🚚 CRIAR ORDEM DE SERVIÇO
            </button>
          </div>
        </form>
      </div>

      <div>
        {viagens.length === 0 ? (
          <div style={styles.card}>
            <div style={{textAlign: 'center', padding: 40}}>
              <div style={{fontSize: 48, marginBottom: 20, opacity: 0.3}}>📦</div>
              <h3 style={{margin: 0, color: COLORS.textLight}}>Nenhuma viagem cadastrada</h3>
              <p style={{color: COLORS.textLight}}>Crie sua primeira viagem usando o formulário acima</p>
            </div>
          </div>
        ) : (
          viagens.map(v => (
            <div key={v.id} style={{...styles.card, borderLeft: `5px solid ${v.canceled ? COLORS.danger : (v.status === 'entregue' ? COLORS.success : COLORS.primary)}`, opacity: v.canceled ? 0.7 : 1}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems: 'flex-start', marginBottom: 10}}>
                <div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5}}>
                    <strong style={{fontSize: 16}}>{v.codigo}</strong> 
                    <StatusBadge status={v.status} canceled={v.canceled} />
                    {v.rating && (
                      <div style={{display: 'flex', alignItems: 'center', gap: 2}}>
                        <StarRating rating={v.rating} size={14} />
                        <span style={{fontSize: 12, color: COLORS.warning}}>({v.rating})</span>
                      </div>
                    )}
                  </div>
                  <p style={{margin: 0, fontSize: 14}}>{v.descricao}</p>
                </div>
                <div style={{display:'flex', gap: 5}}>
                  <button onClick={() => onOpenDanfe(v)} style={{...styles.btn, padding: '6px 12px', background: COLORS.primary, color:'white'}}>📄</button>
                  {!v.canceled && v.status !== 'entregue' && (
                    <button onClick={() => onCancel(v.id)} style={{...styles.btn, padding: '6px 12px', background: '#fee2e2', color: COLORS.danger}}>🚫</button>
                  )}
                </div>
              </div>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13, color: COLORS.textLight, marginBottom: 10}}>
                <div>
                  <strong>Cliente:</strong> {clientes.find(c => c.id === v.clienteId)?.name || "N/A"}
                </div>
                <div>
                  <strong>Valor:</strong> {formatMoney(v.valor)}
                </div>
                <div>
                  <strong>Rota:</strong> {v.origem} → {v.destino}
                </div>
                <div>
                  <strong>Senha:</strong> <code style={{background: '#f1f5f9', padding: '2px 6px', borderRadius: 4}}>{v.otp}</code>
                </div>
              </div>
              
              {v.canceled && (
                <div style={{background: '#fee2e2', padding: 10, borderRadius: 6, marginBottom: 10}}>
                  <strong style={{color: COLORS.danger}}>🚫 Cancelado:</strong> {v.cancelReason}
                </div>
              )}
              
              {v.feedback && (
                <div style={{background: '#f0fdf4', padding: 10, borderRadius: 6, marginBottom: 10}}>
                  <strong style={{color: COLORS.success}}>⭐ Feedback do Cliente:</strong>
                  <div style={{fontSize: 13, marginTop: 5}}>{v.feedback}</div>
                  <div style={{fontSize: 11, color: COLORS.textLight, marginTop: 5}}>
                    {new Date(v.feedbackDate).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              )}
              
              {!v.canceled && v.status === 'pendente' && (
                <div style={{display:'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 15}}>
                  <select style={styles.select} value={v.motoristaId || ""} onChange={e => update(v.id, 'motoristaId', Number(e.target.value))}>
                    <option value="">Atribuir Motorista...</option>
                    {motoristas.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <select style={styles.select} value={v.veiculo || ""} onChange={e => update(v.id, 'veiculo', e.target.value)}>
                    <option value="">Atribuir Veículo...</option>
                    {veiculos.map(vc => <option key={vc.placa} value={vc.placa}>{vc.placa} - {vc.modelo}</option>)}
                  </select>
                </div>
              )}
              
              {/* Checklist */}
              {v.checklist && (
                <SafetyChecklist 
                  checklist={v.checklist} 
                  onUpdate={(newChecklist) => update(v.id, 'checklist', newChecklist)}
                  disabled={v.status !== 'pendente'}
                />
              )}
              
              <div style={{height: 150, borderRadius: 8, overflow:'hidden', marginTop: 10}}>
                <Map 
                  center={[v.lat, v.lng]} 
                  zoom={6} 
                  markers={[
                    {lat: v.lat, lng: v.lng, type: 'truck', text: 'Origem'}, 
                    {lat: v.destLat, lng: v.destLng, text: 'Destino'}
                  ]} 
                  route={[[v.lat, v.lng], [v.destLat, v.destLng]]} 
                />
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}

function AdminUsers({ users, setUsers }) {
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "cliente",
    cnpj: "",
    phone: "",
    company: ""
  });

  const addUser = (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert("Preencha nome, email e senha!");
      return;
    }
    
    if (users.some(u => u.email === newUser.email)) {
      alert("Email já cadastrado!");
      return;
    }

    const userToAdd = {
      id: Date.now(),
      ...newUser
    };

    setUsers([...users, userToAdd]);
    setNewUser({
      name: "",
      email: "",
      password: "",
      role: "cliente",
      cnpj: "",
      phone: "",
      company: ""
    });
  };

  return (
    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20}}>
      <div style={styles.card}>
        <h3>👤 Novo Usuário</h3>
        <form onSubmit={addUser} style={{display:'grid', gap: 10}}>
          <div>
            <label style={{display: 'block', fontSize: 12, marginBottom: 5, color: COLORS.textLight}}>Nome *</label>
            <input style={styles.input} name="name" placeholder="Nome completo ou razão social" 
              value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} required />
          </div>
          <div>
            <label style={{display: 'block', fontSize: 12, marginBottom: 5, color: COLORS.textLight}}>Email *</label>
            <input style={styles.input} name="email" type="email" placeholder="email@empresa.com" 
              value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} required />
          </div>
          <div>
            <label style={{display: 'block', fontSize: 12, marginBottom: 5, color: COLORS.textLight}}>Senha *</label>
            <input style={styles.input} name="password" type="password" placeholder="••••••••" 
              value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} required />
          </div>
          <div>
            <label style={{display: 'block', fontSize: 12, marginBottom: 5, color: COLORS.textLight}}>Função</label>
            <select style={styles.select} name="role" 
              value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})}>
              <option value="cliente">Cliente</option>
              <option value="motorista">Motorista</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div>
            <label style={{display: 'block', fontSize: 12, marginBottom: 5, color: COLORS.textLight}}>CNPJ/CPF/CNH</label>
            <input style={styles.input} name="doc" placeholder="00.000.000/0001-00" 
              value={newUser.cnpj} onChange={(e) => setNewUser({...newUser, cnpj: e.target.value})} />
          </div>
          <button style={{...styles.btn, background: COLORS.primary, color:'white'}}>CADASTRAR</button>
        </form>
      </div>
      <div style={styles.card}>
        <h3>Base de Usuários ({users.length})</h3>
        <div style={{maxHeight: 400, overflowY: 'auto'}}>
          {users.map(u => (
            <div key={u.id} style={{borderBottom:'1px solid #f1f5f9', padding:'12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <div style={{fontWeight: 'bold', fontSize: 14}}>{u.name}</div>
                <div style={{fontSize: 12, color: COLORS.textLight}}>{u.email}</div>
                <div style={{display: 'flex', gap: 5, marginTop: 2}}>
                  <span style={{
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 10,
                    background: u.role === 'admin' ? COLORS.accent : 
                               u.role === 'motorista' ? COLORS.info : 
                               COLORS.success,
                    color: 'white'
                  }}>
                    {u.role.toUpperCase()}
                  </span>
                  {u.company && <span style={{fontSize: 10, color: COLORS.textLight}}>{u.company}</span>}
                </div>
              </div>
              <div style={{fontSize: 20}}>
                {u.role === 'admin' ? '👑' : u.role === 'motorista' ? '👷' : '🏢'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AdminFrota({ veiculos, setVeiculos }) {
  const [newVeiculo, setNewVeiculo] = useState({
    placa: "",
    modelo: "",
    tipo: "Furgão",
    capacidade: "",
    status: "ativo",
    ano: new Date().getFullYear().toString()
  });

  const addVeiculo = (e) => {
    e.preventDefault();
    if (!newVeiculo.placa || !newVeiculo.modelo) {
      alert("Preencha placa e modelo!");
      return;
    }
    
    if (veiculos.some(v => v.placa === newVeiculo.placa)) {
      alert("Veículo com esta placa já cadastrado!");
      return;
    }

    setVeiculos([...veiculos, { id: Date.now(), ...newVeiculo }]);
    setNewVeiculo({
      placa: "",
      modelo: "",
      tipo: "Furgão",
      capacidade: "",
      status: "ativo",
      ano: new Date().getFullYear().toString()
    });
  };

  return (
    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20}}>
      <div style={styles.card}>
        <h3>🚚 Cadastrar Veículo</h3>
        <form onSubmit={addVeiculo} style={{display:'grid', gap: 10}}>
          <div>
            <label style={{display: 'block', fontSize: 12, marginBottom: 5, color: COLORS.textLight}}>Placa *</label>
            <input style={styles.input} name="placa" placeholder="ABC-1234" 
              value={newVeiculo.placa} onChange={(e) => setNewVeiculo({...newVeiculo, placa: e.target.value.toUpperCase()})} required />
          </div>
          <div>
            <label style={{display: 'block', fontSize: 12, marginBottom: 5, color: COLORS.textLight}}>Modelo *</label>
            <input style={styles.input} name="modelo" placeholder="Fiat Fiorino" 
              value={newVeiculo.modelo} onChange={(e) => setNewVeiculo({...newVeiculo, modelo: e.target.value})} required />
          </div>
          <div>
            <label style={{display: 'block', fontSize: 12, marginBottom: 5, color: COLORS.textLight}}>Tipo</label>
            <select style={styles.select} name="tipo" 
              value={newVeiculo.tipo} onChange={(e) => setNewVeiculo({...newVeiculo, tipo: e.target.value})}>
              <option value="Furgão">Furgão</option>
              <option value="VUC">VUC</option>
              <option value="Caminhão">Caminhão</option>
              <option value="Carreta">Carreta</option>
              <option value="Moto">Moto</option>
            </select>
          </div>
          <div>
            <label style={{display: 'block', fontSize: 12, marginBottom: 5, color: COLORS.textLight}}>Capacidade</label>
            <input style={styles.input} name="capacidade" placeholder="800kg, 1.5ton" 
              value={newVeiculo.capacidade} onChange={(e) => setNewVeiculo({...newVeiculo, capacidade: e.target.value})} />
          </div>
          <button style={{...styles.btn, background: COLORS.primary, color:'white'}}>SALVAR VEÍCULO</button>
        </form>
      </div>
      <div style={styles.card}>
        <h3>Frota Ativa ({veiculos.filter(v => v.status === 'ativo').length}/{veiculos.length})</h3>
        <div style={{maxHeight: 400, overflowY: 'auto'}}>
          {veiculos.map(v => (
            <div key={v.placa} style={{borderBottom:'1px solid #f1f5f9', padding:'12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <div style={{fontWeight: 'bold', fontSize: 14}}>{v.placa}</div>
                <div style={{fontSize: 12, color: COLORS.textLight}}>{v.modelo} • {v.tipo}</div>
                {v.capacidade && (
                  <div style={{fontSize: 11, color: COLORS.textLight, marginTop: 2}}>Capacidade: {v.capacidade}</div>
                )}
              </div>
              <span style={{
                fontSize: 10,
                padding: '3px 8px',
                borderRadius: 10,
                background: v.status === 'ativo' ? COLORS.success : COLORS.warning,
                color: 'white',
                fontWeight: 'bold'
              }}>
                {v.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AdminAvaliacoes({ viagens, users }) {
  const avaliacoes = viagens.filter(v => v.rating && v.rating > 0);
  const mediaGeral = avaliacoes.length > 0 
    ? (avaliacoes.reduce((acc, v) => acc + v.rating, 0) / avaliacoes.length).toFixed(1)
    : 0;

  const distribuição = {
    5: avaliacoes.filter(v => v.rating === 5).length,
    4: avaliacoes.filter(v => v.rating === 4).length,
    3: avaliacoes.filter(v => v.rating === 3).length,
    2: avaliacoes.filter(v => v.rating === 2).length,
    1: avaliacoes.filter(v => v.rating === 1).length
  };

  return (
    <div>
      <div style={styles.card}>
        <h3 style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20}}>
          ⭐ Avaliações dos Clientes
        </h3>
        
        <div style={{display: 'flex', alignItems: 'center', gap: 20, marginBottom: 30}}>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: 48, fontWeight: 'bold', color: COLORS.warning}}>{mediaGeral}</div>
            <div style={{fontSize: 12, color: COLORS.textLight}}>Média Geral</div>
          </div>
          <div style={{flex: 1}}>
            <div style={{fontSize: 14, marginBottom: 10}}>Distribuição:</div>
            {[5, 4, 3, 2, 1].map(stars => (
              <div key={stars} style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5}}>
                <div style={{width: 60, textAlign: 'right'}}>
                  <StarRating rating={stars} size={14} />
                </div>
                <div style={{flex: 1, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden'}}>
                  <div style={{
                    width: `${(distribuição[stars] / avaliacoes.length) * 100}%`,
                    height: '100%',
                    background: stars >= 4 ? COLORS.success : stars >= 3 ? COLORS.warning : COLORS.danger,
                    borderRadius: 4
                  }}></div>
                </div>
                <div style={{width: 40, fontSize: 12, color: COLORS.textLight, textAlign: 'right'}}>
                  {distribuição[stars]} ({distribuição[stars] > 0 ? ((distribuição[stars] / avaliacoes.length) * 100).toFixed(0) : 0}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{marginTop: 20}}>
        {avaliacoes.length === 0 ? (
          <div style={styles.card}>
            <div style={{textAlign: 'center', padding: 40}}>
              <div style={{fontSize: 48, marginBottom: 20, opacity: 0.3}}>⭐</div>
              <h3 style={{margin: 0, color: COLORS.textLight}}>Nenhuma avaliação recebida</h3>
              <p style={{color: COLORS.textLight}}>As avaliações dos clientes aparecerão aqui após as entregas</p>
            </div>
          </div>
        ) : (
          avaliacoes.map(v => {
            const cliente = users.find(u => u.id === v.clienteId);
            return (
              <div key={v.id} style={styles.card}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10}}>
                  <div>
                    <div style={{fontSize: 16, fontWeight: 'bold'}}>{v.codigo}</div>
                    <div style={{fontSize: 13, color: COLORS.textLight}}>{v.descricao}</div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <StarRating rating={v.rating} size={20} />
                    <div style={{fontSize: 11, color: COLORS.textLight, marginTop: 5}}>
                      {new Date(v.feedbackDate || v.updatedAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
                
                {cliente && (
                  <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10}}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      color: COLORS.primary
                    }}>
                      {cliente.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontSize: 14, fontWeight: '500'}}>{cliente.name}</div>
                      <div style={{fontSize: 12, color: COLORS.textLight}}>{cliente.company || 'Cliente CAIOLOG'}</div>
                    </div>
                  </div>
                )}
                
                {v.feedback && (
                  <div style={{
                    background: '#f8fafc',
                    padding: 15,
                    borderRadius: 8,
                    marginTop: 10,
                    fontSize: 13,
                    borderLeft: `3px solid ${v.rating >= 4 ? COLORS.success : v.rating >= 3 ? COLORS.warning : COLORS.danger}`
                  }}>
                    "{v.feedback}"
                  </div>
                )}
                
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 12, color: COLORS.textLight, marginTop: 10}}>
                  <span>Rota: {v.origem} → {v.destino}</span>
                  <span>Valor: {formatMoney(v.valor)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function AdminChat({ viagens, messages, setMessages, user }) {
  const [activeViagem, setActiveViagem] = useState(null);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  const filteredMessages = messages.filter(m => 
    activeViagem ? m.viagemId === activeViagem : true
  );

  useEffect(() => { 
    endRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [filteredMessages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if(!input.trim() || !activeViagem) return;
    
    const newMessage = { 
      id: Date.now(), 
      viagemId: activeViagem,
      senderId: user.id, 
      senderName: user.name + " (Admin)",
      text: input, 
      timestamp: new Date().toISOString() 
    };
    
    setMessages([...messages, newMessage]);
    setInput("");
  };

  const getViagemInfo = (id) => {
    return viagens.find(v => v.id === id);
  };

  return (
    <div style={styles.card}>
      <h3 style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20}}>
        💬 Chat de Suporte (Admin)
      </h3>
      
      <div style={{display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, height: 500}}>
        {/* Lista de viagens */}
        <div style={{borderRight: '1px solid #f1f5f9', paddingRight: 10, overflowY: 'auto'}}>
          <div style={{fontSize: 12, color: COLORS.textLight, marginBottom: 10, fontWeight: 'bold'}}>
            VIAGENS COM MENSAGENS
          </div>
          {viagens
            .filter(v => messages.some(m => m.viagemId === v.id))
            .map(v => {
              const viagemMessages = messages.filter(m => m.viagemId === v.id);
              const lastMessage = viagemMessages[viagemMessages.length - 1];
              const cliente = DATA_SEED.users.find(u => u.id === v.clienteId);
              
              return (
                <button
                  key={v.id}
                  onClick={() => setActiveViagem(v.id)}
                  style={{
                    width: '100%',
                    padding: 12,
                    marginBottom: 8,
                    background: activeViagem === v.id ? '#f1f5f9' : 'white',
                    border: `1px solid ${activeViagem === v.id ? COLORS.border : 'transparent'}`,
                    borderRadius: 8,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{fontSize: 13, fontWeight: 'bold'}}>{v.codigo}</div>
                  <div style={{fontSize: 11, color: COLORS.textLight}}>
                    {cliente?.name || 'Cliente'}
                  </div>
                  {lastMessage && (
                    <div style={{
                      fontSize: 11,
                      color: COLORS.textLight,
                      marginTop: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {lastMessage.senderName}: {lastMessage.text.substring(0, 30)}...
                    </div>
                  )}
                  <div style={{
                    fontSize: 10,
                    color: COLORS.textLight,
                    marginTop: 4,
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <StatusBadge status={v.status} canceled={v.canceled} />
                    <span>{viagemMessages.length} 💬</span>
                  </div>
                </button>
              );
            })}
          
          {viagens.filter(v => messages.some(m => m.viagemId === v.id)).length === 0 && (
            <div style={{textAlign: 'center', padding: 20, color: COLORS.textLight, fontSize: 12}}>
              Nenhuma conversa iniciada
            </div>
          )}
        </div>
        
        {/* Área de chat */}
        <div style={{display: 'flex', flexDirection: 'column'}}>
          {activeViagem ? (
            <>
              {/* Cabeçalho da viagem */}
              <div style={{borderBottom: '1px solid #f1f5f9', paddingBottom: 15, marginBottom: 15}}>
                {(() => {
                  const viagem = getViagemInfo(activeViagem);
                  const cliente = DATA_SEED.users.find(u => u.id === viagem?.clienteId);
                  const motorista = DATA_SEED.users.find(u => u.id === viagem?.motoristaId);
                  
                  return (
                    <>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <div style={{fontSize: 16, fontWeight: 'bold'}}>{viagem?.codigo}</div>
                        <StatusBadge status={viagem?.status} canceled={viagem?.canceled} />
                      </div>
                      <div style={{fontSize: 12, color: COLORS.textLight, marginTop: 5}}>
                        Cliente: {cliente?.name} • Motorista: {motorista?.name || 'Não atribuído'}
                      </div>
                      <div style={{fontSize: 11, color: COLORS.textLight, marginTop: 2}}>
                        {viagem?.origem} → {viagem?.destino}
                      </div>
                    </>
                  );
                })()}
              </div>
              
              {/* Mensagens */}
              <div style={{flex: 1, overflowY: 'auto', paddingRight: 10, marginBottom: 15}}>
                {filteredMessages.length === 0 ? (
                  <div style={{textAlign: 'center', padding: 40, color: COLORS.textLight}}>
                    Nenhuma mensagem nesta viagem. Inicie a conversa!
                  </div>
                ) : (
                  filteredMessages.map(m => {
                    const isAdmin = m.senderName.includes('(Admin)');
                    return (
                      <div 
                        key={m.id} 
                        className="chat-message"
                        style={{
                          alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                          background: isAdmin ? COLORS.primary : '#f1f5f9',
                          color: isAdmin ? 'white' : COLORS.text,
                          padding: "10px 15px", 
                          borderRadius: 12, 
                          maxWidth: '85%',
                          marginBottom: 10,
                          fontSize: 13,
                          marginLeft: isAdmin ? 'auto' : 0,
                          marginRight: isAdmin ? 0 : 'auto',
                          borderBottomRightRadius: isAdmin ? 4 : 12,
                          borderBottomLeftRadius: isAdmin ? 12 : 4
                        }}
                      >
                        <div style={{fontSize: 11, opacity: 0.8, marginBottom: 2}}>
                          {m.senderName} • {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <div>{m.text}</div>
                      </div>
                    );
                  })
                )}
                <div ref={endRef}></div>
              </div>
              
              {/* Input de mensagem */}
              <form onSubmit={sendMessage} style={{display:'flex', gap: 10}}>
                <input 
                  style={{flex:1, ...styles.input, marginBottom: 0}} 
                  placeholder="Digite sua mensagem..." 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                />
                <button 
                  type="submit" 
                  disabled={!input.trim()}
                  style={{
                    ...styles.btn, 
                    background: input.trim() ? COLORS.primary : COLORS.border, 
                    color: input.trim() ? 'white' : COLORS.textLight,
                    padding: '0 20px'
                  }}
                >
                  Enviar
                </button>
              </form>
            </>
          ) : (
            <div style={{textAlign: 'center', padding: 60, color: COLORS.textLight}}>
              <div style={{fontSize: 48, marginBottom: 20, opacity: 0.3}}>💬</div>
              <div style={{fontSize: 16, fontWeight: 'bold', marginBottom: 10}}>Selecione uma viagem</div>
              <div style={{fontSize: 13}}>Escolha uma viagem na lista ao lado para ver e participar das conversas</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   MOTORISTA DASHBOARD (SEM SCANNER, FLUXO OTIMIZADO)
============================================================================ */
function MotoristaDashboard({ user, viagens, setViagens, messages, setMessages }) {
  const [pos, setPos] = useState(null);
  const [signModal, setSignModal] = useState(null);
  // Removido estado scanMode e activeScanId
  const [checklistModal, setChecklistModal] = useState(null);
  const minhas = viagens.filter(v => v.motoristaId === user.id && !v.canceled);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      p => setPos([p.coords.latitude, p.coords.longitude]),
      e => console.warn(e), 
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Nova função para iniciar viagem diretamente (sem scanner)
  const iniciarViagem = (id) => {
    setViagens(viagens.map(v => v.id === id ? { 
      ...v, 
      status: 'em rota', 
      history: [...v.history, {status: 'em rota', date: new Date().toISOString(), descricao: 'Viagem iniciada (Checklist validado)'}],
      updatedAt: new Date().toISOString()
    } : v));
    alert("🚚 Viagem iniciada! Bom trabalho.");
  };

  const handleChecklistComplete = (viagemId, checklist) => {
    const allChecked = Object.values(checklist).every(item => item === true);
    if (allChecked) {
      setChecklistModal(null);
      // Chama o início direto, pulando o scan
      iniciarViagem(viagemId);
    } else {
      alert("Por favor, verifique todos os itens do checklist antes de iniciar a rota.");
    }
  };

  const startRoute = (id) => {
    const viagem = viagens.find(v => v.id === id);
    if (viagem) {
      setChecklistModal(viagem);
    }
  };

  const finishDelivery = (signature) => {
    setViagens(viagens.map(v => v.id === signModal ? { 
      ...v, 
      status: 'entregue', 
      signature, 
      history: [...v.history, {status: 'entregue', date: new Date().toISOString(), descricao: 'Entrega confirmada com assinatura'}],
      updatedAt: new Date().toISOString()
    } : v));
    
    // Envia mensagem automática para o cliente
    const viagem = viagens.find(v => v.id === signModal);
    if (viagem) {
      const newMessage = {
        id: Date.now(),
        viagemId: signModal,
        senderId: user.id,
        senderName: user.name,
        text: `Entrega concluída! A carga ${viagem.codigo} foi entregue com sucesso.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, newMessage]);
    }
    
    setSignModal(null);
  };

  const entregar = (id, otp) => {
    const input = prompt("🔐 DIGITE A SENHA DO CLIENTE:");
    if(input === otp) {
      setSignModal(id);
    } else {
      alert("❌ Senha incorreta! Solicite a senha correta ao cliente.");
    }
  };

  return (
    <div style={{maxWidth: 600, margin: '0 auto'}}>
      {/* Removido o componente QrScanner daqui */}
      
      {signModal && <SignaturePad onSave={finishDelivery} onClose={() => setSignModal(null)} />}
      
      {checklistModal && (
        <div style={styles.modal}>
          <div style={{background:'white', padding: 20, borderRadius: 10, width: '90%', maxWidth: 500}}>
            <h3>🔒 Checklist de Segurança</h3>
            <p style={{fontSize: 14, color: COLORS.textLight, marginBottom: 20}}>
              Antes de iniciar a rota para <strong>{checklistModal.codigo}</strong>, confirme todos os itens:
            </p>
            
            <SafetyChecklist 
              checklist={checklistModal.checklist} 
              onUpdate={(newChecklist) => {
                setViagens(viagens.map(v => 
                  v.id === checklistModal.id ? { ...v, checklist: newChecklist } : v
                ));
              }}
              disabled={false}
            />
            
            <div style={{display: 'flex', gap: 10, marginTop: 20}}>
              <button 
                onClick={() => handleChecklistComplete(checklistModal.id, checklistModal.checklist)}
                style={{...styles.btn, background: COLORS.success, color: 'white', flex: 1}}
              >
                {/* Texto do botão atualizado */}
                ✅ CONFIRMAR E INICIAR VIAGEM
              </button>
              <button 
                onClick={() => setChecklistModal(null)}
                style={{...styles.btn, background: COLORS.border, color: COLORS.text, flex: 1}}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div style={{...styles.card, background: COLORS.primary, color:'white', border:'none'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <div>
            <h3 style={{margin: 0}}>👋 Olá, {user.name}</h3>
            <p style={{margin: '5px 0 0 0', opacity: 0.8}}>
              {minhas.filter(v => v.status !== 'entregue').length} entregas pendentes
            </p>
          </div>
          <div style={{textAlign: 'right'}}>
            {pos ? (
              <>
                <div style={{fontSize: 11, opacity: 0.8}}>📍 GPS Ativo</div>
                <div style={{fontSize: 10, opacity: 0.6}}>
                  {pos[0].toFixed(4)}, {pos[1].toFixed(4)}
                </div>
              </>
            ) : (
              <div style={{fontSize: 11, opacity: 0.8}}>📍 Aguardando GPS...</div>
            )}
          </div>
        </div>
      </div>

      {minhas.length === 0 ? (
        <div style={styles.card}>
          <div style={{textAlign: 'center', padding: 40}}>
            <div style={{fontSize: 48, marginBottom: 20, opacity: 0.3}}>🚚</div>
            <h3 style={{margin: 0, color: COLORS.textLight}}>Nenhuma viagem atribuída</h3>
            <p style={{color: COLORS.textLight}}>Aguarde até que uma nova viagem seja atribuída a você</p>
          </div>
        </div>
      ) : (
        minhas.map(v => (
          <div key={v.id} style={styles.card}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems: 'flex-start', marginBottom: 10}}>
              <div>
                <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5}}>
                  <strong style={{fontSize: 16}}>{v.codigo}</strong> 
                  <StatusBadge status={v.status} />
                </div>
                <p style={{margin: 0, fontSize: 14}}>{v.descricao}</p>
              </div>
              <div style={{textAlign: 'right'}}>
                <div style={{fontSize: 13, fontWeight: 'bold', color: COLORS.primary}}>
                  {formatMoney(v.valor)}
                </div>
                <div style={{fontSize: 11, color: COLORS.textLight}}>
                  {v.peso && `Peso: ${v.peso}`}
                </div>
              </div>
            </div>
            
            <div style={{background: '#f1f5f9', padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 15}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5}}>
                <span>📍</span>
                <span><strong>Destino:</strong> {v.destino}</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <span>👤</span>
                <span><strong>Cliente:</strong> {DATA_SEED.users.find(u => u.id === v.clienteId)?.name || "Cliente"}</span>
              </div>
            </div>
            
            {/* Checklist status */}
            {v.checklist && v.status === 'pendente' && (
              <div style={{marginBottom: 15}}>
                <div style={{fontSize: 12, color: COLORS.textLight, marginBottom: 5}}>
                  Checklist de segurança:
                </div>
                <div style={{display: 'flex', gap: 15, fontSize: 11}}>
                  {Object.entries(v.checklist).map(([key, checked]) => (
                    <div key={key} style={{display: 'flex', alignItems: 'center', gap: 3}}>
                      {checked ? '✅' : '❌'} {key.replace('_', ' ')}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Ações baseadas no status */}
            {v.status === 'pendente' && (
              <button 
                onClick={() => startRoute(v.id)} 
                style={{...styles.btn, background: COLORS.accent, color:'white', width:'100%', justifyContent:'center'}}
              >
                {/* Texto atualizado */}
                🔒 REALIZAR CHECKLIST & INICIAR ROTA
              </button>
            )}
            
            {v.status === 'em rota' && (
              <>
                <div style={{height: 200, marginBottom: 10, borderRadius: 8, overflow:'hidden'}}>
                  <Map 
                    center={pos || [v.lat, v.lng]} 
                    zoom={12} 
                    markers={[
                      {lat: v.lat, lng: v.lng, type: 'truck', text: 'Você está aqui'}, 
                      {lat: v.destLat, lng: v.destLng, text: 'Destino'}
                    ]} 
                    route={[[v.lat, v.lng], [v.destLat, v.destLng]]} 
                  />
                </div>
                <button 
                  onClick={() => entregar(v.id, v.otp)} 
                  style={{...styles.btn, background: COLORS.success, color:'white', width:'100%', justifyContent:'center'}}
                >
                  📦 ENTREGAR (SENHA + ASSINATURA)
                </button>
              </>
            )}

            {v.status === 'entregue' && (
              <div style={{textAlign: 'center', padding: 15, background: '#f0fdf4', color: COLORS.success, fontWeight:'bold', borderRadius: 8}}>
                ✅ ENTREGA REALIZADA
                {v.signature && (
                  <div style={{marginTop: 10}}>
                    <img src={v.signature} alt="Assinatura" style={{height: 40, display:'block', margin:'0 auto', borderBottom: '1px solid #ccc'}} />
                    <div style={{fontSize: 10, color: COLORS.textLight, marginTop: 5}}>Assinatura do recebedor</div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

/* ============================================================================
   CLIENTE DASHBOARD (COM AVALIAÇÃO)
============================================================================ */
function ClienteDashboard({ user, viagens, setViagens, users, messages, setMessages }) {
  const [rateId, setRateId] = useState(null);
  const [cancelId, setCancelId] = useState(null);
  const [chatViagemId, setChatViagemId] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const minhas = viagens.filter(v => v.clienteId === user.id);
  const endRef = useRef(null);

  const handleRate = (stars, feedback) => {
    setViagens(viagens.map(v => v.id === rateId ? { 
      ...v, 
      rating: stars, 
      feedback: feedback || null,
      feedbackDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } : v));
    setRateId(null);
  };

  const handleCancel = (reason) => {
    setViagens(viagens.map(v => v.id === cancelId ? { 
      ...v, 
      canceled: true, 
      cancelReason: reason, 
      status: 'cancelado',
      updatedAt: new Date().toISOString()
    } : v));
    
    // Envia mensagem automática
    const viagem = viagens.find(v => v.id === cancelId);
    if (viagem) {
      const newMessage = {
        id: Date.now(),
        viagemId: cancelId,
        senderId: user.id,
        senderName: user.name,
        text: `Pedido ${viagem.codigo} cancelado. Motivo: ${reason}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, newMessage]);
    }
    
    setCancelId(null);
  };

  const sendChatMessage = (viagemId) => {
    if (!chatInput.trim()) return;
    
    const newMessage = {
      id: Date.now(),
      viagemId: viagemId,
      senderId: user.id,
      senderName: user.name,
      text: chatInput,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setChatInput("");
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const getViagemMessages = (viagemId) => {
    return messages.filter(m => m.viagemId === viagemId);
  };

  const getMotoristaName = (motoristaId) => {
    const motorista = users.find(u => u.id === motoristaId);
    return motorista ? motorista.name : "Motorista";
  };

  return (
    <div style={{maxWidth: 800, margin:'0 auto'}}>
      {rateId && <RatingModal onClose={() => setRateId(null)} onRate={handleRate} viagem={viagens.find(v => v.id === rateId)} />}
      {cancelId && <CancelModal onClose={() => setCancelId(null)} onConfirm={handleCancel} isAdmin={false} />}

      <h3 style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20}}>
        📦 Minhas Encomendas ({minhas.length})
      </h3>
      
      {minhas.length === 0 ? (
        <div style={styles.card}>
          <div style={{textAlign: 'center', padding: 40}}>
            <div style={{fontSize: 48, marginBottom: 20, opacity: 0.3}}>📦</div>
            <h3 style={{margin: 0, color: COLORS.textLight}}>Nenhuma encomenda</h3>
            <p style={{color: COLORS.textLight}}>Você ainda não possui pedidos registrados</p>
          </div>
        </div>
      ) : (
        minhas.map(v => {
          const viagemMessages = getViagemMessages(v.id);
          const motoristaName = getMotoristaName(v.motoristaId);
          
          return (
            <div key={v.id} style={styles.card}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 15}}>
                <div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5}}>
                    <h2 style={{margin:0, color: COLORS.primary, fontSize: 18}}>{v.codigo}</h2>
                    <StatusBadge status={v.status} canceled={v.canceled} />
                    {v.rating && (
                      <div style={{display: 'flex', alignItems: 'center', gap: 2}}>
                        <StarRating rating={v.rating} size={14} />
                      </div>
                    )}
                  </div>
                  <p style={{margin: 0, fontSize: 14}}>{v.descricao}</p>
                </div>
                
                {!v.canceled && v.status !== 'entregue' && (
                  <div style={{textAlign:'right', background:'#fff7ed', padding: 10, borderRadius: 8, border: `1px dashed ${COLORS.accent}`, minWidth: 150}}>
                    <div style={{color: COLORS.accent, fontWeight:'bold', fontSize: 10}}>SENHA DE RECEBIMENTO</div>
                    <div style={{fontSize: 24, fontWeight:900, letterSpacing: 2}}>{v.otp}</div>
                    <div style={{color: COLORS.accent, fontSize: 9}}>Informe ao entregador</div>
                  </div>
                )}
              </div>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13, color: COLORS.textLight, marginBottom: 15}}>
                <div><strong>Rota:</strong> {v.origem} → {v.destino}</div>
                <div><strong>Valor:</strong> {formatMoney(v.valor)}</div>
                {v.motoristaId && (
                  <div><strong>Motorista:</strong> {motoristaName}</div>
                )}
                <div><strong>Status:</strong> {new Date(v.updatedAt).toLocaleDateString('pt-BR')}</div>
              </div>
              
              {v.canceled && (
                <div style={{background: '#fee2e2', padding: 10, borderRadius: 6, marginBottom: 15}}>
                  <div style={{color: COLORS.danger, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5}}>
                    🚫 Cancelado
                  </div>
                  <div style={{fontSize: 13, marginTop: 5}}><strong>Motivo:</strong> {v.cancelReason}</div>
                </div>
              )}
              
              {v.feedback && (
                <div style={{background: '#f0fdf4', padding: 10, borderRadius: 6, marginBottom: 15}}>
                  <div style={{color: COLORS.success, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5}}>
                    ⭐ Sua avaliação: <StarRating rating={v.rating} size={14} />
                  </div>
                  <div style={{fontSize: 13, marginTop: 5, fontStyle: 'italic'}}>"{v.feedback}"</div>
                </div>
              )}
              
              {/* Chat da viagem */}
              {!v.canceled && (
                <div style={{marginTop: 20}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
                    <div style={{fontSize: 14, fontWeight: '500'}}>
                      💬 Chat com {motoristaName || "Suporte"}
                    </div>
                    <button
                      onClick={() => setChatViagemId(chatViagemId === v.id ? null : v.id)}
                      style={{...styles.btn, padding: '6px 12px', fontSize: 11, background: COLORS.border, color: COLORS.text}}
                    >
                      {chatViagemId === v.id ? 'Fechar' : 'Abrir'} Chat ({viagemMessages.length})
                    </button>
                  </div>
                  
                  {chatViagemId === v.id && (
                    <div style={{border: '1px solid #f1f5f9', borderRadius: 8, overflow: 'hidden'}}>
                      <div style={{height: 200, overflowY: 'auto', padding: 10, background: '#f8fafc'}}>
                        {viagemMessages.length === 0 ? (
                          <div style={{textAlign: 'center', padding: 20, color: COLORS.textLight}}>
                            Nenhuma mensagem ainda. Inicie a conversa!
                          </div>
                        ) : (
                          viagemMessages.map(m => {
                            const isOwn = m.senderId === user.id;
                            return (
                              <div 
                                key={m.id}
                                style={{
                                  alignSelf: isOwn ? 'flex-end' : 'flex-start',
                                  background: isOwn ? COLORS.primary : 'white',
                                  color: isOwn ? 'white' : COLORS.text,
                                  padding: "8px 12px", 
                                  borderRadius: 8, 
                                  maxWidth: '85%',
                                  marginBottom: 8,
                                  fontSize: 12,
                                  marginLeft: isOwn ? 'auto' : 0,
                                  marginRight: isOwn ? 0 : 'auto',
                                  borderBottomRightRadius: isOwn ? 2 : 8,
                                  borderBottomLeftRadius: isOwn ? 8 : 2
                                }}
                              >
                                <div style={{fontSize: 10, opacity: 0.8, marginBottom: 2}}>
                                  {isOwn ? 'Você' : m.senderName} • {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                                <div>{m.text}</div>
                              </div>
                            );
                          })
                        )}
                        <div ref={endRef}></div>
                      </div>
                      
                      <form 
                        onSubmit={(e) => { e.preventDefault(); sendChatMessage(v.id); }}
                        style={{display: 'flex', borderTop: '1px solid #f1f5f9'}}
                      >
                        <input
                          style={{flex: 1, border: 'none', padding: 12, outline: 'none', fontSize: 13}}
                          placeholder={`Digite uma mensagem para ${motoristaName || "o motorista"}...`}
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                        />
                        <button
                          type="submit"
                          style={{
                            border: 'none',
                            background: COLORS.primary,
                            color: 'white',
                            padding: '0 20px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          ➤
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}
              
              <div style={{display:'flex', gap: 10, marginTop: 15}}>
                {v.status === 'entregue' && !v.rating && (
                  <button 
                    onClick={() => setRateId(v.id)} 
                    style={{...styles.btn, flex: 1, background: COLORS.warning, color:'white', justifyContent:'center'}}
                  >
                    ⭐ AVALIAR ENTREGA
                  </button>
                )}
                
                {!v.canceled && v.status === 'pendente' && (
                  <button 
                    onClick={() => setCancelId(v.id)} 
                    style={{...styles.btn, flex: 1, background: 'transparent', border: '1px solid #fca5a5', color: COLORS.danger, justifyContent:'center'}}
                  >
                    🚫 CANCELAR PEDIDO
                  </button>
                )}
              </div>
              
              <div style={{height: 250, marginTop: 20, borderRadius: 12, overflow:'hidden', border: `1px solid ${COLORS.border}`}}>
                <Map 
                  center={[v.lat, v.lng]} 
                  zoom={6} 
                  markers={[
                    {lat: v.lat, lng: v.lng, type: 'truck', text: 'Origem'}, 
                    {lat: v.destLat, lng: v.destLng, text: 'Seu Destino'}
                  ]} 
                  route={[[v.lat, v.lng], [v.destLat, v.destLng]]} 
                />
              </div>
            </div>
          );
        })
      )}
    </div>
  )
}

/* ============================================================================
   LOGIN
============================================================================ */
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div style={{minHeight:"100vh", display:"flex"}}>
      <div style={{flex: 1, display:"flex", alignItems:"center", justifyContent:"center", background: "white", padding: 40}}>
        <div style={{width: "100%", maxWidth: 350}}>
          <h1 style={{fontSize: 32, fontWeight: 900, color: COLORS.primary, marginBottom: 5}}>CAIOLOG </h1>
          <p style={{color: '#64748b', marginBottom: 30}}>Sistema completo de logística inteligente</p>
          <form onSubmit={e => {e.preventDefault(); onLogin(email, password)}}>
            <input 
              style={{...styles.input, marginBottom: 15}} 
              placeholder="Email ou usuário" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
            />
            <input 
              style={{...styles.input, marginBottom: 20}} 
              type="password" 
              placeholder="Senha" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
            <button style={{...styles.btn, background: COLORS.primary, color:'white', width:'100%', height: 50, fontSize: 14}}>
              ENTRAR NO SISTEMA
            </button>
          </form>
          <div style={{marginTop: 30, fontSize: 12, color: '#94a3b8', textAlign:'center'}}>
            <strong>Credenciais de demonstração:</strong><br/>
            admin / 123 (Administrador)<br/>
            magalu / 123 (Cliente)<br/>
            carlos / 123 (Motorista)
          </div>
        </div>
      </div>
      <div style={{flex: 1.5, background: `linear-gradient(135deg, ${COLORS.primary} 0%, #1e293b 100%)`, display:'flex', alignItems:'center', justifyContent:'center', color:'white', padding: 60}}>
        <div style={{maxWidth: 500}}>
          <h2 style={{fontSize: 40, fontWeight: 900, marginBottom: 20}}>Logística Inteligente </h2>
          <div style={{fontSize: 18, opacity: 0.8, lineHeight: 1.6, marginBottom: 30}}>
            Sistema completo com todas as funcionalidades que você precisa:
          </div>
          <div style={{display: 'grid', gap: 15}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 15}}>
              <div style={{fontSize: 24}}>🗺️</div>
              <div>
                <div style={{fontWeight: 'bold'}}>Estrutura Inteligente de Cidades</div>
                <div style={{fontSize: 14, opacity: 0.8}}>Todos os estados e cidades do Brasil</div>
              </div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 15}}>
              <div style={{fontSize: 24}}>⭐</div>
              <div>
                <div style={{fontWeight: 'bold'}}>Avaliação Pós-entrega</div>
                <div style={{fontSize: 14, opacity: 0.8}}>Clientes avaliam com 5 estrelas e comentários</div>
              </div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 15}}>
              <div style={{fontSize: 24}}>💬</div>
              <div>
                <div style={{fontWeight: 'bold'}}>Chat de Suporte Integrado</div>
                <div style={{fontSize: 14, opacity: 0.8}}>Comunicação em tempo real</div>
              </div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 15}}>
              <div style={{fontSize: 24}}>🔒</div>
              <div>
                <div style={{fontWeight: 'bold'}}>Checklist de Segurança</div>
                <div style={{fontSize: 14, opacity: 0.8}}>Pneus, óleo, carga presa, documentação</div>
              </div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 15}}>
              <div style={{fontSize: 24}}>🚫</div>
              <div>
                <div style={{fontWeight: 'bold'}}>Cancelamento com Motivo</div>
                <div style={{fontSize: 14, opacity: 0.8}}>Admin e cliente podem cancelar viagens</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}