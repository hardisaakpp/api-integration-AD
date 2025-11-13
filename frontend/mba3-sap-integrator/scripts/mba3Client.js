import axios from 'axios'

/**
 * Cliente para obtener JWT (sesión) de los Servicios de Acceso Externo de MBA3.
 * 
 * Según documentación:
 * - Login requiere: código (código del servicio) y pwd (contraseña del servicio)
 * - Respuesta devuelve JWT que debe usarse en todas las peticiones
 * - Cada servicio tiene su propio LOGIN y genera una sesión única
 */
class MBA3Client {
  /**
   * Inicializa el cliente MBA3
   * 
   * @param {string} baseUrl - URL base del servidor MBA3 (ej: https://tu-servidor.mba3.com)
   */
  constructor(baseUrl) {
    if (!baseUrl) {
      throw new Error('base_url no puede estar vacío')
    }
    this.baseUrl = baseUrl.replace(/\/$/, '') // Eliminar trailing slash
    this.token = null
    
    this.log('info', `Cliente MBA3 inicializado con URL: ${this.baseUrl}`)
  }

  /**
   * Logging básico
   * @param {string} level - Nivel de log (info, error, warning, debug)
   * @param {string} message - Mensaje a loguear
   */
  log(level, message) {
    const timestamp = new Date().toISOString()
    const levelUpper = level.toUpperCase().padEnd(7)
    console.log(`${timestamp} - ${levelUpper} - ${message}`)
  }

  /**
   * Extrae el JWT de la respuesta del servidor.
   * 
   * Según documentación, el JWT viene en la respuesta del login.
   * Intenta varios formatos comunes.
   * 
   * @param {any} respJson - Respuesta del servidor (objeto o string)
   * @returns {string|null} - JWT encontrado o null
   */
  _extractToken(respJson) {
    // El JWT puede venir directamente como string
    if (typeof respJson === 'string' && respJson.length > 50) {
      return respJson
    }

    // Si no es un objeto, retornar null
    if (typeof respJson !== 'object' || respJson === null) {
      return null
    }

    // Intenta campos comunes
    const commonKeys = ['jwt', 'token', 'access_token', 'session']
    for (const key of commonKeys) {
      if (key in respJson) {
        const value = respJson[key]
        if (typeof value === 'string' && value.length > 50) {
          this.log('debug', `JWT encontrado en campo '${key}'`)
          return value
        }
      }
    }

    // A veces viene dentro de "data"
    if (respJson.data && typeof respJson.data === 'object') {
      for (const key of commonKeys) {
        if (key in respJson.data) {
          const value = respJson.data[key]
          if (typeof value === 'string' && value.length > 50) {
            this.log('debug', `JWT encontrado en data.${key}`)
            return value
          }
        }
      }
    }

    // Si la respuesta es directamente el JWT como string en un campo de texto
    if (respJson.response && typeof respJson.response === 'string' && respJson.response.length > 50) {
      return respJson.response
    }

    return null
  }

  /**
   * Crea un LOGIN y obtiene el JWT (sesión).
   * 
   * Según documentación:
   * - Credenciales: código (código del servicio), pwd (contraseña del servicio)
   * - Si los datos son correctos, regresa un JWT (sesión)
   * - Cada servicio debe tener un LOGIN, cada Login genera una sesión única
   * 
   * @param {string} codigo - Código del servicio configurado en MBA3
   * @param {string} pwd - Contraseña del servicio
   * @param {number} timeout - Timeout en segundos (default: 10)
   * @returns {Promise<string>} - JWT (sesión) como string
   * @throws {Error} - Si hay error en la petición o no se encuentra el token
   */
  async login(codigo, pwd, timeout = 10) {
    const url = `${this.baseUrl}/login_Servicio`
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'MBA3-Client/1.0',
      'Cache-Control': 'no-cache'
    }

    // Probar formatos básicos
    const payloadsToTry = [
      { codigo, pwd },
      { código: codigo, pwd } // Con tilde
    ]

    console.log('\n' + '='.repeat(60))
    console.log('PASO 1: Creando LOGIN para obtener JWT (sesión)')
    console.log('='.repeat(60))
    this.log('info', `Intentando login con código: ${codigo.substring(0, 3)}***`)
    this.log('info', `URL: ${url}`)

    let lastError = null

    for (let i = 0; i < payloadsToTry.length; i++) {
      const payload = payloadsToTry[i]
      
      try {
        this.log('info', `Intento ${i + 1}: Enviando payload: ${Object.keys(payload).join(', ')}`)
        
        const response = await axios.post(url, payload, {
          headers,
          timeout: timeout * 1000, // axios usa milisegundos
          validateStatus: (status) => status < 500 // No lanzar error para códigos 4xx
        })

        this.log('info', `Status code: ${response.status}`)
        
        let body = response.data
        this.log('info', `Response JSON: ${JSON.stringify(body, null, 2)}`)

        if (response.status !== 200) {
          let errorMsg = `Status ${response.status}`
          if (typeof body === 'object' && body !== null) {
            errorMsg = body.error || body.message || JSON.stringify(body)
          } else if (typeof body === 'string') {
            errorMsg = body
          }
          throw new Error(`Error en login: ${errorMsg}`)
        }

        // Manejo de errores específicos
        if (typeof body === 'object' && body !== null && 'error' in body) {
          const errorCode = body.error || 'Error desconocido'
          const errorRespuesta = body.respuesta || ''

          if (errorCode === '005' || errorRespuesta.includes('No existe configuración de Servicio WEB')) {
            if (i < payloadsToTry.length - 1) {
              this.log('warning', `Error 005 en intento ${i + 1}, probando siguiente formato...`)
              continue
            } else {
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
                '5. Verifica que el usuario asociado tiene licencia empresarial\n\n' +
                'VERIFICA EN TU .env:\n' +
                `   - MBA3_CODIGO debe ser exactamente: '${codigo}'\n` +
                '   - MBA3_PWD debe coincidir exactamente con la contraseña del servicio\n' +
                '   - No debe haber espacios extra al inicio o final\n' +
                '   - Respeta mayúsculas/minúsculas\n'
              )
            }
          }

          const errorMsg = errorCode + (errorRespuesta ? `: ${errorRespuesta}` : '')
          throw new Error(`Error en login: ${errorMsg}`)
        }

        // Extraer token
        const token = this._extractToken(body)
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

        this.token = token
        this.log('info', '✅ Login exitoso, JWT obtenido')
        this.log('info', `JWT (primeros 50 caracteres): ${token.substring(0, 50)}...`)
        return token

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
          // Si es el último intento, lanzar el error
          if (error.message) {
            throw error
          }
          throw new Error(`Error en login: ${error.message || error}`)
        }
        
        this.log('error', `Error en intento ${i + 1}: ${error.message}`)
        continue
      }
    }

    throw new Error(`Error en login después de ${payloadsToTry.length} intentos`)
  }

  /**
   * Verifica si hay una sesión activa (JWT almacenado)
   * @returns {boolean}
   */
  isLoggedIn() {
    return this.token !== null
  }
}

export default MBA3Client

