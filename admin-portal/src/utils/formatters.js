export const formatCurrency = (amount, compact = false) => {
  if (compact) {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPercent = (value, digits = 1) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}%`;
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-IN').format(num);
};

export const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const getStatusColor = (status) => {
  const colors = {
    completed: 'text-emerald-400 bg-emerald-400/10',
    processing: 'text-amber-400 bg-amber-400/10',
    failed: 'text-red-400 bg-red-400/10',
    active: 'text-emerald-400 bg-emerald-400/10',
    paused: 'text-amber-400 bg-amber-400/10',
    Hot: 'text-red-400 bg-red-400/10',
    Warm: 'text-amber-400 bg-amber-400/10',
    Engaged: 'text-primary-400 bg-primary-400/10',
    'At Risk': 'text-surface-400 bg-surface-800',
  };
  return colors[status] || 'text-surface-400 bg-surface-800';
};
