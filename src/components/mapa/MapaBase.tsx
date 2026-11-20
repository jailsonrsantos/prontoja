"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { circulo, type Ponto } from "@/lib/geo";

export type MarcadorMapa = {
  id: string;
  lat: number;
  lng: number;
  tipo: "profissional" | "pedido";
  titulo: string;
  subtitulo?: string;
  href: string;
  /** texto curto dentro do marcador (iniciais ou ícone) */
  rotulo: string;
  foto?: string | null;
};

const ESTILO = "https://tiles.openfreemap.org/styles/liberty";
const RAIO_AREA_KM = 0.7; // área aproximada (~1 km de diâmetro) em volta do ponto
const CORES = { profissional: "#1E3A8A", pedido: "#C2410C" };

function criarElemento(m: MarcadorMapa) {
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", m.titulo);
  el.style.cssText = `width:40px;height:40px;border-radius:9999px;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);
    background:${CORES[m.tipo]};color:#fff;font:700 13px Inter,system-ui,sans-serif;display:grid;place-items:center;overflow:hidden;cursor:pointer;padding:0`;
  if (m.foto) {
    const img = document.createElement("img");
    img.src = m.foto;
    img.alt = "";
    img.style.cssText = "width:100%;height:100%;object-fit:cover";
    el.appendChild(img);
  } else {
    el.textContent = m.rotulo;
  }
  return el;
}

function criarPopup(m: MarcadorMapa) {
  const div = document.createElement("div");
  div.style.cssText = "font-family:Inter,system-ui,sans-serif;min-width:170px";
  const t = document.createElement("strong");
  t.textContent = m.titulo;
  t.style.cssText = "display:block;font-size:14px";
  div.appendChild(t);
  if (m.subtitulo) {
    const s = document.createElement("span");
    s.textContent = m.subtitulo;
    s.style.cssText = "display:block;font-size:12px;color:#475569;margin:2px 0 8px";
    div.appendChild(s);
  }
  const a = document.createElement("a");
  a.href = m.href;
  a.textContent = m.tipo === "profissional" ? "Ver currículo →" : "Ver pedido →";
  a.style.cssText = `display:flex;align-items:center;justify-content:center;min-height:44px;border-radius:10px;background:${CORES[m.tipo]};color:#fff;font-weight:600;font-size:14px;text-decoration:none`;
  div.appendChild(a);
  return div;
}

export default function MapaBase({
  centro,
  marcadores,
  voce,
  altura = 360,
}: {
  centro: Ponto;
  marcadores: MarcadorMapa[];
  /** onde a pessoa está (aproximado) */
  voce?: Ponto | null;
  altura?: number;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const mapa = useRef<maplibregl.Map | null>(null);
  const pinos = useRef<maplibregl.Marker[]>([]);

  // Cria o mapa uma única vez
  useEffect(() => {
    if (!caixa.current) return;
    const m = new maplibregl.Map({
      container: caixa.current,
      style: ESTILO,
      center: [centro.lng, centro.lat],
      zoom: 12,
      attributionControl: { compact: true },
      cooperativeGestures: true, // no celular: mover o mapa com 2 dedos, sem travar a rolagem da página
      locale: {
        "CooperativeGesturesHandler.WindowsHelpText": "Use Ctrl + rolagem para dar zoom no mapa",
        "CooperativeGesturesHandler.MacHelpText": "Use ⌘ + rolagem para dar zoom no mapa",
        "CooperativeGesturesHandler.MobileHelpText": "Use dois dedos para mover o mapa",
      },
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    // Créditos do mapa começam recolhidos no botão "i" (continuam acessíveis)
    m.once("load", () => caixa.current?.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show"));
    mapa.current = m;
    return () => {
      m.remove();
      mapa.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redesenha marcadores e áreas sempre que a lista muda
  useEffect(() => {
    const m = mapa.current;
    if (!m) return;

    const desenhar = () => {
      pinos.current.forEach((p) => p.remove());
      pinos.current = [];

      const areas: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: marcadores.map((mk) => ({
          type: "Feature",
          properties: { cor: CORES[mk.tipo] },
          geometry: { type: "Polygon", coordinates: [circulo(mk, RAIO_AREA_KM)] },
        })),
      };
      const fonte = m.getSource("areas") as maplibregl.GeoJSONSource | undefined;
      if (fonte) fonte.setData(areas);
      else {
        m.addSource("areas", { type: "geojson", data: areas });
        m.addLayer({ id: "areas-fundo", type: "fill", source: "areas", paint: { "fill-color": ["get", "cor"], "fill-opacity": 0.14 } });
        m.addLayer({ id: "areas-borda", type: "line", source: "areas", paint: { "line-color": ["get", "cor"], "line-width": 1.5, "line-opacity": 0.5 } });
      }

      // Vários pontos na mesma área ficam lado a lado, sem se esconder
      const repeticoes = new Map<string, number>();
      for (const mk of marcadores) {
        const chave = `${mk.lat},${mk.lng}`;
        const n = repeticoes.get(chave) ?? 0;
        repeticoes.set(chave, n + 1);
        const passo = 0.0035 * Math.ceil(n / 3);
        const dx = n === 0 ? 0 : Math.cos(n * 2.1) * passo;
        const dy = n === 0 ? 0 : Math.sin(n * 2.1) * passo;
        const pino = new maplibregl.Marker({ element: criarElemento(mk) })
          .setLngLat([mk.lng + dx, mk.lat + dy])
          .setPopup(new maplibregl.Popup({ offset: 22 }).setDOMContent(criarPopup(mk)))
          .addTo(m);
        pinos.current.push(pino);
      }

      if (voce) {
        const el = document.createElement("div");
        el.setAttribute("aria-label", "Você está por aqui");
        el.style.cssText =
          "width:18px;height:18px;border-radius:9999px;background:#15803D;border:3px solid #fff;box-shadow:0 0 0 6px rgba(21,128,61,.25)";
        pinos.current.push(new maplibregl.Marker({ element: el }).setLngLat([voce.lng, voce.lat]).addTo(m));
      }

      // Enquadra todos os pontos na tela
      const todos: Ponto[] = [...marcadores, ...(voce ? [voce] : [])];
      if (todos.length > 1) {
        const limites = new maplibregl.LngLatBounds();
        todos.forEach((p) => limites.extend([p.lng, p.lat]));
        m.fitBounds(limites, { padding: 50, maxZoom: 14, duration: 0 });
      } else if (todos.length === 1) {
        m.jumpTo({ center: [todos[0].lng, todos[0].lat], zoom: 13 });
      }
    };

    if (m.isStyleLoaded()) desenhar();
    else m.once("load", desenhar);
  }, [marcadores, voce]);

  return (
    <div
      ref={caixa}
      style={{ height: altura }}
      className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
      role="region"
      aria-label="Mapa com áreas aproximadas"
    />
  );
}
