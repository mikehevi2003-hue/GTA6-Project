"use client";

import { useMemo, useState } from "react";
import type { Language, RadioGenre, RadioStation, RadioTrack } from "@/types/vicelink";
import { tField } from "@/lib/i18n/helpers";
import { t } from "@/lib/i18n/translations";

export type RadioViewProps = {
  lang: Language;
  stations: RadioStation[];
};

const RADIO_GENRES: Array<{
  value: "ALL" | RadioGenre;
  icon: string;
  label: { en: string; es: string };
}> = [
  { value: "ALL", icon: "📻", label: { en: "All Stations", es: "Todas las Emisoras" } },
  { value: "Urbano / Reggaeton", icon: "🔥", label: { en: "Urbano / Reggaeton", es: "Urbano / Reggaetón" } },
  { value: "Hip-Hop / Dirty South", icon: "🎤", label: { en: "Hip-Hop / Dirty South", es: "Hip-Hop / Dirty South" } },
  { value: "World / Jazz", icon: "🎷", label: { en: "World / Jazz", es: "World / Jazz" } },
  { value: "Afrobeats", icon: "🥁", label: { en: "Afrobeats", es: "Afrobeats" } },
  { value: "Rock / Metal", icon: "🎸", label: { en: "Rock / Metal", es: "Rock / Metal" } },
  { value: "Country", icon: "🤠", label: { en: "Country", es: "Country" } },
  { value: "80s Pop", icon: "🌴", label: { en: "80s Pop", es: "Pop de los 80" } },
  { value: "Electronic / Club", icon: "🎧", label: { en: "Electronic / Club", es: "Electrónica / Club" } },
  { value: "Talk & News", icon: "🎙️", label: { en: "Talk & News", es: "Debate y Noticias" } },
  { value: "Unlockable", icon: "🔐", label: { en: "Unlockable", es: "Desbloqueable" } }
];

const QUICK_FIND_CHIPS = [
  "Bad Bunny",
  "RaiNao",
  "Bobby Caldwell",
  "Burna Boy",
  "Gilles Peterson",
  "Slayer",
  "Vault Radio"
];

