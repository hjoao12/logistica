"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
// Importamos as ações do arquivo vizinho (obrigatório ser separado)
import { 
  getInitialData, 
  criarViagemAction, 
  atualizarViagemAction, 
  enviarMensagemAction, 
  criarUsuarioAction,
  criarVeiculoAction,
  popularBancoAction // Importante para o botão de resgate
} from "./actions";

// --- MAPA DINÂMICO ---
const Map = dynamic(() => import("./components/map"), {
  ssr: false,
  loading: () => <div className="loading-map">📡 Satélite CAIOLOG...</div>,
});

// --- CONSTANTES ---
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

const getCityCoords = (cityName) => COORDENADAS_CIDADES[cityName] || { lat: -23.55, lng: -46.63 };
const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// --- ESTILOS ---
const GLOBAL_STYLES = `
  @media print {
    body * { visibility: hidden; }
    .printable-area, .printable-area * { visibility: visible; }
    .printable-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
    .no-print { display: none !important; }
    @page { size: A4; margin: 0; }
  }
  .danfe-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; flex-direction: column; alignItems: center; padding: 20px 0; overflow-y: auto; }
  .star-rating { display: inline-flex; gap: 5px; }
  .star-rating .star { font-size: 24px; cursor: pointer; transition: transform 0.2s; }
  .star-rating .star:hover { transform: scale(1.2); }
  .star-rating .star.filled { color: #fbbf24; }
  .star-rating .star.empty { color: #d1d5db; }
  .chat-message { animation: slideInUp 0.3s ease-out; }
  @keyframes slideInUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
`;

const COLORS = {
  primary: "#0f172a", accent: "#f97316", success: "#15803d", warning: "#f59e0b", danger: "#dc2626", info: "#3b82f6", bg: "#f8fafc", border: "#e2e8f0", text: "#334155", textLight: "#64748b"
};

