// Promo code is two uppercase letters followed by four digits, e.g. AB1234.
// We model only the format; there is no notion of redeemable codes. See README.
const PROMO_CODE_PATTERN = /^[A-Z]{2}\d{4}$/;

export const PROMO_SEAT_BONUS = 10;

export function isValidPromoCodeFormat(code: string): boolean {
  return PROMO_CODE_PATTERN.test(code);
}

// True iff the field is empty (allowed) or a syntactically valid code.
export function isAcceptablePromoInput(code: string): boolean {
  return code === '' || isValidPromoCodeFormat(code);
}

// Empty string means "no promo" and yields a zero bonus.
export function getPromoSeatBonus(code: string): number {
  return isValidPromoCodeFormat(code) ? PROMO_SEAT_BONUS : 0;
}
