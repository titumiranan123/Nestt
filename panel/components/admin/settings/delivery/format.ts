export function money(value: string | null, empty = "Tk. 0") {
  if (value === null) return empty;
  const amount = Number(value);
  return Number.isFinite(amount)
    ? `Tk. ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    : empty;
}

export const classes = (...values: Array<string | undefined>) => values.filter(Boolean).join(" ");
