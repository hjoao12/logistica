"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import debounce from "lodash/debounce";

// --- MAPA DINÂMICO ---
// CORRIGIDO: Caminho correto baseado na estrutura
const Map = dynamic(() => import("./map"), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '100%', width: '100%', background: '#e2e8f0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#64748b'
    }}>
      📡 Carregando Satélite...
    </div>
  ),
});

// --- BUSCA INTELIGENTE POR NOME (NOMINATIM) ---
const buscarSugestoesPorNome = async (endereco) => {
  if (!endereco || endereco.length < 3) return [];
  try {
    const query = `${endereco}, Brazil`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'pt-BR,pt'
      }
    });
    const data = await response.json();

    return data.map(item => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      nomeCompleto: item.display_name,
      nomeReduzido: item.display_name.split(',').slice(0, 3).join(', '),
      tipo: item.type,
      importancia: item.importance,
      endereco: {
        rua: item.address?.road || '',
        numero: item.address?.house_number || '',
        bairro: item.address?.suburb || item.address?.neighbourhood || '',
        cidade: item.address?.city || item.address?.town || item.address?.village || '',
        estado: item.address?.state || '',
        cep: item.address?.postcode || ''
      }
    }));
  } catch (error) {
    console.error("Erro na busca:", error);
    return [];
  }
};

const buscarCoordenadasPorNome = async (endereco) => {
  if (!endereco || endereco.length < 3) return null;
  try {
    const query = `${endereco}, Brazil`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'pt-BR,pt'
      }
    });
    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        nomeCompleto: data[0].display_name,
        nomeReduzido: data[0].display_name.split(',').slice(0, 3).join(', ')
      };
    }
  } catch (error) {
    console.error("Erro na busca:", error);
  }
  return null;
};

// Fallback para não quebrar o mapa se a API falhar
const COORDENADAS_PADRAO = { lat: -23.55, lng: -46.63 };