const styles = {
  container: { padding: 20, maxWidth: 1400, margin: "0 auto", fontFamily: "'Inter', sans-serif", background: COLORS.bg, minHeight: "100vh", color: COLORS.text, paddingBottom: 100 },
  header: { background: COLORS.primary, color: "white", padding: "15px 30px", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30, boxShadow: "0 4px 10px rgba(0,0,0,0.1)" },
  card: { background: "white", padding: 25, borderRadius: 12, border: `1px solid ${COLORS.border}`, boxShadow: "0 2px 4px rgba(0,0,0,0.05)", marginBottom: 20, position: 'relative' },
  input: { width: "100%", padding: 12, borderRadius: 6, border: `1px solid ${COLORS.border}`, outline: "none", marginBottom: 10, fontSize: 14 },
  select: { width: "100%", padding: 12, borderRadius: 6, border: `1px solid ${COLORS.border}`, outline: "none", marginBottom: 10, fontSize: 14, background: "white" },
  btn: { padding: "12px 20px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: "600", fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  badge: { padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: "800", textTransform: "uppercase", display: 'inline-flex', alignItems: 'center', gap: 4 },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 },
  chatBtn: { position: 'fixed', bottom: 20, right: 20, width: 60, height: 60, borderRadius: '50%', background: COLORS.accent, color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', zIndex: 1000, fontSize: 24, display: 'flex', alignItems:'center', justifyContent:'center' },
  chatWindow: { position: 'fixed', bottom: 90, right: 20, width: 320, height: 400, background: 'white', borderRadius: 12, boxShadow: '0 5px 20px rgba(0,0,0,0.2)', zIndex: 1000, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  checklistItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f1f5f9' },
};

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [data, setData] = useState({ users: [], viagens: [], veiculos: [], messages: [] });
  const [loading, setLoading] = useState(true);

  // Carrega dados iniciais do banco
  useEffect(() => {
    getInitialData().then(serverData => {
      setData(serverData);
      setLoading(false);
    });
  }, []);

  // Polling para atualização automática
  useEffect(() => {
    const interval = setInterval(() => {
      getInitialData().then(serverData => setData(serverData));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const login = (email, password) => {
    // Permite login provisório se não houver usuários no banco ainda
    if (data.users.length === 0 && email === 'admin' && password === '123') {
       alert("Banco vazio! Use o botão 'Popular Banco' abaixo.");
       return;
    }
    const found = data.users.find(u => u.email === email && u.password === password);
    if (found) setUser(found);
    else alert("Usuário não encontrado!");
  };

  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>Carregando CAIOLOG...</div>;
  if (!user) return <LoginScreen onLogin={login} hasUsers={data.users.length > 0} />;

  return (
    <div style={styles.container}>
      <style>{GLOBAL_STYLES}</style>
      <Header user={user} logout={() => setUser(null)} />
      
      <main style={{maxWidth: 1200, margin: "0 auto", padding: 20}}>
        {user.role === "admin" && <AdminDashboard data={data} user={user} />}
        {user.role === "motorista" && <MotoristaDashboard user={user} viagens={data.viagens} messages={data.messages} />}
        {user.role === "cliente" && <ClienteDashboard user={user} viagens={data.viagens} users={data.users} messages={data.messages} />}
        <CaiologAds />
      </main>

      <ChatWidget user={user} viagens={data.viagens} messages={data.messages} />
    </div>
  );
}

// --- SUB-COMPONENTES ---

function AdminDashboard({ data, user }) {
  const router = useRouter();
  const [tab, setTab] = useState('viagens');
  const [modal, setModal] = useState({ type: null, data: null });
  const [cancelId, setCancelId] = useState(null);

  const stats = {
    total: data.viagens.length,
    pendentes: data.viagens.filter(v => v.status === 'pendente').length,
    rota: data.viagens.filter(v => v.status === 'em rota').length,
    entregues: data.viagens.filter(v => v.status === 'entregue').length
  };

  const handleCancel = async (reason) => {
    await atualizarViagemAction(cancelId, { canceled: true, cancelReason: reason, status: 'cancelado' });
    setCancelId(null);
    router.refresh();
  };

  return (
    <div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15, marginBottom: 20}}>
         <div style={{...styles.card, padding: 15, textAlign:'center'}}><h2>{stats.total}</h2><small>Total</small></div>
         <div style={{...styles.card, padding: 15, textAlign:'center', color: COLORS.warning}}><h2>{stats.pendentes}</h2><small>Pendentes</small></div>
         <div style={{...styles.card, padding: 15, textAlign:'center', color: COLORS.info}}><h2>{stats.rota}</h2><small>Em Rota</small></div>
         <div style={{...styles.card, padding: 15, textAlign:'center', color: COLORS.success}}><h2>{stats.entregues}</h2><small>Entregues</small></div>
      </div>

      <div style={{display: 'flex', gap: 10, marginBottom: 20}}>
        {['viagens', 'usuarios', 'frota'].map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{...styles.btn, background: tab===t ? COLORS.primary : 'white', color: tab===t?'white':COLORS.text, border: '1px solid #ccc'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {modal.type === 'danfe' && <DanfeRealista viagem={modal.data} users={data.users} veiculos={data.veiculos} onClose={() => setModal({type:null})} />}
      {cancelId && <CancelModal onClose={() => setCancelId(null)} onConfirm={handleCancel} isAdmin={true} />}

      {tab === "viagens" && (
        <AdminViagens 
          viagens={data.viagens} 
          clientes={data.users.filter(u => u.role === 'cliente')}
          onOpenDanfe={(v) => setModal({type:'danfe', data:v})}
          onCancel={setCancelId}
        />
      )}
      {tab === "usuarios" && <AdminUsers users={data.users} />}
      {tab === "frota" && <AdminFrota veiculos={data.veiculos} />}
    </div>
  );
}

function AdminViagens({ viagens, clientes, onOpenDanfe, onCancel }) {
  const router = useRouter();
  const [form, setForm] = useState({ desc: "", valor: "", clienteId: "", origemUF: "SP", origemCidade: "", destinoUF: "RJ", destinoCidade: "" });

  const criar = async (e) => {
    e.preventDefault();
    if(!form.origemCidade || !form.destinoCidade || !form.clienteId) return alert("Preencha tudo!");
    
    const origemCoords = getCityCoords(form.origemCidade);
    const destinoCoords = getCityCoords(form.destinoCidade);

    await criarViagemAction({
      ...form,
      lat: origemCoords.lat, lng: origemCoords.lng,
      destLat: destinoCoords.lat, destLng: destinoCoords.lng
    });
    router.refresh();
    setForm({...form, desc: "", valor: ""});
    alert("Viagem Criada!");
  };

  return (
    <>
      <div style={styles.card}>
        <h3>Nova Carga</h3>
        <form onSubmit={criar} style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap: 15}}>
            <input style={styles.input} placeholder="Descrição" value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} required />
            <input style={styles.input} type="number" placeholder="Valor (R$)" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} required />
            <select style={styles.select} value={form.clienteId} onChange={e => setForm({...form, clienteId: e.target.value})} required>
                <option value="">Selecione Cliente...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            
            <select style={styles.select} value={form.origemUF} onChange={e => setForm({...form, origemUF: e.target.value, origemCidade: ""})}>
                <option value="">UF Origem</option>
                {Object.keys(ESTADOS_E_CIDADES).map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
            <select style={styles.select} value={form.origemCidade} onChange={e => setForm({...form, origemCidade: e.target.value})}>
                <option value="">Cidade Origem</option>
                {form.origemUF && ESTADOS_E_CIDADES[form.origemUF]?.cidades.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select style={styles.select} value={form.destinoUF} onChange={e => setForm({...form, destinoUF: e.target.value, destinoCidade: ""})}>
                <option value="">UF Destino</option>
                {Object.keys(ESTADOS_E_CIDADES).map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
            <select style={styles.select} value={form.destinoCidade} onChange={e => setForm({...form, destinoCidade: e.target.value})}>
                <option value="">Cidade Destino</option>
                {form.destinoUF && ESTADOS_E_CIDADES[form.destinoUF]?.cidades.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <button style={{...styles.btn, background: COLORS.primary, color:'white', gridColumn: '1/-1'}}>CRIAR PEDIDO</button>
        </form>
      </div>

      <div>
        {viagens.map(v => (
            <div key={v.id} style={{...styles.card, borderLeft: `5px solid ${v.status === 'entregue' ? COLORS.success : COLORS.primary}`}}>
                <div style={{display:'flex', justifyContent:'space-between'}}>
                    <div>
                        <strong>{v.codigo}</strong> <StatusBadge status={v.status} canceled={v.canceled} />
                        <p>{v.descricao}</p>
                    </div>
                    <div style={{display:'flex', gap: 5}}>
                        <button onClick={() => onOpenDanfe(v)} style={{...styles.btn, padding:'5px 10px', background: COLORS.info, color:'white'}}>📄</button>
                        {v.status === 'pendente' && !v.canceled && <button onClick={() => onCancel(v.id)} style={{...styles.btn, padding:'5px 10px', background: COLORS.danger, color:'white'}}>🚫</button>}
                    </div>
                </div>
            </div>
        ))}
      </div>
    </>
  );
}

function AdminUsers({ users }) {
    const router = useRouter();
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "cliente" });
    const add = async (e) => {
        e.preventDefault();
        await criarUsuarioAction(form);
        router.refresh();
        alert("Usuário criado!");
    };
    return (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>
            <div style={styles.card}>
                <h3>Novo Usuário</h3>
                <form onSubmit={add} style={{display:'flex', flexDirection:'column', gap:10}}>
                    <input style={styles.input} placeholder="Nome" onChange={e=>setForm({...form, name:e.target.value})} />
                    <input style={styles.input} placeholder="Email" onChange={e=>setForm({...form, email:e.target.value})} />
                    <input style={styles.input} placeholder="Senha" type="password" onChange={e=>setForm({...form, password:e.target.value})} />
                    <select style={styles.select} onChange={e=>setForm({...form, role:e.target.value})}>
                        <option value="cliente">Cliente</option>
                        <option value="motorista">Motorista</option>
                        <option value="admin">Admin</option>
                    </select>
                    <button style={{...styles.btn, background: COLORS.primary, color:'white'}}>SALVAR</button>
                </form>
            </div>
            <div style={styles.card}>
                <h3>Usuários ({users.length})</h3>
                {users.map(u => <div key={u.id} style={{borderBottom:'1px solid #eee', padding:5}}>{u.name} ({u.role})</div>)}
            </div>
        </div>
    );
}

function AdminFrota({ veiculos }) {
    const router = useRouter();
    const [form, setForm] = useState({ placa: "", modelo: "", tipo: "Furgão" });
    const add = async (e) => {
        e.preventDefault();
        await criarVeiculoAction(form);
        router.refresh();
        alert("Veículo criado!");
    };
    return (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>
            <div style={styles.card}>
                <h3>Novo Veículo</h3>
                <form onSubmit={add} style={{display:'flex', flexDirection:'column', gap:10}}>
                    <input style={styles.input} placeholder="Placa" onChange={e=>setForm({...form, placa:e.target.value})} />
                    <input style={styles.input} placeholder="Modelo" onChange={e=>setForm({...form, modelo:e.target.value})} />
                    <button style={{...styles.btn, background: COLORS.primary, color:'white'}}>SALVAR</button>
                </form>
            </div>
            <div style={styles.card}>
                <h3>Frota ({veiculos.length})</h3>
                {veiculos.map(v => <div key={v.id} style={{borderBottom:'1px solid #eee', padding:5}}>{v.placa} - {v.modelo}</div>)}
            </div>
        </div>
    );
}

function MotoristaDashboard({ user, viagens }) {
  const router = useRouter();
  const [checklistModal, setChecklistModal] = useState(null);
  const minhas = viagens.filter(v => !v.motoristaId || v.motoristaId === user.id).filter(v => !v.canceled);

  const assumir = async (id) => {
      await atualizarViagemAction(id, { motoristaId: user.id });
      router.refresh();
  };

  const iniciar = async (id, checklist) => {
      await atualizarViagemAction(id, { status: 'em rota', checklist: checklist });
      setChecklistModal(null);
      router.refresh();
  };

  const entregar = async (id, otp) => {
      const senha = prompt("Senha do Cliente:");
      if(senha === otp) {
          await atualizarViagemAction(id, { status: 'entregue' });
          router.refresh();
          alert("Entregue!");
      } else alert("Senha errada");
  };

  return (
    <div>
        <h3>Minhas Missões</h3>
        {checklistModal && (
            <div style={styles.modal}>
                <div style={{background:'white', padding:20, borderRadius:10}}>
                    <h3>Checklist</h3>
                    <SafetyChecklist checklist={checklistModal.checklist || {}} onUpdate={newCheck => setChecklistModal({...checklistModal, checklist: newCheck})} />
                    <button onClick={() => iniciar(checklistModal.id, checklistModal.checklist)} style={{...styles.btn, background:COLORS.success, color:'white', marginTop:10, width:'100%'}}>CONFIRMAR E INICIAR</button>
                    <button onClick={() => setChecklistModal(null)} style={{...styles.btn, marginTop:5, width:'100%'}}>CANCELAR</button>
                </div>
            </div>
        )}
        {minhas.map(v => (
            <div key={v.id} style={styles.card}>
                <div style={{display:'flex', justifyContent:'space-between'}}>
                    <strong>{v.codigo}</strong>
                    <StatusBadge status={v.status} />
                </div>
                <p>{v.descricao}</p>
                <p style={{fontSize:12, color:'#666'}}>{v.origem} ➔ {v.destino}</p>
                
                <div style={{marginTop:10}}>
                    {v.status === 'pendente' && !v.motoristaId && <button onClick={() => assumir(v.id)} style={{...styles.btn, background: COLORS.accent, color:'white', width:'100%'}}>✋ PEGAR CORRIDA</button>}
                    {v.status === 'pendente' && v.motoristaId === user.id && <button onClick={() => setChecklistModal(v)} style={{...styles.btn, background: COLORS.info, color:'white', width:'100%'}}>🚚 INICIAR ROTA</button>}
                    {v.status === 'em rota' && <button onClick={() => entregar(v.id, v.otp)} style={{...styles.btn, background: COLORS.success, color:'white', width:'100%'}}>📦 ENTREGAR</button>}
                </div>
            </div>
        ))}
    </div>
  );
}

function ClienteDashboard({ user, viagens }) {
    const minhas = viagens.filter(v => v.clienteId === user.id);
    return (
        <div>
            <h3>Meus Pedidos</h3>
            {minhas.length === 0 && <div style={styles.card}>Nenhum pedido ainda.</div>}
            {minhas.map(v => (
                <div key={v.id} style={styles.card}>
                    <strong>{v.codigo}</strong> <StatusBadge status={v.status} canceled={v.canceled} />
                    <p>{v.descricao}</p>
                    {v.status !== 'entregue' && !v.canceled && (
                        <div style={{background:'#fff7ed', padding:10, marginTop:10, borderRadius:5, border:'1px dashed orange', textAlign:'center'}}>
                            <small>SENHA DE RECEBIMENTO</small>
                            <h2>{v.otp}</h2>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// --- UTILITÁRIOS VISUAIS E COMPONENTES AUXILIARES ---

function Header({ user, logout }) {
  return (
    <header style={styles.header} className="no-print">
      <div><h1 style={{margin:0}}>CAIOLOG</h1><small>{user.name} ({user.role})</small></div>
      <button onClick={logout} style={{...styles.btn, background: COLORS.accent, color:'white'}}>SAIR</button>
    </header>
  );
}

function LoginScreen({ onLogin, hasUsers }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    if(confirm("Criar dados de teste (Admin, Magalu, Carlos) no Neon?")) {
      setLoading(true);
      await popularBancoAction();
      alert("Banco Populado!");
      setLoading(false);
      window.location.reload();
    }
  };

  return (
    <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background: COLORS.primary, flexDirection: 'column', gap: 20}}>
        <div style={{background:'white', padding:40, borderRadius:10, width:300}}>
            <h2 style={{color: COLORS.primary}}>Login</h2>
            {!hasUsers && <div style={{color:'orange', fontSize:12, marginBottom:10}}>⚠️ Banco Vazio</div>}
            <input style={{...styles.input, marginBottom:10}} placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
            <input style={{...styles.input, marginBottom:20}} type="password" placeholder="Senha" value={pass} onChange={e=>setPass(e.target.value)} />
            <button onClick={()=>onLogin(email, pass)} style={{...styles.btn, width:'100%', background: COLORS.primary, color:'white'}}>ENTRAR</button>
        </div>
        {!hasUsers && (
          <button onClick={handleSeed} disabled={loading} style={{color:'white', background:'none', border:'1px dashed white', padding:10, borderRadius:20}}>
            {loading ? "Criando..." : "🚀 Popular Banco com Dados de Teste"}
          </button>
        )}
    </div>
  );
}

function StatusBadge({ status, canceled }) {
    if(canceled) return <span style={{...styles.badge, background:'#fee2e2', color:'red'}}>CANCELADO</span>;
    if(status==='entregue') return <span style={{...styles.badge, background:'#dcfce7', color:'green'}}>ENTREGUE</span>;
    if(status==='em rota') return <span style={{...styles.badge, background:'#dbeafe', color:'blue'}}>EM ROTA</span>;
    return <span style={{...styles.badge, background:'#ffedd5', color:'orange'}}>PENDENTE</span>;
}

function CaiologAds() {
    return <div className="no-print" style={{marginTop:50, textAlign:'center', opacity:0.5, fontSize:12}}>🚀 Sistema Potencializado por Vercel + Neon DB</div>;
}

function DanfeRealista({ viagem, users, veiculos, onClose }) {
    const cliente = users.find(u => u.id === viagem.clienteId) || {};
    const nfeNum = `000.${String(viagem.id).padStart(3, '0')}.001`;
    return (
        <div className="danfe-overlay">
            <div className="no-print" style={{background:'#333', width:'210mm', padding:10, color:'white', display:'flex', justifyContent:'space-between'}}>
                <span>Visualização de Impressão</span>
                <button onClick={onClose} style={{background:'red', border:'none', color:'white', padding:5}}>Fechar</button>
            </div>
            <div className="printable-area" style={{background:'white', width:'210mm', minHeight:'297mm', padding:'10mm', color:'black'}}>
                <div style={{border:'1px solid black', padding:10, marginBottom:10}}>
                    <h1 style={{margin:0}}>DANFE - CAIOLOG</h1>
                    <p style={{margin:0}}>Nota Fiscal Eletrônica - Nº {nfeNum}</p>
                    <p style={{margin:0, fontSize:10}}>Chave de Acesso: {viagem.codigo} - {viagem.otp}</p>
                </div>
                <div style={{border:'1px solid black', padding:10}}>
                    <strong>Destinatário:</strong> {cliente.name} - {cliente.cnpj}<br/>
                    <strong>Origem:</strong> {viagem.origem} <br/>
                    <strong>Destino:</strong> {viagem.destino} <br/>
                    <strong>Valor Total:</strong> {formatMoney(viagem.valor)}
                </div>
            </div>
        </div>
    );
}

function CancelModal({ onClose, onConfirm }) {
    const [r, setR] = useState("");
    return (
        <div style={styles.modal}>
            <div style={{background:'white', padding:20, borderRadius:8}}>
                <h3>Cancelar?</h3>
                <input style={styles.input} placeholder="Motivo" onChange={e=>setR(e.target.value)} />
                <div style={{display:'flex', gap:10, marginTop:10}}>
                    <button onClick={()=>onConfirm(r)} style={{...styles.btn, background:'red', color:'white'}}>Confirmar</button>
                    <button onClick={onClose} style={styles.btn}>Voltar</button>
                </div>
            </div>
        </div>
    );
}

function ChatWidget({ user, viagens, messages }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [msg, setMsg] = useState("");
    const [active, setActive] = useState(null);
    const msgs = active ? messages.filter(m => m.viagemId === parseInt(active)) : [];

    const send = async (e) => {
        e.preventDefault();
        if(!msg || !active) return;
        await enviarMensagemAction(active, user.id, msg);
        setMsg("");
        router.refresh();
    }

    if(!open) return <button style={styles.chatBtn} onClick={()=>setOpen(true)}>💬</button>;

    return (
        <div style={styles.chatWindow}>
            <div style={{background: COLORS.primary, color:'white', padding:10, display:'flex', justifyContent:'space-between'}}>
                <span>Chat</span>
                <button onClick={()=>setOpen(false)} style={{background:'none', border:'none', color:'white'}}>X</button>
            </div>
            <div style={{padding:10, borderBottom:'1px solid #eee'}}>
                <select style={styles.select} onChange={e=>setActive(e.target.value)} value={active || ""}>
                    <option value="">Selecione Viagem...</option>
                    {viagens.map(v => <option key={v.id} value={v.id}>{v.codigo}</option>)}
                </select>
            </div>
            <div style={{flex:1, overflowY:'auto', padding:10, background:'#f9f9f9'}}>
                {msgs.map(m => (
                    <div key={m.id} style={{textAlign: m.senderId === user.id ? 'right' : 'left', marginBottom:5}}>
                        <div style={{background: m.senderId === user.id ? '#dbeafe' : 'white', padding:8, borderRadius:5, display:'inline-block', border:'1px solid #eee'}}>
                            <small style={{fontWeight:'bold'}}>{m.senderName}</small><br/>
                            {m.text}
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={send} style={{display:'flex'}}>
                <input style={{...styles.input, marginBottom:0, borderRadius:0}} value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Digite..." />
                <button style={{...styles.btn, borderRadius:0, background: COLORS.primary, color:'white'}}>></button>
            </form>
        </div>
    );
}