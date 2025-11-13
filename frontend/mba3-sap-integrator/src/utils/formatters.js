import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export const formatters = {
  date: (date, formatStr = 'dd/MM/yyyy') => {
    if (!date) return '-'
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date
      return format(dateObj, formatStr, { locale: es })
    } catch (e) {
      return '-'
    }
  },

  datetime: (date) => {
    return formatters.date(date, 'dd/MM/yyyy HH:mm:ss')
  },

  currency: (value, currency = 'MXN') => {
    if (value === null || value === undefined) return '-'
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency
    }).format(value)
  },

  number: (value, decimals = 2) => {
    if (value === null || value === undefined) return '-'
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value)
  }
}

