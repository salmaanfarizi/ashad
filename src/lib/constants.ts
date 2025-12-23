// Application constants

// Company information
export const COMPANY_NAME = "MobTech";
export const COMPANY_TAGLINE = "Your Business Management Solution";

// Currency settings
export const CURRENCY_CODE = "SAR";
export const CURRENCY_LOCALE = "en-SA";

// Date range options for reports
export const DATE_RANGE_OPTIONS = {
  week: "This Week",
  month: "This Month",
  quarter: "This Quarter",
  year: "This Year",
  all: "All Time",
} as const;

// Payment methods
export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
] as const;

// Expense categories
export const EXPENSE_CATEGORIES = [
  "Rent",
  "Utilities",
  "Salaries",
  "Marketing",
  "Office Supplies",
  "Transportation",
  "Maintenance",
  "Insurance",
  "Taxes",
  "Other",
] as const;

// Product units
export const PRODUCT_UNITS = [
  { value: "pcs", label: "Pieces" },
  { value: "kg", label: "Kilograms" },
  { value: "ltr", label: "Liters" },
  { value: "box", label: "Boxes" },
  { value: "set", label: "Sets" },
] as const;
