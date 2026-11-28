// Décor animé affiché uniquement quand le thème "cosmos" est actif (CSS).
// Markup statique + animations CSS (transform/opacity, GPU) — aucun JS, aucun coût hors cosmos.
export function CosmosScene() {
  return (
    <div className="cosmos-scene" aria-hidden>
      <div className="cx-planet" />
      <div className="cx-shoot" />
      <svg className="cx-plane" viewBox="0 0 24 24" fill="currentColor" width="34" height="34">
        <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
      </svg>
      <svg className="cx-shuttle" viewBox="0 0 24 24" fill="currentColor" width="30" height="30">
        <path d="M12 2c2.5 2 4 5 4 9 0 1.8-.4 3.4-1 4.8l-3 .2-3-.2c-.6-1.4-1-3-1-4.8 0-4 1.5-7 4-9z" />
        <circle cx="12" cy="9" r="1.4" fill="#0b1220" />
        <path d="M8 15l-2 3 3-1zM16 15l2 3-3-1z" />
        <path d="M10.5 16l1.5 4 1.5-4z" opacity="0.8" />
      </svg>
    </div>
  );
}
