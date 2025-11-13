import axios from 'axios'

/**
 * Función auxiliar para extraer token de la respuesta
 */
function extractTokenFromResponse(respJson) {
  if (typeof respJson === 'string' && respJson.length > 50) {
    return respJson
  }

  if (typeof respJson !== 'object' || respJson === null) {
    return null
  }

  const commonKeys = ['jwt', 'token', 'access_token', 'session']
  for (const key of commonKeys) {
    if (key in respJson) {
      const value = respJson[key]
      if (typeof value === 'string' && value.length > 50) {
        return value
      }
    }
  }

  if (respJson.data && typeof respJson.data === 'object') {
    for (const key of commonKeys) {
      if (key in respJson.data) {
        const value = respJson.data[key]
        if (typeof value === 'string' && value.length > 50) {
          return value
        }
      }
    }
  }

  if (respJson.response && typeof respJson.response === 'string' && respJson.response.length > 50) {
    return respJson.response
  }

  return null
}

/**
 * Función auxiliar para decodificar token JWT
 */
function decodeTokenPayload(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = JSON.parse(atob(parts[1]))
    return {
      expiresAt: payload.expira || payload.expire || payload.exp,
      sessionId: payload.idSession || payload.idSesion || payload.sessionId
    }
  } catch (error) {
    return null
  }
}

/**
 * Servicio para interactuar con MBA3 desde el frontend
 */
export const mba3Service = {
  /**
   * Obtener token JWT de MBA3 directamente
   * @param {string} baseUrl - URL base de MBA3
   * @param {string} codigo - Código del servicio
   * @param {string} pwd - Contraseña del servicio
   * @returns {Promise<{token: string, expiresAt: string}>}
   */
  async getToken(baseUrl, codigo, pwd) {
    // Usar proxy de Vite para evitar CORS
    // Si baseUrl es la URL local, usar el proxy
    const useProxy = baseUrl.includes('192.168.2.159') || baseUrl.includes('localhost')
    const url = useProxy 
      ? `/mba3-proxy/login_Servicio`
      : `${baseUrl.replace(/\/$/, '')}/login_Servicio`
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    }

    // Probar formatos básicos
    const payloadsToTry = [
      { codigo, pwd },
      { código: codigo, pwd } // Con tilde
    ]

    for (let i = 0; i < payloadsToTry.length; i++) {
      const payload = payloadsToTry[i]
      
      try {
        const response = await axios.post(url, payload, {
          headers,
          timeout: 10000,
          validateStatus: (status) => status < 500
        })

        if (response.status !== 200) {
          let errorMsg = `Status ${response.status}`
          if (typeof response.data === 'object' && response.data !== null) {
            errorMsg = response.data.error || response.data.message || JSON.stringify(response.data)
          }
          throw new Error(`Error en login: ${errorMsg}`)
        }

        const body = response.data

        // Manejo de errores específicos
        if (typeof body === 'object' && body !== null && 'error' in body) {
          const errorCode = body.error || 'Error desconocido'
          const errorRespuesta = body.respuesta || ''

          if (errorCode === '005' || errorRespuesta.includes('No existe configuración de Servicio WEB')) {
            if (i < payloadsToTry.length - 1) {
              continue
            }
            throw new Error(
              '❌ Error 005: No existe configuración de Servicio WEB\n\n' +
              'El servidor no encuentra un servicio configurado con las credenciales proporcionadas.\n\n' +
              'VERIFICA EN MBA3:\n' +
              '1. Ve a: Administrador del Sistema > Parámetros > Parámetros Empresa > Parámetros > Acceso Externo\n' +
              '2. Verifica que existe un servicio con:\n' +
              `   - Código exacto: '${codigo}'\n` +
              '   - Contraseña exacta: (la que configuraste)\n' +
              '3. Verifica que el servicio está ACTIVO\n' +
              '4. Verifica que el servicio es de tipo \'Consultas Externas\' o \'API\'\n' +
              '5. Verifica que el usuario asociado tiene licencia empresarial\n'
            )
          }

          const errorMsg = errorCode + (errorRespuesta ? `: ${errorRespuesta}` : '')
          throw new Error(`Error en login: ${errorMsg}`)
        }

        // Extraer token usando función auxiliar
        const token = extractTokenFromResponse(body)
        if (!token) {
          if (i < payloadsToTry.length - 1) {
            continue
          }
          throw new Error(
            `No se encontró JWT en la respuesta.\n` +
            `Respuesta recibida: ${JSON.stringify(body, null, 2)}\n` +
            `Verifica que el servicio esté configurado correctamente.`
          )
        }

        // Decodificar token para obtener expiración
        const tokenInfo = decodeTokenPayload(token)
        
        return {
          token,
          expiresAt: tokenInfo?.expiresAt || null
        }

      } catch (error) {
        if (error.response) {
          const status = error.response.status
          if (status === 401) {
            throw new Error('Credenciales inválidas. Verifica código y contraseña.')
          } else if (status === 403) {
            throw new Error('IP vetada. Tu IP ha sido bloqueada.')
          } else if (status === 429) {
            throw new Error('Demasiadas peticiones. Has excedido el límite.')
          }
        }

        if (i === payloadsToTry.length - 1) {
          throw error
        }
        continue
      }
    }

    throw new Error(`Error en login después de ${payloadsToTry.length} intentos`)
  },

  /**
   * Verificar si el token es válido
   * @param {string} token - Token JWT
   * @returns {Promise<boolean>}
   */
  async verifyToken(token) {
    try {
      // Esta función requeriría un endpoint en el backend
      // Por ahora retornamos true si el token existe
      return !!token
    } catch (error) {
      return false
    }
  },

  /**
   * Obtener información del token (sin verificar con servidor)
   * @param {string} token - Token JWT
   * @returns {Object|null} - Información decodificada del token
   */
  decodeToken(token) {
    return decodeTokenPayload(token)
  }
}
