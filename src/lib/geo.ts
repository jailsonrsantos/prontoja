/** Centro de Teresina (Praça da Bandeira, aproximado) */
export const CENTRO_TERESINA = { lat: -5.0898, lng: -42.8131 };

/** Arredonda para uma grade de ~1 km (mesma regra do banco) */
export const arredondar = (x: number) => Math.round(x * 100) / 100;

export type Ponto = { lat: number; lng: number };

export function formatarDistancia(km: number | null | undefined) {
  if (km == null) return "";
  if (km < 1) return "menos de 1 km";
  return `~${String(km).replace(".", ",").replace(/,0+$/, "")} km`;
}

/** Pede a localização ao celular e já devolve ARREDONDADA (~1 km). */
export function pedirLocalizacao(): Promise<Ponto> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("Seu aparelho não informa a localização."));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: arredondar(pos.coords.latitude), lng: arredondar(pos.coords.longitude) }),
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? "Você não permitiu o acesso à localização. Vamos usar o seu bairro."
              : "Não foi possível obter sua localização agora. Vamos usar o seu bairro.",
          ),
        ),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 },
    );
  });
}

/** Polígono de um círculo (para desenhar a "área aproximada" no mapa) */
export function circulo(centro: Ponto, raioKm: number, lados = 48): [number, number][] {
  const pontos: [number, number][] = [];
  const dLat = raioKm / 110.574;
  const dLng = raioKm / (111.32 * Math.cos((centro.lat * Math.PI) / 180));
  for (let i = 0; i <= lados; i++) {
    const t = (i / lados) * 2 * Math.PI;
    pontos.push([centro.lng + dLng * Math.cos(t), centro.lat + dLat * Math.sin(t)]);
  }
  return pontos;
}
