// Cuando VITE_ADMIN_DIRECT=true (se define en .env.production), la app arranca
// directamente en el panel de administrador, sin pasar por la tienda ni el login.
// En desarrollo local el flag está ausente, así que la app funciona normal.
export const DIRECT_ADMIN = import.meta.env.VITE_ADMIN_DIRECT === 'true';
