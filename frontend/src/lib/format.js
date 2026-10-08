export const fmt = (n, opts = {}) => {
  const { sign = false, decimals = 0 } = opts;
  const abs = Math.abs(n || 0);
  const s = abs.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  if (sign) return `${n < 0 ? "-" : "+"}$${s}`;
  return `${n < 0 ? "-" : ""}$${s}`;
};

export const fmtC = (n) => fmt(n, { decimals: 2 });

export const dateLabel = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
};

export const relativeMonths = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const months = (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth());
  return months;
};
