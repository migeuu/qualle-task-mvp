export function formatDate(dateString?: string | null, includeTime = false): string {
  if (!dateString) return ''
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }
  return new Date(dateString).toLocaleDateString('pt-BR', options)
}
