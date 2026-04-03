import { useEffect, useRef } from "react";
import { useGetReports } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";

const MUMBAI_LAT = 19.076;
const MUMBAI_LNG = 72.8777;

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});

  const { data: reports } = useGetReports({}, {
    query: {
      refetchInterval: 5000,
    },
  });

  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === "undefined") return;

      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!(window as any).L) {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = false;
        document.head.appendChild(script);
        await new Promise((resolve) => { script.onload = resolve; });
      }

      if (mapRef.current && !leafletMapRef.current && (window as any).L) {
        const L = (window as any).L;
        const map = L.map(mapRef.current).setView([MUMBAI_LAT, MUMBAI_LNG], 12);

        // Dark tile layer matching the app theme
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
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
        markersRef.current = {};
      }
    };
  }, []);

  const getMarkerColor = (severity: string) => {
    switch (severity) {
      case "critical": return "#ef4444";
      case "high": return "#f97316";
      case "medium": return "#eab308";
      case "low": return "#22c55e";
      default: return "#64748b";
    }
  };

  const renderMarkers = (currentReports: any[] | undefined) => {
    if (!leafletMapRef.current || !currentReports || !(window as any).L) return;
    const L = (window as any).L;
    const map = leafletMapRef.current;

    const currentIds = new Set(currentReports.map((r) => r.id));
    Object.keys(markersRef.current).forEach((id) => {
      if (!currentIds.has(id)) {
        map.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });

    currentReports.forEach((report) => {
      if (markersRef.current[report.id]) return;

      const color = getMarkerColor(report.severity);

      const marker = L.circleMarker([report.latitude, report.longitude], {
        radius: report.severity === "critical" ? 14 : report.severity === "high" ? 11 : 9,
        fillColor: color,
        color: "#ffffff",
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.85,
      }).addTo(map);

      const popupContent = `
        <div style="min-width:210px;font-family:Inter,sans-serif;background:#0f172a;color:#e2e8f0;border-radius:8px;padding:12px;">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px;color:#fff">${report.issue_type}</div>
          <div style="font-size:11px;color:#64748b;margin-bottom:8px">${report.location}</div>
          <div style="display:flex;gap:8px;align-items:center;">
            <span style="padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;background:${color}25;color:${color};border:1px solid ${color}40;text-transform:uppercase;">${report.severity}</span>
            <span style="font-size:12px;color:#94a3b8;">Score: <strong style="color:#fff">${report.risk_score}</strong></span>
          </div>
          <div style="margin-top:8px;font-size:11px;color:#475569">${report.status.replace("_"," ").toUpperCase()}</div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: "civicscan-popup",
        maxWidth: 280,
      });
      markersRef.current[report.id] = marker;
    });
  };

  useEffect(() => {
    renderMarkers(reports);
  }, [reports]);

  const criticalCount = reports?.filter((r) => r.severity === "critical").length ?? 0;

  return (
    <div className="space-y-4 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Live Infrastructure Map</h1>
          <p className="text-sm text-slate-400">Real-time geospatial view of reported issues across Mumbai.</p>
        </div>
        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 px-3 py-1.5 rounded-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="text-sm font-semibold text-red-400">{criticalCount} Critical</span>
            </div>
          )}
          <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            <span className="text-sm font-medium text-slate-300">{reports?.length ?? 0} Active Issues</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-500 flex-shrink-0">
        {[
          { label: "Critical", color: "#ef4444" },
          { label: "High", color: "#f97316" },
          { label: "Medium", color: "#eab308" },
          { label: "Low", color: "#22c55e" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border-2 border-white/30" style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <Card className="flex-1 overflow-hidden relative glass-card border-0 p-0">
        <div ref={mapRef} className="w-full h-full" style={{ zIndex: 0 }} />
      </Card>

      <style>{`
        .civicscan-popup .leaflet-popup-content-wrapper {
          background: #0f172a !important;
          border: 1px solid rgba(56,120,220,0.3) !important;
          border-radius: 8px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
          padding: 0 !important;
        }
        .civicscan-popup .leaflet-popup-tip {
          background: #0f172a !important;
        }
        .civicscan-popup .leaflet-popup-content {
          margin: 0 !important;
        }
      `}</style>
    </div>
  );
}
