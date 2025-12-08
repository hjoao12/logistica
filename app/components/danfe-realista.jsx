"use client";
import React from 'react';

const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function DanfeRealista({ viagem, users, veiculos, onClose }) {
  const cliente = users.find(u => u.id === Number(viagem.clienteId)) || { name: "Consumidor Final", cnpj: "000.000.000-00", company: "Consumidor" };
  const motorista = users.find(u => u.id === Number(viagem.motoristaId));
  const veiculoInfo = veiculos.find(v => v.placa === viagem.veiculo);
  const nfeNum = `000.${String(viagem.id).padStart(3, '0')}.${String(viagem.id * 2).padStart(3, '0')}`;
  
  const border = '1px solid #000';
  const cell = { borderRight: border, padding: '2px 4px', fontSize: 9, overflow: 'hidden' };
  const label = { fontSize: 7, fontWeight: 'bold', color: '#555', textTransform: 'uppercase', display: 'block' };
  const val = { fontSize: 10, fontWeight: 'bold', color: '#000', lineHeight: 1.1 };

  return (
    <div className="danfe-overlay" style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        background: 'rgba(0,0,0,0.85)', zIndex: 9999, 
        display: 'flex', flexDirection: 'column', alignItems: 'center', 
        padding: '20px 0', overflowY: 'auto'
    }}>
      <div className="no-print" style={{ 
        background: '#1e293b', width: '210mm', padding: '12px 20px', 
        borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', 
        alignItems: 'center', color: 'white', marginBottom: -1 
      }}>
        <div style={{display:'flex', alignItems:'center', gap: 10}}>
           <span style={{fontSize: 20}}>📄</span>
           <span style={{fontWeight:'bold'}}>Visualização DANFE</span>
        </div>
        <div style={{display:'flex', gap: 10}}>
          <button onClick={() => window.print()} style={{padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#3b82f6', color: 'white'}}>🖨️ IMPRIMIR</button>
          <button onClick={onClose} style={{padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#dc2626', color: 'white'}}>❌ FECHAR</button>
        </div>
      </div>

      <div className="printable-area" style={{ width: '210mm', minHeight: '297mm', background: 'white', padding: '10mm', position: 'relative', boxSizing: 'border-box', boxShadow: '0 5px 30px rgba(0,0,0,0.5)', color: 'black' }}>
        
        {/* CABEÇALHO */}
        <div style={{border, display: 'flex', height: 110, marginBottom: 10}}>
           <div style={{...cell, flex: 4, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
             <h1 style={{margin:0, fontSize:26, fontWeight:900}}>CAIOLOG</h1>
             <p style={{margin:0, fontSize:10}}>Logística & Transportes Ltda</p>
           </div>
           <div style={{...cell, flex: 1, textAlign:'center'}}>
             <h2 style={{margin:'5px 0 0', fontSize:18}}>DANFE</h2>
             <span style={{fontSize:9}}>SAÍDA</span>
             <strong style={{fontSize:10, display:'block'}}>Nº {nfeNum}</strong>
             <small>SÉRIE 1</small>
           </div>
           <div style={{...cell, flex: 5, borderRight:'none', padding: 5}}>
             <span style={label}>CHAVE DE ACESSO (Simulação)</span>
             <div style={{textAlign:'center', fontSize:11, letterSpacing:1, marginTop: 10, background: '#ccc', height: 40}}>
                 {/* Simulação Visual de Código de Barras */}
                 <div style={{height: 35, width: '90%', background: `repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px)`, margin: '0 auto'}}></div>
             </div>
             <div style={{textAlign:'center', fontSize: 10, marginTop: 5}}>3523 1234 5678 9000 1234 5500 1000</div>
           </div>
        </div>

        {/* DESTINATÁRIO */}
        <div style={{background:'#eee', fontSize:9, fontWeight:'bold', padding:2, border, borderTop:'none'}}>DESTINATÁRIO / REMETENTE</div>
        <div style={{border, borderTop:'none', display:'flex'}}>
            <div style={{...cell, flex: 6}}><span style={label}>NOME / RAZÃO SOCIAL</span><span style={val}>{cliente.name}</span></div>
            <div style={{...cell, flex: 3}}><span style={label}>CNPJ / CPF</span><span style={val}>{cliente.cnpj || '000.000.000-00'}</span></div>
            <div style={{...cell, flex: 2, borderRight:'none'}}><span style={label}>DATA EMISSÃO</span><span style={val}>{new Date(viagem.createdAt).toLocaleDateString()}</span></div>
        </div>
        <div style={{border, borderTop:'none', display:'flex'}}>
            <div style={{...cell, flex: 5}}><span style={label}>ENDEREÇO</span><span style={val}>{viagem.destino}</span></div>
            <div style={{...cell, flex: 3}}><span style={label}>BAIRRO / DISTRITO</span><span style={val}>CENTRO</span></div>
            <div style={{...cell, flex: 1, borderRight:'none'}}><span style={label}>UF</span><span style={val}>BR</span></div>
        </div>

        {/* IMPOSTOS */}
        <div style={{background:'#eee', fontSize:9, fontWeight:'bold', padding:2, border, borderTop:'none', marginTop: 5}}>CÁLCULO DO IMPOSTO</div>
        <div style={{border, borderTop:'none', display:'flex', background:'#f8fafc'}}>
            <div style={{...cell, flex:1}}><span style={label}>BASE CÁLC ICMS</span>0,00</div>
            <div style={{...cell, flex:1}}><span style={label}>VALOR ICMS</span>0,00</div>
            <div style={{...cell, flex:1}}><span style={label}>V. TOTAL PRODUTOS</span>{formatMoney(viagem.valor)}</div>
            <div style={{...cell, flex:1}}><span style={label}>V. FRETE</span>0,00</div>
            <div style={{...cell, flex:1, borderRight:'none'}}><span style={label}>V. TOTAL NOTA</span><span style={{...val, fontSize:12}}>{formatMoney(viagem.valor)}</span></div>
        </div>

        {/* TRANSPORTADOR */}
        <div style={{background:'#eee', fontSize:9, fontWeight:'bold', padding:2, border, borderTop:'none', marginTop: 5}}>TRANSPORTADOR / VOLUMES TRANSPORTADOS</div>
        <div style={{border, borderTop:'none', display:'flex'}}>
            <div style={{...cell, flex: 4}}><span style={label}>RAZÃO SOCIAL</span><span style={val}>{motorista ? motorista.name : "A CONTRATAR"}</span></div>
            <div style={{...cell, flex: 1}}><span style={label}>FRETE POR CONTA</span><span style={val}>0-EMITENTE</span></div>
            <div style={{...cell, flex: 1}}><span style={label}>PLACA VEÍCULO</span><span style={val}>{veiculoInfo?.placa || "---"}</span></div>
            <div style={{...cell, flex: 1, borderRight:'none'}}><span style={label}>UF</span><span style={val}>SP</span></div>
        </div>

        {/* DADOS DOS PRODUTOS */}
        <div style={{background:'#eee', fontSize:9, fontWeight:'bold', padding:2, border, borderTop:'none', marginTop: 5}}>DADOS DO PRODUTO / SERVIÇO</div>
        <div style={{border, borderTop:'none', height: 400}}>
           <div style={{display:'flex', borderBottom:border, padding:4, fontWeight:'bold', fontSize:9}}>
             <div style={{flex:1}}>CÓD</div>
             <div style={{flex:5}}>DESCRIÇÃO</div>
             <div style={{flex:1}}>NCM</div>
             <div style={{flex:1}}>CST</div>
             <div style={{flex:1}}>CFOP</div>
             <div style={{flex:1}}>UNID</div>
             <div style={{flex:1, textAlign:'right'}}>QTD</div>
             <div style={{flex:1, textAlign:'right'}}>V.UNIT</div>
             <div style={{flex:1, textAlign:'right'}}>V.TOTAL</div>
           </div>
           
           <div style={{display:'flex', padding:4, fontSize:10}}>
             <div style={{flex:1}}>0001</div>
             <div style={{flex:5}}>{viagem.descricao.toUpperCase()}</div>
             <div style={{flex:1}}>0000</div>
             <div style={{flex:1}}>060</div>
             <div style={{flex:1}}>5102</div>
             <div style={{flex:1}}>UN</div>
             <div style={{flex:1, textAlign:'right'}}>1</div>
             <div style={{flex:1, textAlign:'right'}}>{formatMoney(viagem.valor)}</div>
             <div style={{flex:1, textAlign:'right'}}>{formatMoney(viagem.valor)}</div>
           </div>
        </div>
        
        {/* RODAPÉ */}
        <div style={{border, borderTop:'none', marginTop: 5, padding: 5}}>
            <span style={label}>DADOS ADICIONAIS / INFORMAÇÕES COMPLEMENTARES</span>
            <p style={{fontSize: 9, margin: '5px 0'}}>
                Documento emitido por ME ou EPP optante pelo Simples Nacional. 
                Não gera direito a crédito fiscal de IPI. Permite o aproveitamento do crédito de ICMS no valor de R$ 0,00 correspondente à alíquota de 0%.
                <br/>
                <strong>Obs Motorista:</strong> Entrega agendada. Cuidado frágil.
            </p>
        </div>

      </div>
    </div>
  );
}