/* ============================================================================
   COMPONENTE DE BUSCA DE ENDEREÇO AVANÇADO
============================================================================ */
function EnderecoBuscaAvancada({ 
  label, 
  value, 
  onChange, 
  onCoordsChange, 
  placeholder = "Digite o endereço...",
  tipo = "origem",
  showMap = true
}) {
  const [inputValue, setInputValue] = useState(value || '');
  const [sugestoes, setSugestoes] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [coordenadasAtuais, setCoordenadasAtuais] = useState(null);
  const [enderecoValido, setEnderecoValido] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Debounce para evitar muitas requisições
  const buscarSugestoesDebounced = useCallback(
    debounce(async (texto) => {
      if (texto.length < 3) {
        setSugestoes([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const resultados = await buscarSugestoesPorNome(texto);
      setSugestoes(resultados);
      setLoading(false);
      setMostrarSugestoes(true);
    }, 300),
    []
  );

  useEffect(() => {
    if (value) {
      setInputValue(value);
      validarEndereco(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setMostrarSugestoes(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const texto = e.target.value;
    setInputValue(texto);
    onChange(texto);
    setEnderecoValido(false);
    setMensagemErro('');
    
    if (texto.length >= 3) {
      buscarSugestoesDebounced(texto);
    } else {
      setSugestoes([]);
      setMostrarSugestoes(false);
    }
  };

  const validarEndereco = async (endereco) => {
    if (!endereco || endereco.length < 3) {
      setEnderecoValido(false);
      setMensagemErro('Endereço muito curto');
      return;
    }

    setLoading(true);
    const coordenadas = await buscarCoordenadasPorNome(endereco);
    
    if (coordenadas) {
      setCoordenadasAtuais(coordenadas);
      setEnderecoValido(true);
      setMensagemErro('');
      onCoordsChange(coordenadas);
    } else {
      setEnderecoValido(false);
      setMensagemErro('Endereço não encontrado. Tente ser mais específico.');
      setCoordenadasAtuais(null);
    }
    setLoading(false);
  };

  const selecionarSugestao = (sugestao) => {
    setInputValue(sugestao.nomeReduzido);
    onChange(sugestao.nomeReduzido);
    setCoordenadasAtuais(sugestao);
    setEnderecoValido(true);
    setMensagemErro('');
    setSugestoes([]);
    setMostrarSugestoes(false);
    onCoordsChange(sugestao);
  };

  const usarMinhaLocalizacao = () => {
    if (!navigator.geolocation) {
      setMensagemErro('Geolocalização não suportada pelo navegador');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          nomeCompleto: 'Minha localização atual',
          nomeReduzido: 'Minha localização'
        };
        
        // Reverse geocoding para obter o endereço
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`)
          .then(res => res.json())
          .then(data => {
            const enderecoCompleto = data.display_name;
            setInputValue(enderecoCompleto.split(',').slice(0, 3).join(', '));
            onChange(enderecoCompleto.split(',').slice(0, 3).join(', '));
            setCoordenadasAtuais({
              ...coords,
              nomeCompleto: enderecoCompleto,
              nomeReduzido: enderecoCompleto.split(',').slice(0, 3).join(', ')
            });
            setEnderecoValido(true);
            setMensagemErro('');
            onCoordsChange({
              ...coords,
              nomeCompleto: enderecoCompleto,
              nomeReduzido: enderecoCompleto.split(',').slice(0, 3).join(', ')
            });
          })
          .catch(() => {
            setInputValue('Minha localização atual');
            onChange('Minha localização atual');
            setCoordenadasAtuais(coords);
            setEnderecoValido(true);
            setMensagemErro('');
            onCoordsChange(coords);
          })
          .finally(() => setLoading(false));
      },
      (error) => {
        setLoading(false);
        setMensagemErro('Não foi possível obter sua localização: ' + error.message);
      }
    );
  };

  return (
    <div style={{ marginBottom: 20 }} ref={containerRef}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <label style={{ fontSize: 12, color: '#334155', fontWeight: 'bold' }}>
          {label}
          {coordenadasAtuais && (
            <span style={{ marginLeft: 8, fontSize: 10, color: '#10b981', fontWeight: 'normal' }}>
              ✓ Localizado
            </span>
          )}
        </label>
        
        <button
          type="button"
          onClick={usarMinhaLocalizacao}
          style={{
            background: 'transparent',
            border: '1px solid #3b82f6',
            color: '#3b82f6',
            padding: '4px 12px',
            borderRadius: 6,
            fontSize: 11,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
          title="Usar minha localização atual"
        >
          📍 Minha Localização
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          style={{
            ...styles.input,
            borderColor: mensagemErro ? '#ef4444' : 
                       enderecoValido ? '#10b981' : 
                       '#e2e8f0',
            paddingRight: 40,
            marginBottom: 0
          }}
          onFocus={() => inputValue.length >= 3 && setMostrarSugestoes(true)}
        />
        
        <div style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          {loading && (
            <div style={{
              width: 16,
              height: 16,
              border: '2px solid #e2e8f0',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          )}
          {enderecoValido && !loading && (
            <span style={{ color: '#10b981', fontSize: 18 }}>✓</span>
          )}
          {mensagemErro && !loading && (
            <span style={{ color: '#ef4444', fontSize: 18 }}>⚠️</span>
          )}
        </div>

        {/* Lista de Sugestões */}
        {mostrarSugestoes && sugestoes.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '0 0 6px 6px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            zIndex: 1000,
            maxHeight: 300,
            overflowY: 'auto'
          }}>
            {sugestoes.map((sugestao, index) => (
              <div
                key={index}
                onClick={() => selecionarSugestao(sugestao)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <div style={{ 
                  width: 32, 
                  height: 32, 
                  background: tipo === 'origem' ? '#fef3c7' : '#dbeafe',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16
                }}>
                  {tipo === 'origem' ? '📍' : '🏁'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, marginBottom: 2 }}>
                    {sugestao.endereco.rua} {sugestao.endereco.numero}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    {sugestao.endereco.bairro}, {sugestao.endereco.cidade} - {sugestao.endereco.estado}
                  </div>
                </div>
                <div style={{ 
                  fontSize: 10, 
                  color: '#94a3b8',
                  textAlign: 'right',
                  minWidth: 60
                }}>
                  {sugestao.tipo === 'city' ? 'Cidade' : 
                   sugestao.tipo === 'road' ? 'Rua' : 
                   sugestao.tipo}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mensagens de feedback */}
      {mensagemErro && (
        <div style={{
          marginTop: 8,
          padding: '8px 12px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 6,
          fontSize: 12,
          color: '#dc2626',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          ⚠️ {mensagemErro}
        </div>
      )}

      {coordenadasAtuais && (
        <div style={{
          marginTop: 8,
          fontSize: 11,
          color: '#64748b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Lat: {coordenadasAtuais.lat.toFixed(6)}, Lng: {coordenadasAtuais.lng.toFixed(6)}</span>
          <button
            type="button"
            onClick={() => validarEndereco(inputValue)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#3b82f6',
              fontSize: 11,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Validar novamente
          </button>
        </div>
      )}

      {/* Mapa de visualização */}
      {showMap && coordenadasAtuais && (
        <div style={{
          marginTop: 16,
          height: 200,
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          position: 'relative'
        }}>
          <Map
            center={[coordenadasAtuais.lat, coordenadasAtuais.lng]}
            zoom={15}
            markers={[
              {
                position: [coordenadasAtuais.lat, coordenadasAtuais.lng],
                popup: tipo === 'origem' ? '📍 Origem' : '🏁 Destino',
                color: tipo === 'origem' ? '#f59e0b' : '#3b82f6'
              }
            ]}
            style={{ height: '100%', width: '100%' }}
          />
          <div style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 11,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            {tipo === 'origem' ? '📍' : '🏁'}
            <span style={{ fontWeight: 500 }}>{tipo === 'origem' ? 'Origem' : 'Destino'}</span>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/* ============================================================================
   ADMIN VIAGENS COM BUSCA DE ENDEREÇO AVANÇADA
============================================================================ */
function AdminViagens({ viagens, clientes, onOpenDanfe, onCancel, onRefresh }) {
  const [form, setForm] = useState({ 
    desc: "", 
    valor: "", 
    clienteId: "", 
    origem: "", 
    destino: "" 
  });
  const [origemCoords, setOrigemCoords] = useState(null);
  const [destinoCoords, setDestinoCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState("");
  const [rotaPreview, setRotaPreview] = useState(false);

  const criar = async (e) => {
    e.preventDefault();
    
    if (!form.clienteId) return alert("Selecione um cliente!");
    if (!origemCoords || !destinoCoords) return alert("Por favor, valide ambos os endereços!");
    
    setLoading(true);

    try {
      await criarViagemAction({
        desc: form.desc,
        valor: form.valor,
        clienteId: form.clienteId,
        origem: form.origem,
        origemCidade: origemCoords.endereco?.cidade || "GPS",
        origemUF: origemCoords.endereco?.estado || "BR",
        destino: form.destino,
        destinoCidade: destinoCoords.endereco?.cidade || "GPS",
        destinoUF: destinoCoords.endereco?.estado || "BR",
        lat: origemCoords.lat,
        lng: origemCoords.lng,
        destLat: destinoCoords.lat,
        destLng: destinoCoords.lng
      });

      setLoading(false);
      setForm({ desc: "", valor: "", clienteId: "", origem: "", destino: "" });
      setOrigemCoords(null);
      setDestinoCoords(null);
      alert("✅ Viagem Criada com Sucesso!");
      onRefresh();
    } catch (error) {
      setLoading(false);
      alert("❌ Erro ao criar viagem: " + error.message);
    }
  };

  const viagensFiltradas = viagens.filter(v => 
    v.codigo.toLowerCase().includes(busca.toLowerCase()) || 
    v.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <>
      <div style={styles.card}>
        <h3>Nova Carga - Busca Inteligente de Endereços</h3>
        
        <form onSubmit={criar} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Informações básicas */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 15 }}>
            <div>
              <label style={{ fontSize: 12, color: COLORS.textLight, fontWeight: 'bold', marginBottom: 4, display: 'block' }}>
                📦 Descrição da Carga
              </label>
              <input 
                style={styles.input} 
                placeholder="Ex: 10 Caixas de Eletrônicos" 
                value={form.desc} 
                onChange={e => setForm({...form, desc: e.target.value})} 
                required 
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: COLORS.textLight, fontWeight: 'bold', marginBottom: 4, display: 'block' }}>
                💰 Valor (R$)
              </label>
              <input 
                style={styles.input} 
                type="number" 
                placeholder="0,00" 
                value={form.valor} 
                onChange={e => setForm({...form, valor: e.target.value})} 
                required 
                step="0.01"
              />
            </div>
          </div>

          {/* Cliente */}
          <div>
            <label style={{ fontSize: 12, color: COLORS.textLight, fontWeight: 'bold', marginBottom: 4, display: 'block' }}>
              👤 Cliente
            </label>
            <select 
              style={styles.select} 
              value={form.clienteId} 
              onChange={e => setForm({...form, clienteId: e.target.value})} 
              required
            >
              <option value="">Selecione um cliente...</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.company || "Sem empresa"}
                </option>
              ))}
            </select>
          </div>

          {/* Endereços com busca avançada */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 20,
            alignItems: 'stretch'
          }}>
            {/* Origem */}
            <EnderecoBuscaAvancada
              label="📍 PONTO DE ORIGEM"
              value={form.origem}
              onChange={(value) => setForm({...form, origem: value})}
              onCoordsChange={setOrigemCoords}
              placeholder="Ex: Shopping Aricanduva, São Paulo"
              tipo="origem"
              showMap={true}
            />

            {/* Destino */}
            <EnderecoBuscaAvancada
              label="🏁 PONTO DE DESTINO"
              value={form.destino}
              onChange={(value) => setForm({...form, destino: value})}
              onCoordsChange={setDestinoCoords}
              placeholder="Ex: Av. Paulista, 1000 - São Paulo"
              tipo="destino"
              showMap={true}
            />
          </div>

          {/* Preview da Rota */}
          {origemCoords && destinoCoords && (
            <div style={{
              background: '#f8fafc',
              padding: 15,
              borderRadius: 8,
              border: '1px dashed #cbd5e1'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <strong style={{ fontSize: 14 }}>🗺️ Preview da Rota</strong>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Distância estimada: Calculando... • Tempo estimado: Calculando...
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRotaPreview(!rotaPreview)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #3b82f6',
                    color: '#3b82f6',
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 11,
                    cursor: 'pointer'
                  }}
                >
                  {rotaPreview ? 'Ocultar Mapa' : 'Ver Mapa Completo'}
                </button>
              </div>

              {rotaPreview && (
                <div style={{ height: 300, borderRadius: 6, overflow: 'hidden' }}>
                  <Map
                    center={[
                      (origemCoords.lat + destinoCoords.lat) / 2,
                      (origemCoords.lng + destinoCoords.lng) / 2
                    ]}
                    zoom={12}
                    markers={[
                      {
                        position: [origemCoords.lat, origemCoords.lng],
                        popup: '📍 Origem: ' + form.origem.split(',').slice(0,2).join(','),
                        color: '#f59e0b'
                      },
                      {
                        position: [destinoCoords.lat, destinoCoords.lng],
                        popup: '🏁 Destino: ' + form.destino.split(',').slice(0,2).join(','),
                        color: '#3b82f6'
                      }
                    ]}
                    style={{ height: '100%', width: '100%' }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Botão de criar */}
          <button 
            disabled={loading || !origemCoords || !destinoCoords || !form.clienteId}
            style={{
              ...styles.btn,
              background: loading ? '#ccc' : 
                        origemCoords && destinoCoords && form.clienteId ? COLORS.success : COLORS.primary,
              color: 'white',
              height: 50,
              fontSize: 14,
              fontWeight: 'bold',
              opacity: loading || !origemCoords || !destinoCoords || !form.clienteId ? 0.7 : 1,
              cursor: loading || !origemCoords || !destinoCoords || !form.clienteId ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 16,
                  height: 16,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: 8
                }} />
                CRIANDO PEDIDO...
              </>
            ) : origemCoords && destinoCoords ? (
              '✅ CRIAR PEDIDO COM GPS CONFIRMADO'
            ) : (
              '📍 CONFIRME OS ENDEREÇOS PRIMEIRO'
            )}
          </button>
        </form>
      </div>

      {/* Lista de viagens existentes */}
      <div style={{ marginTop: 30 }}>
        <input 
          style={{...styles.input, marginBottom: 20}} 
          placeholder="🔍 Buscar viagem por código ou descrição..." 
          value={busca} 
          onChange={e => setBusca(e.target.value)} 
        />

        <div style={{ display: 'grid', gap: 15 }}>
          {viagensFiltradas.length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
              Nenhuma viagem encontrada.
            </div>
          )}
          {viagensFiltradas.map(v => (
            <div key={v.id} style={{
              ...styles.card,
              padding: 20,
              borderLeft: `6px solid ${
                v.status === 'entregue' ? COLORS.success : 
                v.canceled ? COLORS.danger : 
                COLORS.accent
              }`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 5 }}>
                    <strong style={{ fontSize: 16 }}>{v.codigo}</strong>
                    <StatusBadge status={v.status} canceled={v.canceled} />
                    {v.lat && v.lng && v.destLat && v.destLng && (
                      <span style={{ 
                        fontSize: 10, 
                        background: '#f0f9ff', 
                        color: '#0369a1',
                        padding: '2px 8px',
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        📍 GPS Ativo
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '0 0 10px 0', fontWeight: 500 }}>{v.descricao}</p>
                  <div style={{ fontSize: 12, color: COLORS.textLight }}>
                    <div style={{ marginBottom: 4 }}>
                      <strong>📍 Origem:</strong> {v.origem}
                    </div>
                    <div>
                      <strong>🏁 Destino:</strong> {v.destino}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={() => onOpenDanfe(v)} 
                    style={{...styles.btn, padding: '8px 12px', background: COLORS.info, color: 'white'}}
                  >
                    📄 NOTA
                  </button>
                  {v.status === 'pendente' && !v.canceled && (
                    <button 
                      onClick={() => onCancel(v.id)} 
                      style={{...styles.btn, padding: '8px 12px', background: '#fee2e2', color: COLORS.danger}}
                    >
                      CANCELAR
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}