import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';

// Fix for default marker icons in Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const workerIcon = L.divIcon({
  html: '<div class="w-8 h-8 bg-primary-600 rounded-full border-4 border-white premium-shadow flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg></div>',
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const userIcon = L.divIcon({
  html: '<div class="w-8 h-8 bg-emerald-600 rounded-full border-4 border-white premium-shadow flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>',
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Component to recenter map when worker moves
const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

const TrackingMap = ({ bookingId, userLocation, initialWorkerLocation }) => {
  const [workerPos, setWorkerPos] = useState(initialWorkerLocation || [0, 0]);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin;
    
    socketRef.current = io(API_URL, {
      auth: { token }
    });

    socketRef.current.emit('join_booking', bookingId);

    socketRef.current.on('worker_location_live', (data) => {
      if (data.coordinates) {
        setWorkerPos([data.coordinates[1], data.coordinates[0]]); // Leaflet uses [lat, lng]
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [bookingId]);

  const center = workerPos[0] !== 0 ? workerPos : userLocation;

  return (
    <div className="w-full h-[400px] rounded-[32px] overflow-hidden border border-slate-100 premium-shadow">
      <MapContainer center={center} zoom={15} className="w-full h-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={userLocation} icon={userIcon}>
          <Popup>User Destination</Popup>
        </Marker>
        {workerPos[0] !== 0 && (
          <>
            <Marker position={workerPos} icon={workerIcon}>
              <Popup>Worker Live Location</Popup>
            </Marker>
            <Polyline positions={[workerPos, userLocation]} color="#6366f1" weight={3} dashArray="10, 10" />
            <RecenterMap center={workerPos} />
          </>
        )}
      </MapContainer>
      <div className="absolute bottom-4 left-4 right-4 z-[1000] flex gap-2">
         <a 
           href={`https://www.google.com/maps/dir/?api=1&destination=${userLocation[0]},${userLocation[1]}`}
           target="_blank"
           rel="noreferrer"
           className="flex-1 bg-white px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-700 text-xs text-center shadow-lg flex items-center justify-center gap-2"
         >
           Open in Google Maps
         </a>
      </div>
    </div>
  );
};

export default TrackingMap;
