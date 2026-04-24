/**
 * Format a UTC date string as relative time using the specified IANA timezone.
 * 
 * For dates within 7 days: shows relative time (刚刚, X分钟前, X小时前, X天前)
 * For dates older than 7 days: shows full datetime (YYYY/MM/DD HH:MM)
 * 
 * Uses Intl.DateTimeFormat for proper timezone conversion.
 */
export function formatRelativeTime(dateStr: string, timezone: string = 'Asia/Shanghai', now?: Date): string {
  const date = new Date(dateStr)
  const refTime = now || new Date()
  const diff = refTime.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  // Format in the specified timezone
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || ''

  const year = getPart('year')
  const month = getPart('month')
  const day = getPart('day')
  const hour = getPart('hour')
  const minute = getPart('minute')

  return `${year}/${month}/${day} ${hour}:${minute}`
}
