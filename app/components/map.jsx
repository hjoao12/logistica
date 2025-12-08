"use client";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState, useRef } from "react";

// Ícones personalizados
const createIcon = (color, type) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

// Ícone especial para o caminhão em movimento
const truckIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/741/741407.png', // Ícone de caminhão
    iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -20],
    className: 'truck-icon-anim' // Classe para CSS se quiser girar/animar
});

const icons = { origem: createIcon('green'), destino: createIcon('red') };

function ChangeView({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) map.fitBounds(bounds, { padding: [50, 50] });
  }, [bounds]);
  return null;
}

export default function MapComponent({ origem, destino, height = '300px', isEmRota = false }) {
  const [routePath, setRoutePath] = useState([]);
  const [truckPos, setTruckPos] = useState(null);
  const [bounds, setBounds] = useState(null);
  const animationRef = useRef(null);

  // 1. Buscar Rota
  useEffect(() => {
    if (origem && destino) {
      const newBounds = [[origem.lat, origem.lng], [destino.lat, destino.lng]];
      setBounds(newBounds);

      const fetchRoute = async () => {
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${origem.lng},${origem.lat};${destino.lng},${destino.lat}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          const data = await res.json();
          if (data.routes?.[0]) {
            const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            setRoutePath(coords);
            // Se estiver em rota, começa a animação do início
            if(isEmRota) setTruckPos(coords[0]);
          }
        } catch (error) {
          setRoutePath([[origem.lat, origem.lng], [destino.lat, destino.lng]]);
        }
      };
      fetchRoute();
    }
  }, [origem, destino, isEmRota]);

  // 2. Animação do Caminhão (Simulação)
  useEffect(() => {
    if (isEmRota && routePath.length > 0) {
        let index = 0;
        const animate = () => {
            if (index < routePath.length) {
                setTruckPos(routePath[index]);
                index += 1; // Pula coordenadas para ir mais rápido, ou +1 para suave
                animationRef.current = requestAnimationFrame(animate);
            } else {
                index = 0; // Loop infinito para demonstração
                animationRef.current = requestAnimationFrame(animate);
            }
        };
        animationRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [isEmRota, routePath]);

  const defaultCenter = [-23.5505, -46.6333];

  return (
    <div style={{ height: height, width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)' }}>
      <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
        <ChangeView bounds={bounds} />
        
        {origem && <Marker position={[origem.lat, origem.lng]} icon={icons.origem}><Popup>📍 Retirada</Popup></Marker>}
        {destino && <Marker position={[destino.lat, destino.lng]} icon={icons.destino}><Popup>🏁 Entrega</Popup></Marker>}

        {routePath.length > 0 && <Polyline positions={routePath} pathOptions={{ color: '#3b82f6', weight: 5, opacity: 0.6 }} />}
        
        {/* O CAMINHÃO ANIMADO */}
        {truckPos && isEmRota && (
            <Marker position={truckPos} icon={truckIcon} zIndexOffset={1000}>
                <Popup>🚛 Em trânsito para o destino...</Popup>
            </Marker>
        )}
      </MapContainer>
    </div>
  );
}