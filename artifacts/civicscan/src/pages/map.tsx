import { useEffect, useRef } from "react";
import { useGetReports, getGetReportsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MUMBAI_LAT = 19.0760;
const MUMBAI_LNG = 72.8777;

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const queryClient = useQueryClient();

  const { data: reports } = useGetReports({}, {
    query: {
      refetchInterval: 5000 // auto-refresh every 5s
    }
  });

  useEffect(() => {
    // Load Leaflet dynamically via CDN
    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return;

      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!(window as any).L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = false;
        document.head.appendChild(script);

        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      if (mapRef.current && !leafletMapRef.current && (window as any).L) {
        const L = (window as any).L;
        const map = L.map(mapRef.current).setView([MUMBAI_LAT, MUMBAI_LNG], 12);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(map);

        leafletMapRef.current = map;
        renderMarkers(reports);
      }
    };

    loadLeaflet();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  const getMarkerColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc2626'; // red-600
      case 'high': return '#ea580c'; // orange-600
      case 'medium': return '#ca8a04'; // yellow-600
      case 'low': return '#16a34a'; // green-600
      default: return '#64748b'; // slate-500
    }
  };

  const renderMarkers = (currentReports: any[] | undefined) => {
    if (!leafletMapRef.current || !currentReports || !(window as any).L) return;
    const L = (window as any).L;
    const map = leafletMapRef.current;

    // Clear removed reports
    const currentIds = new Set(currentReports.map(r => r.id));
    Object.keys(markersRef.current).forEach(id => {
      if (!currentIds.has(id)) {
        map.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });

    // Add or update markers
    currentReports.forEach(report => {
      if (markersRef.current[report.id]) return; // already exists

      const color = getMarkerColor(report.severity);
      
      const marker = L.circleMarker([report.latitude, report.longitude], {
        radius: report.severity === 'critical' ? 12 : 8,
        fillColor: color,
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(map);

      const popupContent = `
        <div style="min-width: 200px">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${report.issue_type}</div>
          <div style="font-size: 12px; color: #666; margin-bottom: 8px;">${report.location}</div>
          <div style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; background: ${color}20; color: ${color}; text-transform: uppercase;">
            ${report.severity} • SCORE: ${report.risk_score}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current[report.id] = marker;
    });
  };

  useEffect(() => {
    renderMarkers(reports);
  }, [reports]);

  return (
    <div className="space-y-4 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Live Infrastructure Map</h1>
          <p className="text-sm text-slate-500">Real-time geospatial view of reported issues across Mumbai.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border px-3 py-1.5 rounded-md shadow-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-sm font-medium">{reports?.length || 0} Active Issues</span>
          </div>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden relative border-slate-200 shadow-md">
        <div ref={mapRef} className="w-full h-full z-0 relative" style={{ zIndex: 0 }} />
      </Card>
    </div>
  );
}
