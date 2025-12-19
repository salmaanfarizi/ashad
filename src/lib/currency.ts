// Currency formatting utility for Saudi Riyal
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
  }).format(amount);
}

// For PDF documents (returns string without special characters)
export function formatCurrencyForPDF(amount: number): string {
  return `SAR ${amount.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
