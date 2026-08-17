export function formatCurrencyINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function generateTransactionId(): string {
  const randomDigits = Math.floor(10000000 + Math.random() * 90000000).toString();
  return `TXN${randomDigits}`;
}

export function generateReceiptId(date: Date = new Date()): string {
  const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
  return `SR-${yyyymmdd}-${randomSuffix}`;
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [user, domain] = email.split('@');
  if (user.length <= 3) {
    return `${user.charAt(0)}***@${domain}`;
  }
  const visiblePrefix = user.slice(0, 2);
  const visibleSuffix = user.slice(-1);
  return `${visiblePrefix}****${visibleSuffix}@${domain}`;
}
