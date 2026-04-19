// Utility function to format large numbers with K, M, B suffixes
export const formatLargeNumber = (value: number): { display: string; full: string } => {
  const absValue = Math.abs(value);
  
  let display: string;
  if (absValue >= 1_000_000_000) {
    display = (value / 1_000_000_000).toFixed(1) + 'B';
  } else if (absValue >= 1_000_000) {
    display = (value / 1_000_000).toFixed(1) + 'M';
  } else if (absValue >= 1_000) {
    display = (value / 1_000).toFixed(1) + 'K';
  } else {
    display = value.toFixed(2);
  }
  
  // Full number with commas
  const full = value.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return { display, full };
};

export const formatCurrency = (amount: number) => {
  return `R${amount.toFixed(2)}`;
};
