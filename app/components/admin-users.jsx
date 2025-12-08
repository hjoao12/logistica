"use client";
import { useState } from "react";
import { criarUsuarioAction } from "../actions"; // Certifique-se que o caminho está correto

const COLORS = { primary: "#0f172a", text: "#334155", textLight: "#64748b", border: "#e2e8f0", accent: "#f97316" };
const styles = {
  card: { background: "white", padding: 25, borderRadius: 16, border: `1px solid white`, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", position: 'relative' },
  input: { width: "100%", padding: "12px 16px", borderRadius: 8, border: `1px solid ${COLORS.border}`, outline: "none", fontSize: 14, marginBottom: 0 },
  select: { width: "100%", padding: "12px 16px", borderRadius: 8, border: `1px solid ${COLORS.border}`, outline: "none", fontSize: 14, background: "white" },
  btn: { padding: "12px 24px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: "600", fontSize: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
};

export default function AdminUsers({ users, onRefresh }) {
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "cliente", company: "", cnpj: "" });
    const [loading, setLoading] = useState(false);

    const add = async (e) => {
        e.preventDefault();
        if(!form.name || !form.email || !form.password) return alert("Preencha os campos obrigatórios");
        
        setLoading(true);
        await criarUsuarioAction(form);
        setLoading(false);
        setForm({ name: "", email: "", password: "", role: "cliente", company: "", cnpj: "" });
        alert("Usuário cadastrado com sucesso!");
        onRefresh();
    };

    const getRoleBadge = (role) => {
        switch(role) {
            case 'admin': return { bg: '#1e293b', label: '👑 ADMIN' };
            case 'motorista': return { bg: '#3b82f6', label: '🚛 MOTORISTA' };
            default: return { bg: '#10b981', label: '👤 CLIENTE' };
        }
    };

    return (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:25}}>
            {/* FORMULÁRIO DE CADASTRO */}
            <div style={styles.card}>
                <h3 style={{marginTop:0}}>Novo Usuário</h3>
                <form onSubmit={add} style={{display:'flex', flexDirection:'column', gap:15}}>
                    <div>
                        <label style={{fontSize: 11, fontWeight:'bold', color: COLORS.textLight}}>NOME COMPLETO</label>
                        <input style={styles.input} value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
                    </div>
                    
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10}}>
                        <div>
                            <label style={{fontSize: 11, fontWeight:'bold', color: COLORS.textLight}}>E-MAIL</label>
                            <input style={styles.input} value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
                        </div>
                        <div>
                            <label style={{fontSize: 11, fontWeight:'bold', color: COLORS.textLight}}>SENHA</label>
                            <input style={styles.input} type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
                        </div>
                    </div>

                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10}}>
                        <div>
                            <label style={{fontSize: 11, fontWeight:'bold', color: COLORS.textLight}}>EMPRESA</label>
                            <input style={styles.input} value={form.company} onChange={e=>setForm({...form, company:e.target.value})} />
                        </div>
                        <div>
                            <label style={{fontSize: 11, fontWeight:'bold', color: COLORS.textLight}}>CNPJ/CPF</label>
                            <input style={styles.input} value={form.cnpj} onChange={e=>setForm({...form, cnpj:e.target.value})} />
                        </div>
                    </div>

                    <div>
                        <label style={{fontSize:11, fontWeight:'bold', color: COLORS.textLight}}>TIPO DE PERFIL</label>
                        <select style={styles.select} value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
                            <option value="cliente">Cliente (Emissor de Cargas)</option>
                            <option value="motorista">Motorista (Parceiro)</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>

                    <button disabled={loading} style={{...styles.btn, background: COLORS.primary, color:'white', marginTop: 5}}>
                        {loading ? "SALVANDO..." : "CADASTRAR USUÁRIO"}
                    </button>
                </form>
            </div>

            {/* LISTA DE USUÁRIOS */}
            <div style={styles.card}>
                <h3 style={{marginTop:0}}>Base de Usuários ({users.length})</h3>
                <div style={{maxHeight: 450, overflowY:'auto', display:'flex', flexDirection:'column', gap: 10, paddingRight: 5}}>
                  {users.map(u => {
                      const badge = getRoleBadge(u.role);
                      return (
                        <div key={u.id} style={{border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 12, display:'flex', justifyContent:'space-between', alignItems:'center', background: '#f8fafc'}}>
                            <div>
                                <div style={{fontWeight:'bold', color: COLORS.text}}>{u.name}</div>
                                <div style={{fontSize: 12, color: COLORS.textLight}}>{u.email}</div>
                                {(u.company || u.cnpj) && <div style={{fontSize: 10, color: COLORS.textLight, marginTop: 2}}>{u.company} • {u.cnpj}</div>}
                            </div>
                            <span style={{background: badge.bg, color: 'white', padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight:'bold', minWidth: 80, textAlign: 'center'}}>
                                {badge.label}
                            </span>
                        </div>
                      );
                  })}
                </div>
            </div>
        </div>
    );
}