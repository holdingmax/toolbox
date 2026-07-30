// Los tests de integración hacen múltiples round-trips reales contra la
// branch de test de Neon (no una base local) — el timeout default de Jest
// (5s) no alcanza. 30s cubre incluso el "cold start" de la conexión pooled.
jest.setTimeout(30000)
