"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import debounce from "lodash/debounce";

// --- MAPA DINÂMICO ---
const Map = dynamic(() => import("./components/map"), {
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
   COMPONENTE DE BUSCA DE ENDEREÇO AVANÇADO (INTEGRADO COM SEU MAP)
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
    const enderecoFormatado = sugestao.nomeReduzido;
    setInputValue(enderecoFormatado);
    onChange(enderecoFormatado);
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
            const enderecoFormatado = enderecoCompleto.split(',').slice(0, 3).join(', ');
            setInputValue(enderecoFormatado);
            onChange(enderecoFormatado);
            setCoordenadasAtuais({
              ...coords,
              nomeCompleto: enderecoCompleto,
              nomeReduzido: enderecoFormatado
            });
            setEnderecoValido(true);
            setMensagemErro('');
            onCoordsChange({
              ...coords,
              nomeCompleto: enderecoCompleto,
              nomeReduzido: enderecoFormatado
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

  // Prepara marcadores para o seu componente Map
  const getMapMarkers = () => {
    if (!coordenadasAtuais) return [];
    
    return [{
      lat: coordenadasAtuais.lat,
      lng: coordenadasAtuais.lng,
      text: tipo === 'origem' ? '📍 Origem' : '🏁 Destino',
      type: tipo === 'origem' ? 'origin' : 'destination'
    }];
  };

  return (
    <div style={{ marginBottom: 20 }} ref={containerRef}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <label style={{ fontSize: 12, color: '#334155', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}>
          {tipo === 'origem' ? '📍' : '🏁'}
          {label}
          {coordenadasAtuais && (
            <span style={{ fontSize: 10, color: '#10b981', fontWeight: 'normal', background: '#f0fdf4', padding: '2px 6px', borderRadius: 4 }}>
              ✓ GPS OK
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
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 11,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s'
          }}
          title="Usar minha localização atual"
          onMouseEnter={(e) => e.currentTarget.style.background = '#eff6ff'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ fontSize: 14 }}>📍</span>
          Minha Localização
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
            marginBottom: 0,
            background: enderecoValido ? '#f0fdf4' : 'white',
            transition: 'all 0.3s ease'
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
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 1000,
            maxHeight: 300,
            overflowY: 'auto',
            marginTop: 1
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
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div style={{ 
                  width: 36, 
                  height: 36, 
                  background: tipo === 'origem' ? 'linear-gradient(135deg, #fef3c7, #f59e0b)' : 'linear-gradient(135deg, #dbeafe, #3b82f6)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  color: tipo === 'origem' ? '#92400e' : '#1e40af'
                }}>
                  {tipo === 'origem' ? '📍' : '🏁'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontWeight: 600, 
                    marginBottom: 2,
                    color: '#1e293b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {sugestao.endereco.rua} {sugestao.endereco.numero}
                  </div>
                  <div style={{ 
                    fontSize: 11, 
                    color: '#64748b',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                  }}>
                    <span>{sugestao.endereco.bairro}</span>
                    <span>{sugestao.endereco.cidade} - {sugestao.endereco.estado}</span>
                  </div>
                </div>
                <div style={{ 
                  fontSize: 10, 
                  color: '#94a3b8',
                  textAlign: 'right',
                  minWidth: 60,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 2
                }}>
                  <span style={{
                    background: '#f1f5f9',
                    padding: '2px 6px',
                    borderRadius: 4
                  }}>
                    {sugestao.tipo === 'city' ? 'Cidade' : 
                     sugestao.tipo === 'road' ? 'Rua' : 
                     sugestao.tipo}
                  </span>
                  <span style={{ fontSize: 9 }}>
                    {sugestao.importancia > 0.7 ? 'Alta' : 
                     sugestao.importancia > 0.4 ? 'Média' : 'Baixa'} relevância
                  </span>
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
          padding: '10px 12px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 6,
          fontSize: 12,
          color: '#dc2626',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          animation: 'slideIn 0.3s ease-out'
        }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <div>
            <strong style={{ display: 'block', marginBottom: 2 }}>Endereço não encontrado</strong>
            {mensagemErro}
          </div>
        </div>
      )}

      {coordenadasAtuais && (
        <div style={{
          marginTop: 10,
          padding: '10px',
          background: '#f8fafc',
          borderRadius: 6,
          fontSize: 11,
          color: '#475569',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontWeight: 500, color: '#334155' }}>Coordenadas GPS:</span>
            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
              Lat: {coordenadasAtuais.lat.toFixed(6)}, Lng: {coordenadasAtuais.lng.toFixed(6)}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => validarEndereco(inputValue)}
              style={{
                background: '#e0f2fe',
                border: '1px solid #0ea5e9',
                color: '#0369a1',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 11,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <span style={{ fontSize: 12 }}>↻</span>
              Revalidar
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`${coordenadasAtuais.lat}, ${coordenadasAtuais.lng}`);
                alert('Coordenadas copiadas!');
              }}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#64748b',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 11,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <span style={{ fontSize: 12 }}>📋</span>
              Copiar GPS
            </button>
          </div>
        </div>
      )}

      {/* Mapa de visualização - INTEGRADO COM SEU COMPONENTE MAP */}
      {showMap && coordenadasAtuais && (
        <div style={{
          marginTop: 16,
          height: 200,
          borderRadius: 8,
          overflow: 'hidden',
          border: '2px solid #e2e8f0',
          position: 'relative',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <Map
            center={[coordenadasAtuais.lat, coordenadasAtuais.lng]}
            zoom={15}
            markers={getMapMarkers()}
            style={{ height: '100%', width: '100%' }}
          />
          <div style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(203, 213, 225, 0.5)'
          }}>
            <div style={{
              width: 24,
              height: 24,
              background: tipo === 'origem' ? '#f59e0b' : '#3b82f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 12
            }}>
              {tipo === 'origem' ? 'O' : 'D'}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>
                {tipo === 'origem' ? 'Origem' : 'Destino'}
              </div>
              <div style={{ fontSize: 10, color: '#64748b', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {inputValue}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ============================================================================
   ADMIN VIAGENS COM ROTA COMPLETA NO MAPA
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
  const [rotaPreview, setRotaPreview] = useState(true);
  const [calculandoRota, setCalculandoRota] = useState(false);
  const [rotaCoords, setRotaCoords] = useState([]);

  // Calcular rota quando ambos os pontos estiverem definidos
  useEffect(() => {
    if (origemCoords && destinoCoords) {
      calcularRota();
    }
  }, [origemCoords, destinoCoords]);

  const calcularRota = async () => {
    setCalculandoRota(true);
    try {
      // Simulação de cálculo de rota - você pode integrar com uma API de roteamento real
      // Exemplo: OSRM, Google Directions API, Mapbox Directions API
      
      // Para demonstração, criamos uma rota simples com alguns pontos intermediários
      const pontosRota = [
        [origemCoords.lat, origemCoords.lng],
        // Ponto intermediário 1 (meio caminho + pequeno desvio)
        [
          origemCoords.lat + (destinoCoords.lat - origemCoords.lat) * 0.3,
          origemCoords.lng + (destinoCoords.lng - origemCoords.lng) * 0.3
        ],
        // Ponto intermediário 2
        [
          origemCoords.lat + (destinoCoords.lat - origemCoords.lat) * 0.7,
          origemCoords.lng + (destinoCoords.lng - origemCoords.lng) * 0.7
        ],
        [destinoCoords.lat, destinoCoords.lng]
      ];

      // Adiciona curvatura suave à rota
      const rotaSuavizada = [];
      for (let i = 0; i < pontosRota.length - 1; i++) {
        rotaSuavizada.push(pontosRota[i]);
        // Adiciona ponto intermediário para suavizar
        if (i < pontosRota.length - 2) {
          const midPoint = [
            (pontosRota[i][0] + pontosRota[i + 1][0]) / 2,
            (pontosRota[i][1] + pontosRota[i + 1][1]) / 2
          ];
          rotaSuavizada.push(midPoint);
        }
      }
      rotaSuavizada.push(pontosRota[pontosRota.length - 1]);

      setRotaCoords(rotaSuavizada);
    } catch (error) {
      console.error("Erro ao calcular rota:", error);
      // Rota direta como fallback
      setRotaCoords([
        [origemCoords.lat, origemCoords.lng],
        [destinoCoords.lat, destinoCoords.lng]
      ]);
    }
    setCalculandoRota(false);
  };

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
        destLng: destinoCoords.lng,
        rota: JSON.stringify(rotaCoords) // Salva a rota calculada
      });

      setLoading(false);
      setForm({ desc: "", valor: "", clienteId: "", origem: "", destino: "" });
      setOrigemCoords(null);
      setDestinoCoords(null);
      setRotaCoords([]);
      alert("✅ Viagem Criada com Sucesso!");
      onRefresh();
    } catch (error) {
      setLoading(false);
      alert("❌ Erro ao criar viagem: " + error.message);
    }
  };

  // Prepara marcadores para o mapa de rota completa
  const getRotaMarkers = () => {
    const markers = [];
    
    if (origemCoords) {
      markers.push({
        lat: origemCoords.lat,
        lng: origemCoords.lng,
        text: `📍 Origem: ${form.origem.split(',').slice(0,2).join(',')}`,
        type: 'origin'
      });
    }
    
    if (destinoCoords) {
      markers.push({
        lat: destinoCoords.lat,
        lng: destinoCoords.lng,
        text: `🏁 Destino: ${form.destino.split(',').slice(0,2).join(',')}`,
        type: 'destination'
      });
    }

    return markers;
  };

  const viagensFiltradas = viagens.filter(v => 
    v.codigo.toLowerCase().includes(busca.toLowerCase()) || 
    v.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <>
      <div style={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 40,
            height: 40,
            background: 'linear-gradient(135deg, #0f172a, #334155)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: 'white'
          }}>
            🚚
          </div>
          <div>
            <h3 style={{ margin: 0 }}>Nova Carga - GPS Inteligente</h3>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
              Busca avançada com validação de endereço e visualização em tempo real
            </p>
          </div>
        </div>
        
        <form onSubmit={criar} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Informações básicas */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: 16 
          }}>
            <div>
              <label style={{ fontSize: 12, color: COLORS.textLight, fontWeight: 'bold', marginBottom: 4, display: 'block' }}>
                📦 Descrição da Carga
              </label>
              <input 
                style={styles.input} 
                placeholder="Ex: 10 Caixas de Eletrônicos - Frágil" 
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
                min="0"
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: COLORS.textLight, fontWeight: 'bold', marginBottom: 4, display: 'block' }}>
                👤 Cliente Responsável
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
          </div>

          {/* Linha divisória */}
          <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: 20 }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#475569', fontSize: 14 }}>
              🗺️ Localização GPS da Carga
            </h4>
          </div>

          {/* Endereços com busca avançada */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 24,
            alignItems: 'stretch'
          }}>
            {/* Origem */}
            <EnderecoBuscaAvancada
              label="PONTO DE ORIGEM"
              value={form.origem}
              onChange={(value) => setForm({...form, origem: value})}
              onCoordsChange={setOrigemCoords}
              placeholder="Ex: Shopping Aricanduva, São Paulo - SP"
              tipo="origem"
              showMap={true}
            />

            {/* Destino */}
            <EnderecoBuscaAvancada
              label="PONTO DE DESTINO"
              value={form.destino}
              onChange={(value) => setForm({...form, destino: value})}
              onCoordsChange={setDestinoCoords}
              placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo"
              tipo="destino"
              showMap={true}
            />
          </div>

          {/* Preview da Rota - MAPA COMPLETO */}
          {origemCoords && destinoCoords && (
            <div style={{
              background: '#f8fafc',
              padding: 20,
              borderRadius: 12,
              border: '2px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    color: 'white'
                  }}>
                    🗺️
                  </div>
                  <div>
                    <strong style={{ fontSize: 14, display: 'block' }}>Visualização da Rota</strong>
                    <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {calculandoRota ? (
                        <>
                          <div style={{
                            width: 12,
                            height: 12,
                            border: '2px solid #e2e8f0',
                            borderTopColor: '#3b82f6',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }} />
                          Calculando rota...
                        </>
                      ) : (
                        <>
                          <span>● Rota calculada •</span>
                          <span>📏 Distância estimada: {Math.round(
                            Math.sqrt(
                              Math.pow(destinoCoords.lat - origemCoords.lat, 2) + 
                              Math.pow(destinoCoords.lng - origemCoords.lng, 2)
                            ) * 111 * 1000
                          )} metros</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setRotaPreview(!rotaPreview)}
                    style={{
                      background: rotaPreview ? '#3b82f6' : 'white',
                      border: `2px solid ${rotaPreview ? '#3b82f6' : '#cbd5e1'}`,
                      color: rotaPreview ? 'white' : '#475569',
                      padding: '8px 16px',
                      borderRadius: 8,
                      fontSize: 12,
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    {rotaPreview ? (
                      <>
                        <span>👁️</span>
                        Ocultar Mapa
                      </>
                    ) : (
                      <>
                        <span>🗺️</span>
                        Ver Mapa da Rota
                      </>
                    )}
                  </button>
                </div>
              </div>

              {rotaPreview && (
                <div style={{ 
                  height: 350, 
                  borderRadius: 8, 
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1px solid #cbd5e1'
                }}>
                  <Map
                    center={[
                      (origemCoords.lat + destinoCoords.lat) / 2,
                      (origemCoords.lng + destinoCoords.lng) / 2
                    ]}
                    zoom={12}
                    markers={getRotaMarkers()}
                    route={rotaCoords}
                    style={{ height: '100%', width: '100%' }}
                  />
                  
                  {/* Legenda do Mapa */}
                  <div style={{
                    position: 'absolute',
                    bottom: 20,
                    left: 20,
                    background: 'rgba(255, 255, 255, 0.95)',
                    padding: '12px 16px',
                    borderRadius: 10,
                    fontSize: 11,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(203, 213, 225, 0.6)',
                    maxWidth: 250
                  }}>
                    <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>Legenda da Rota</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 12, height: 12, background: '#f59e0b', borderRadius: '50%' }}></div>
                      <span style={{ color: '#475569' }}>Ponto de Origem</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 12, height: 12, background: '#3b82f6', borderRadius: '50%' }}></div>
                      <span style={{ color: '#475569' }}>Ponto de Destino</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 16, height: 4, background: '#0f172a', borderRadius: 2 }}></div>
                      <span style={{ color: '#475569' }}>Trajeto da Rota</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botão de criar */}
          <button 
            disabled={loading || !origemCoords || !destinoCoords || !form.clienteId}
            style={{
              ...styles.btn,
              background: loading ? '#94a3b8' : 
                        origemCoords && destinoCoords && form.clienteId ? 
                        'linear-gradient(135deg, #10b981, #059669)' : 
                        'linear-gradient(135deg, #0f172a, #334155)',
              color: 'white',
              height: 52,
              fontSize: 15,
              fontWeight: 'bold',
              opacity: loading || !origemCoords || !destinoCoords || !form.clienteId ? 0.7 : 1,
              cursor: loading || !origemCoords || !destinoCoords || !form.clienteId ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (!loading && origemCoords && destinoCoords && form.clienteId) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(16, 185, 129, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 20,
                  height: 20,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: 10
                }} />
                PROCESSANDO CRIAÇÃO...
              </>
            ) : origemCoords && destinoCoords && form.clienteId ? (
              <>
                <span style={{ fontSize: 18, marginRight: 8 }}>✅</span>
                CRIAR PEDIDO COM GPS CONFIRMADO
              </>
            ) : (
              <>
                <span style={{ fontSize: 18, marginRight: 8 }}>📍</span>
                PREENCHA TODOS OS CAMPOS PARA CONTINUAR
              </>
            )}
          </button>
        </form>
      </div>

      {/* Lista de viagens existentes */}
      <div style={{ marginTop: 40 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12,
          marginBottom: 20,
          padding: '12px 16px',
          background: 'white',
          borderRadius: 8,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: 20 }}>🔍</div>
          <input 
            style={{
              ...styles.input,
              marginBottom: 0,
              border: 'none',
              boxShadow: 'none',
              padding: '8px 0',
              fontSize: 14
            }} 
            placeholder="Buscar viagens por código, descrição ou endereço..." 
            value={busca} 
            onChange={e => setBusca(e.target.value)} 
          />
          <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>
            {viagensFiltradas.length} viagem{viagensFiltradas.length !== 1 ? 's' : ''} encontrada{viagensFiltradas.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          {viagensFiltradas.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              color: '#94a3b8', 
              padding: 60,
              background: 'white',
              borderRadius: 12,
              border: '2px dashed #e2e8f0'
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🧭</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Nenhuma viagem encontrada</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>
                Tente buscar por código, descrição ou endereço
              </div>
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
              }`,
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Decoração de fundo */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 120,
                height: 120,
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.03), transparent)',
                borderRadius: '0 0 0 100%',
                zIndex: 0
              }} />
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                position: 'relative',
                zIndex: 1 
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 16, color: '#1e293b' }}>{v.codigo}</strong>
                    <StatusBadge status={v.status} canceled={v.canceled} />
                    
                    {v.lat && v.lng && v.destLat && v.destLng && (
                      <span style={{ 
                        fontSize: 10, 
                        background: '#f0f9ff', 
                        color: '#0369a1',
                        padding: '4px 10px',
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontWeight: 600
                      }}>
                        <span style={{ fontSize: 12 }}>📍</span>
                        GPS DISPONÍVEL
                      </span>
                    )}
                  </div>
                  
                  <p style={{ 
                    margin: '0 0 12px 0', 
                    fontWeight: 500,
                    color: '#334155',
                    fontSize: 14,
                    lineHeight: 1.5
                  }}>
                    {v.descricao}
                  </p>
                  
                  <div style={{ 
                    fontSize: 13, 
                    color: '#475569',
                    background: '#f8fafc',
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 16, color: '#f59e0b' }}>📍</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 12, color: '#64748b', marginBottom: 2 }}>ORIGEM</div>
                        <div>{v.origem}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ fontSize: 16, color: '#3b82f6' }}>🏁</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 12, color: '#64748b', marginBottom: 2 }}>DESTINO</div>
                        <div>{v.destino}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  gap: 8,
                  flexShrink: 0,
                  marginLeft: 16
                }}>
                  <button 
                    onClick={() => onOpenDanfe(v)} 
                    style={{
                      ...styles.btn, 
                      padding: '10px 16px', 
                      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', 
                      color: 'white',
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <span>📄</span>
                    NOTA
                  </button>
                  
                  {v.status === 'pendente' && !v.canceled && (
                    <button 
                      onClick={() => onCancel(v.id)} 
                      style={{
                        ...styles.btn, 
                        padding: '10px 16px', 
                        background: 'linear-gradient(135deg, #fee2e2, #fecaca)', 
                        color: COLORS.danger,
                        fontSize: 12,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <span>✕</span>
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

// Estilos (mantenha os mesmos estilos do seu código original)
const COLORS = { primary: "#0f172a", accent: "#f97316", success: "#15803d", warning: "#f59e0b", danger: "#dc2626", info: "#3b82f6", bg: "#f8fafc", border: "#e2e8f0", text: "#334155", textLight: "#64748b" };

const styles = {
  container: { padding: 20, maxWidth: 1400, margin: "0 auto", fontFamily: "sans-serif", background: COLORS.bg, minHeight: "100vh", color: COLORS.text, paddingBottom: 100 },
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