function normalizeDateInput(date: Date | string | number): Date {
  if (typeof date === 'number') {
    const ms = date < 10_000_000_000 ? date * 1000 : date;
    return new Date(ms);
  }
  return new Date(date);
}

export function formatDate(date: Date | string | number): string {
  const d = normalizeDateInput(date);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 0) return '刚刚';
  
  // 小于1小时
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return minutes < 1 ? '刚刚' : `${minutes}分钟前`;
  }
  
  // 小于24小时
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}小时前`;
  }
  
  // 小于7天
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}天前`;
  }
  
  // 默认显示日期
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatCareerDate(date: Date | string | number): string {
  const d = normalizeDateInput(date);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 0) return '刚刚';

  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return minutes < 1 ? '刚刚' : `${minutes}分钟前`;
  }

  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}小时前`;
  }

  const days = Math.floor(diff / 86400000);
  if (days <= 30) {
    return `${days}天前`;
  }

  if (days >= 365) {
    const years = Math.max(1, Math.floor(days / 365));
    return `${years}年前`;
  }

  const months = Math.max(1, Math.floor(days / 30));
  return `${months}个月前`;
}

export function formatDateFull(date: Date | string | number): string {
  const d = normalizeDateInput(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
