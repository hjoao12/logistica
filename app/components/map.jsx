"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Ícones Online (CDN)
const iconBase = "https://unpkg.com/leaflet@1.9.4/dist/images/";
const DefaultIcon = L.icon({
  iconUrl: `${iconBase}marker-icon.png`,
  iconRetinaUrl: `${iconBase}marker-icon-2x.png`,
  shadowUrl: `${iconBase}marker-shadow.png`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Ícone de Caminhão
const TruckIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/741/741407.png", // Ícone genérico de caminhão
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

export default function Map({ center, zoom, markers, route }) {
  // markers = [{ lat, lng, text, type }]
  // route = [[lat, lng], [lat, lng]] (array de coordenadas para linha)

  return (
    <div style={{ height: "100%", width: "100%", borderRadius: "8px", overflow: "hidden" }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        
        {/* Desenha a linha da rota se existir */}
        {route && <Polyline positions={route} color="blue" weight={4} opacity={0.6} />}

        {(markers || []).map((m, i) => (
          <Marker 
            key={i} 
            position={[m.lat, m.lng]} 
            icon={m.type === 'truck' ? TruckIcon : DefaultIcon}
          >
            {m.text && <Popup>{m.text}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}