import axios from 'axios'
import md5 from 'js-md5'

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
  },

  /**
   * Realizar consulta a MBA3 usando Digest Auth y form-data
   * @param {string} url - URL completa del endpoint
   * @param {Object} formData - Objeto con los datos del form-data (key-value pairs)
   * @param {string} username - Usuario para Digest Auth
   * @param {string} password - Contraseña para Digest Auth
   * @param {Object} customHeaders - Headers personalizados adicionales (opcional)
   * @returns {Promise<{status: number, data: any, headers: any}>}
   */
  async consulta(url, formData, username, password, customHeaders = {}) {
    // Usar proxy si es URL local
    const useProxy = url.includes('192.168.2.159') || url.includes('localhost')
    let targetUrl = url
    let uri = ''
    
    if (useProxy) {
      // Extraer la ruta del endpoint de la URL completa
      try {
        const urlObj = new URL(url)
        uri = urlObj.pathname + urlObj.search
        targetUrl = `/mba3-proxy${uri}`
      } catch {
        // Si no es una URL válida, usar como está
        uri = url.startsWith('/') ? url : `/${url}`
        targetUrl = `/mba3-proxy${uri}`
      }
    } else {
      try {
        const urlObj = new URL(url)
        uri = urlObj.pathname + urlObj.search
      } catch {
        uri = url
      }
    }

    // Convertir objeto a FormData
    const formDataObj = new FormData()
    for (const [key, value] of Object.entries(formData)) {
      formDataObj.append(key, value)
    }

    // Función para parsear el challenge de Digest Auth
    function parseDigestChallenge(wwwAuthenticate) {
      const challenge = {}
      // Remover "Digest " del inicio
      const challengeStr = wwwAuthenticate.replace(/^Digest\s+/i, '')
      
      // Regex mejorado para capturar valores con o sin comillas
      const regex = /(\w+)=(?:"([^"]*)"|([^,\s]+))/g
      let match
      while ((match = regex.exec(challengeStr)) !== null) {
        challenge[match[1]] = match[2] || match[3] || ''
      }
      return challenge
    }

    // Función para generar el header de Digest Auth
    function generateDigestAuthHeader(method, uri, challenge, username, password) {
      const realm = challenge.realm || ''
      const nonce = challenge.nonce || ''
      const qop = challenge.qop || ''
      const algorithm = challenge.algorithm || 'MD5'
      
      // HA1 = MD5(username:realm:password)
      const ha1 = md5(`${username}:${realm}:${password}`)
      
      // HA2 = MD5(method:uri)
      const ha2 = md5(`${method}:${uri}`)
      
      // Response = MD5(HA1:nonce:nonceCount:cnonce:qop:HA2)
      // Para simplificar, usamos qop=auth sin nonceCount y cnonce
      let response
      if (qop && qop.includes('auth')) {
        const cnonce = md5(`${Date.now()}:${Math.random()}`).substring(0, 16)
        const nc = '00000001'
        response = md5(`${ha1}:${nonce}:${nc}:${cnonce}:auth:${ha2}`)
        
        return `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uri}", qop=auth, nc=${nc}, cnonce="${cnonce}", response="${response}", algorithm=${algorithm}`
      } else {
        // Sin qop
        response = md5(`${ha1}:${nonce}:${ha2}`)
        return `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${response}", algorithm=${algorithm}`
      }
    }

    try {
      // Primera petición sin auth para obtener el challenge
      let response
      try {
        // Combinar headers personalizados con los headers por defecto
        const headers = {
          'Accept': 'application/json',
          ...customHeaders
        }
        
        response = await axios.post(targetUrl, formDataObj, {
          headers,
          validateStatus: () => true, // No lanzar error para 401
          timeout: 30000
        })
      } catch (error) {
        if (error.response && error.response.status === 401) {
          response = error.response
        } else {
          throw error
        }
      }

      // Si ya tenemos 200, retornar directamente
      if (response.status === 200) {
        return {
          status: response.status,
          data: response.data,
          headers: response.headers
        }
      }

      // Si es 401, obtener el challenge y hacer la petición con Digest Auth
      if (response.status === 401) {
        const wwwAuthenticate = response.headers['www-authenticate'] || response.headers['WWW-Authenticate']
        
        if (!wwwAuthenticate || !wwwAuthenticate.startsWith('Digest')) {
          throw new Error('El servidor no soporta Digest Auth o no envió el challenge correctamente')
        }

        const challenge = parseDigestChallenge(wwwAuthenticate)
        
        // Usar la URI calculada anteriormente o extraerla de targetUrl
        let digestUri = uri
        if (!digestUri) {
          try {
            const urlObj = new URL(targetUrl)
            digestUri = urlObj.pathname + urlObj.search
          } catch {
            // Si targetUrl es relativa, usar como está
            digestUri = targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`
          }
        }
        
        // Generar header de Digest Auth
        const authHeader = generateDigestAuthHeader('POST', digestUri, challenge, username, password)

        // Combinar headers personalizados con los headers por defecto
        // El header Authorization tiene prioridad sobre cualquier header personalizado
        const headers = {
          'Accept': 'application/json',
          ...customHeaders,
          'Authorization': authHeader // Authorization siempre al final para tener prioridad
        }

        // Segunda petición con Digest Auth
        response = await axios.post(targetUrl, formDataObj, {
          headers,
          validateStatus: () => true,
          timeout: 30000
        })
      }

      return {
        status: response.status,
        data: response.data,
        headers: response.headers
      }
    } catch (error) {
      if (error.response) {
        return {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
          error: error.message
        }
      }
      throw error
    }
  }
}
