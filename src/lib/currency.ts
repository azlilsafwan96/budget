export function fmt(cents: number): string {
  return "RM " + (cents / 100).toLocaleString("en-MY", { minimumFractionDigits: 0 });
}
