/**
 * Format a UTC date string as relative time using Beijing time (UTC+8).
 * 
 * For dates within 7 days: shows relative time (刚刚, X分钟前, X小时前, X天前)
 * For dates older than 7 days: shows full datetime in Beijing time (YYYY/MM/DD HH:MM)
 */
export function formatRelativeTime(dateStr: string, now: Date = new Date()): string {
  // Parse as UTC
  const date = new Date(dateStr)
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  // Convert to Beijing time (UTC+8) for display
  const beijingOffset = 8 * 60 // minutes
  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes()
  const beijingMinutes = utcMinutes + beijingOffset
  const beijingHours = Math.floor(beijingMinutes / 60) % 24
  const beijingMins = beijingMinutes % 60

  // Handle day overflow for dates near midnight Beijing time
  let beijingDay = date.getUTCDate()
  let beijingMonth = date.getUTCMonth()
  let beijingYear = date.getUTCFullYear()
  
  if (beijingHours < 8 && utcMinutes >= 960) {
    // Crossed midnight in Beijing time
    beijingDay += 1
    const daysInMonth = new Date(beijingYear, beijingMonth + 1, 0).getDate()
    if (beijingDay > daysInMonth) {
      beijingDay = 1
      beijingMonth += 1
      if (beijingMonth > 11) {
        beijingMonth = 0
        beijingYear += 1
      }
    }
  }

  const year = beijingYear
  const month = String(beijingMonth + 1).padStart(2, '0')
  const day = String(beijingDay).padStart(2, '0')
  const h = String(beijingHours).padStart(2, '0')
  const m = String(beijingMins).padStart(2, '0')

  return `${year}/${month}/${day} ${h}:${m}`
}
