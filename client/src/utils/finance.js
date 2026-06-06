export const generateDocumentNumber = (prefix) => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const randomStr = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}${month}-${randomStr}`;
};

export const calculateTotals = (items, taxAmount = 0, discountAmount = 0) => {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
  const total = subtotal + Number(taxAmount) - Number(discountAmount);
  return {
    subtotal: Math.max(0, subtotal),
    tax: Math.max(0, Number(taxAmount)),
    discount: Math.max(0, Number(discountAmount)),
    total: Math.max(0, total)
  };
};
