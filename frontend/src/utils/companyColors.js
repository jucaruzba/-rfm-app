// Curated palette of clean, professional colors for companies
export const COMPANY_PALETTE = [
  '#2563EB', // Blue
  '#7C3AED', // Purple
  '#059669', // Emerald
  '#D97706', // Amber
  '#DC2626', // Red
  '#0891B2', // Cyan
  '#4F46E5', // Indigo
  '#EA580C', // Orange
  '#0D9488', // Teal
  '#9333EA', // Violet
  '#BE185D', // Pink
  '#475569', // Slate
];

/**
 * Returns a deterministic or assigned color for a given company.
 * @param {Object|string|number} company - Company object, id, or name
 * @returns {string} Hex color code
 */
export function getCompanyColor(company) {
  if (!company) return COMPANY_PALETTE[0];
  
  if (typeof company === 'object') {
    if (company.colorCode) return company.colorCode;
    const identifier = company.idCompany ?? company.name ?? 0;
    return getCompanyColorByIdentifier(identifier);
  }
  
  return getCompanyColorByIdentifier(company);
}

function getCompanyColorByIdentifier(identifier) {
  if (typeof identifier === 'number') {
    const idx = Math.abs(identifier) % COMPANY_PALETTE.length;
    return COMPANY_PALETTE[idx];
  }
  
  // String hash
  const str = String(identifier || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % COMPANY_PALETTE.length;
  return COMPANY_PALETTE[idx];
}

/**
 * Helper to convert hex to rgba
 */
export function hexToRgba(hex, alpha = 0.15) {
  if (!hex || typeof hex !== 'string') return `rgba(37, 99, 235, ${alpha})`;
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6) return `rgba(37, 99, 235, ${alpha})`;
  
  const num = parseInt(cleanHex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
