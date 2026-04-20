export function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
