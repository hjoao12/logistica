"use client";
import { useState } from "react";
import { criarVeiculoAction } from "../actions";

const COLORS = { primary: "#0f172a", text: "#334155", textLight: "#64748b", border: "#e2e8f0", accent: "#f97316" };
const styles = {
  card: { background: "white", padding: 25, borderRadius: 16, border: `1px solid white`, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", position: 'relative' },
  input: { width: "100%", padding: "12px 16px", borderRadius: 8, border: `1px solid ${COLORS.border}`, outline: "none", fontSize: 14 },
  select: { width: "100%", padding: "12px 16px", borderRadius: 8, border: `1px solid ${COLORS.border}`, outline: "none", fontSize: 14, background: "white" },
  btn: { padding: "12px 24px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: "600", fontSize: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
};

export default function AdminFrota({ veiculos, onRefresh }) {
    const [form, setForm] = useState({ placa: "", modelo: "", tipo: "Furgão" });
    const [loading, setLoading] = useState(false);

    const add = async (e) => {
        e.preventDefault();
        if(!form.placa || !form.modelo) return alert("Preencha placa e modelo");
        
        setLoading(true);
        await criarVeiculoAction(form);
        setLoading(false);
        setForm({ placa: "", modelo: "", tipo: "Furgão" });
        alert("Veículo adicionado!");
        onRefresh();
    };

    return (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:25}}>
            <div style={styles.card}>
                <h3 style={{marginTop:0}}>Adicionar Veículo</h3>
                <form onSubmit={add} style={{display:'flex', flexDirection:'column', gap:15}}>
                    <div>
                        <label style={{fontSize: 11, fontWeight:'bold', color: COLORS.textLight}}>PLACA</label>
                        <input style={styles.input} placeholder="ex: ABC-1234" value={form.placa} onChange={e=>setForm({...form, placa:e.target.value.toUpperCase()})} maxLength={8} />
                    </div>
                    <div>
                        <label style={{fontSize: 11, fontWeight:'bold', color: COLORS.textLight}}>MODELO</label>
                        <input style={styles.input} placeholder="ex: Fiat Ducato" value={form.modelo} onChange={e=>setForm({...form, modelo:e.target.value})} />
                    </div>
                    <div>
                        <label style={{fontSize: 11, fontWeight:'bold', color: COLORS.textLight}}>CATEGORIA</label>
                        <select style={styles.select} value={form.tipo} onChange={e=>setForm({...form, tipo:e.target.value})}>
                            <option value="Moto">Moto</option>
                            <option value="Carro">Carro Utilitário</option>
                            <option value="Furgão">Furgão / Van</option>
                            <option value="Caminhão">Caminhão Toco</option>
                            <option value="Carreta">Carreta</option>
                        </select>
                    </div>

                    <button disabled={loading} style={{...styles.btn, background: COLORS.primary, color:'white', marginTop: 10}}>
                        {loading ? "SALVANDO..." : "ADICIONAR NA FROTA"}
                    </button>
                </form>
            </div>

            <div style={styles.card}>
                <h3 style={{marginTop:0}}>Frota Disponível ({veiculos.length})</h3>
                <div style={{maxHeight: 400, overflowY:'auto', display:'grid', gap: 10, paddingRight: 5}}>
                    {veiculos.length === 0 && <div style={{color: '#94a3b8', fontStyle:'italic'}}>Nenhum veículo cadastrado.</div>}
                    {veiculos.map(v => (
                        <div key={v.id} style={{borderLeft: `4px solid ${COLORS.accent}`, background: 'white', border: `1px solid ${COLORS.border}`, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', padding: 12, borderRadius: 6, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div>
                                <div style={{fontWeight:'bold', fontSize: 16}}>{v.placa}</div>
                                <div style={{fontSize: 13, color: COLORS.textLight}}>{v.modelo}</div>
                            </div>
                            <div style={{textAlign:'right'}}>
                                <div style={{fontSize: 24}}>{v.tipo === 'Moto' ? '🏍️' : v.tipo === 'Caminhão' ? '🚛' : '🚐'}</div>
                                <div style={{fontSize: 10, fontWeight:'bold', textTransform:'uppercase', color: COLORS.textLight}}>{v.tipo}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}