function buildYouTubeSearchUrl(track: RadioTrack): string {
  const query = encodeURIComponent(`${track.artist} - ${track.title}`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

function buildSpotifySearchUrl(track: RadioTrack): string {
  const query = encodeURIComponent(`${track.artist} ${track.title}`);
  return `https://open.spotify.com/search/${query}`;
}

function trackMatchesQuery(track: RadioTrack, q: string): boolean {
  if (!q) return false;
  return (
    track.title.toLowerCase().includes(q) ||
    track.artist.toLowerCase().includes(q) ||
    (track.year ? track.year.toLowerCase().includes(q) : false)
  );
}

export function RadioView({ lang, stations }: RadioViewProps) {
  const [genre, setGenre] = useState<"ALL" | RadioGenre>("ALL");
  const [search, setSearch] = useState("");

  const isEs = lang === "es";
  const query = search.trim().toLowerCase();

  const totalTracksCount = useMemo(
    () => stations.reduce((acc, s) => acc + s.tracks.length, 0),
    [stations]
  );

  const genreCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: stations.length };
    for (const s of stations) {
      counts[s.genre] = (counts[s.genre] ?? 0) + 1;
    }
    return counts;
  }, [stations]);

  const filteredStations = useMemo(() => {
    return stations.filter((station) => {
      const matchesGenre = genre === "ALL" || station.genre === genre;
      if (!matchesGenre) return false;
      if (!query) return true;

      const stationMatch =
        station.name.toLowerCase().includes(query) ||
        station.hosts.toLowerCase().includes(query) ||
        station.genre.toLowerCase().includes(query) ||
        tField(station.vibe, lang).toLowerCase().includes(query) ||
        (station.unlockNote ? tField(station.unlockNote, lang).toLowerCase().includes(query) : false);

      const trackMatch = station.tracks.some((tr) => trackMatchesQuery(tr, query));
      return stationMatch || trackMatch;
    });
  }, [stations, genre, query, lang]);

  const matchingTrackResults = useMemo(() => {
    if (!query) return [];
    const results: Array<{ station: RadioStation; track: RadioTrack }> = [];
    for (const station of filteredStations) {
      for (const track of station.tracks) {
        if (
          trackMatchesQuery(track, query) ||
          station.name.toLowerCase().includes(query) ||
          station.hosts.toLowerCase().includes(query)
        ) {
          results.push({ station, track });
        }
      }
    }
    return results;
  }, [filteredStations, query]);

  return (
    <section id="view-radio" className="view active">
      <header className="view-header">
        <div>
          <h2>
            {t(
              lang,
              "radio.title",
              isEs
                ? "Emisoras de Radio de Leonida y Buscador de Canciones"
                : "Leonida Radio Stations & Soundtrack Finder"
            )}
          </h2>
          <p>
            {t(
              lang,
              "radio.sub",
              isEs
                ? `${stations.length} emisoras oficiales y ${totalTracksCount}+ canciones confirmadas: Cocoteo FM (Bad Bunny y RaiNao), Worldwide FM, AfroBank FM, Flash FM y Vault Radio.`
                : `${stations.length} official Leonida stations & ${totalTracksCount}+ confirmed tracks: Cocoteo FM (Bad Bunny & RaiNao), Worldwide FM, AfroBank FM, Flash FM & Vault Radio.`
            )}
          </p>
        </div>

        <div className="progress-pill">
          <div className="progress-top">
            <span>📻 {isEs ? " dial de Leonida" : "Leonida Dial"}</span>
            <strong>
              {stations.length} {isEs ? "Emisoras" : "Stations"} • {totalTracksCount}{" "}
              {isEs ? "Canciones" : "Tracks"}
            </strong>
          </div>
        </div>
      </header>

      <div className="controller-guide-banner">
        <div className="guide-steps">
          <span>
            🔎{" "}
            <strong>
              {isEs
                ? "¿Qué emisora toca esta canción?"
                : "Find Which Station Plays This Song:"}
            </strong>
          </span>
          {QUICK_FIND_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              className={`prompt-chip ${search.toLowerCase() === chip.toLowerCase() ? "active" : ""}`}
              onClick={() => setSearch((prev) => (prev.toLowerCase() === chip.toLowerCase() ? "" : chip))}
            >
              {chip}
            </button>
          ))}
        </div>
        <div className="guide-warning">
          🎧{" "}
          {isEs
            ? "Tip: Equipa los audífonos en el inventario para escuchar cualquier emisora a pie."
            : "Tip: Equip in-game Earbuds from your inventory to listen to any station on foot."}
        </div>
      </div>

      <div className="controls-bar">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t(
            lang,
            "radio.search",
            isEs
              ? "Buscar canción, artista, locutor o emisora (ej. Bad Bunny, Bobby Caldwell, Burna Boy, Slayer)..."
              : "Search song title, artist, DJ host, or station (e.g., Bad Bunny, Bobby Caldwell, Burna Boy, Slayer)..."
          )}
          aria-label={isEs ? "Buscar canción o emisora" : "Search song or station"}
        />
        {(search || genre !== "ALL") && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setSearch("");
              setGenre("ALL");
            }}
          >
            {isEs ? "Limpiar Búsqueda" : "Clear Search"}
          </button>
        )}
      </div>

      <div className="map-layer-chips genre-chips" role="tablist" aria-label={isEs ? "Géneros de radio" : "Radio genres"}>
        {RADIO_GENRES.map((g) => {
          const active = genre === g.value;
          const count = genreCounts[g.value] ?? 0;
          return (
            <button
              key={g.value}
              type="button"
              role="tab"
              aria-selected={active}
              className={`layer-chip ${active ? "active" : ""}`}
              onClick={() => setGenre(g.value)}
            >
              {g.icon} {tField(g.label, lang)} ({count})
            </button>
          );
        })}
      </div>

      {query && matchingTrackResults.length > 0 && (
        <div className="toast-banner toast-info" style={{ flexWrap: "wrap" }}>
          <span>
            🎵{" "}
            {isEs
              ? `Se encontraron ${matchingTrackResults.length} pistas en ${filteredStations.length} emisora(s) para "${search.trim()}"`
              : `Found ${matchingTrackResults.length} matching tracks across ${filteredStations.length} station(s) for "${search.trim()}"`}
          </span>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>
            {filteredStations.map((s) => s.name).join(" • ")}
          </span>
        </div>
      )}

      {filteredStations.length === 0 ? (
        <div className="paywall-box" style={{ maxWidth: 460 }}>
          <h3>{isEs ? "No se encontraron emisoras ni canciones" : "No Matching Stations or Tracks"}</h3>
          <p>
            {isEs
              ? "Prueba con otro artista, canción o selecciona Todas las Emisoras."
              : "Try another artist, song title, or switch back to All Stations."}
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setSearch("");
              setGenre("ALL");
            }}
          >
            {isEs ? "Ver las 25 Emisoras" : "Show All 25 Stations"}
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredStations.map((station) => {
            const genreMeta = RADIO_GENRES.find((g) => g.value === station.genre);
            const genreLabel = genreMeta ? `${genreMeta.icon} ${tField(genreMeta.label, lang)}` : station.genre;
            const isStationHighlighted =
              Boolean(query) &&
              (station.name.toLowerCase().includes(query) ||
                station.hosts.toLowerCase().includes(query) ||
                station.tracks.some((tr) => trackMatchesQuery(tr, query)));

            return (
              <article
                key={station.id}
                className={`cheat-card radio-station-card ${isStationHighlighted ? "highlighted" : ""}`}
              >
                <div>
                  <div className="card-top" style={{ flexWrap: "wrap", gap: 6 }}>
                    <span className="cat-tag">{genreLabel}</span>
                    {station.unlockNote ? (
                      <span className="secret-pill">
                        🔐 {isEs ? "EMISORA SECRETA" : "SECRET STATION"}
                      </span>
                    ) : (
                      <span className="tier-chip">
                        {station.tracks.length} {isEs ? "Pistas" : "Tracks"}
                      </span>
                    )}
                  </div>

                  <h3>{station.name}</h3>
                  <p className="station-host-line">
                    🎙️ <strong>{isEs ? "Locutores / DJ:" : "Hosts / DJ:"}</strong> {station.hosts}
                  </p>
                  <p style={{ marginTop: 4 }}>{tField(station.vibe, lang)}</p>

                  {station.unlockNote && (
                    <div className="unlock-pill" style={{ marginTop: 10 }}>
                      <strong>🔓 {isEs ? "Cómo Desbloquear:" : "How to Unlock:"}</strong>{" "}
                      {tField(station.unlockNote, lang)}
                    </div>
                  )}
                </div>

                <div className="station-tracklist">
                  {station.tracks.map((track) => {
                    const matched = Boolean(query) && trackMatchesQuery(track, query);
                    return (
                      <div
                        key={track.id}
                        className={`track-row ${matched ? "matched" : ""}`}
                      >
                        <div className="track-meta">
                          <div className="track-title-line">
                            {track.featured && (
                              <span className="track-featured-dot" title={isEs ? "Pista destacada" : "Featured track"}>
                                ★
                              </span>
                            )}
                            <strong>{track.title}</strong>
                            {track.year && <span className="track-year">({track.year})</span>}
                          </div>
                          <span className="track-artist">{track.artist}</span>
                        </div>

                        <div className="track-listen-actions">
                          <a
                            href={buildYouTubeSearchUrl(track)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ext-listen-btn yt"
                            aria-label={`Listen to ${track.title} by ${track.artist} on YouTube`}
                          >
                            ▶ YouTube
                          </a>
                          <a
                            href={buildSpotifySearchUrl(track)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ext-listen-btn sp"
                            aria-label={`Listen to ${track.title} by ${track.artist} on Spotify`}
                          >
                            ♫ Spotify
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default RadioView;
