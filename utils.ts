export const formatCurrency = (amount: number) => {
  return 'LKR ' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatInputNumber = (value: string) => {
  // Remove non-digit characters
  const digits = value.replace(/\D/g, '');
  // Limit to 10 digits
  const truncated = digits.slice(0, 10);
  // Format with commas
  if (!truncated) return '';
  return parseInt(truncated).toLocaleString('en-US');
};

export const parseInputNumber = (formattedValue: string) => {
  return parseInt(formattedValue.replace(/,/g, '') || '0');
};

// Helper for real-time amount input formatting (allowing decimals)
export const formatAmountInput = (val: string) => {
    // Allow empty
    if (val === '') return '';
    
    // Normalize: remove commas
    let clean = val.replace(/,/g, '');
    
    // Allow one decimal point
    const parts = clean.split('.');
    if (parts.length > 2) return val; // Don't allow second dot
    
    // Clean non-numeric
    parts[0] = parts[0].replace(/\D/g, '');
    if (parts[1] !== undefined) {
        parts[1] = parts[1].replace(/\D/g, '');
    }

    // Limit integer part to 10 digits
    if (parts[0].length > 10) {
        parts[0] = parts[0].slice(0, 10);
    }

    // Add commas to integer part
    const formattedInt = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    if (parts.length > 1) {
        // Limit decimal to 2 digits
        return `${formattedInt}.${parts[1].slice(0, 2)}`;
    }
    
    // If original string ended with dot, keep it
    if (val.endsWith('.')) {
        return `${formattedInt}.`;
    }

    return formattedInt;
};
