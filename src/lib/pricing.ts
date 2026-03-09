/**
 * Regional Pricing Logic for HoopsAI
 */

export function getPriceUSD(countryCode: string): number {
  const highTier = ['US', 'CA', 'GB', 'FR', 'DE', 'AU', 'NZ', 'ES', 'IT', 'JP', 'KR'];
  const latin = ['MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'UY', 'EC'];
  
  const code = countryCode.toUpperCase();

  if (latin.includes(code) || code === 'CN') {
    return 5; // LATAM + China
  }
  
  if (highTier.includes(code)) {
    return 15; // High Tier
  }

  // Default: regional low price
  return 7;
}

export const PRICING_CONFIG = {
  FREE_TRIAL_MONTHS: 1,
  CURRENCY: 'USD',
};
