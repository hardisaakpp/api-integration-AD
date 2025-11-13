/**
 * Script para obtener el JWT (sesión) mediante LOGIN.
 * 
 * Según documentación técnica de MBA3:
 * 
 * - El usuario debe crear un LOGIN, necesario para el uso de los servicios
 * - Credenciales: código (código del servicio), pwd (contraseña del servicio)
 * - Si los datos son correctos, regresa un JWT (sesión)
 * - Es importante almacenar el JWT en una variable en memoria para hacer uso 
 *   en todas las peticiones de los Servicios creados
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import MBA3Client from './mba3Client.js'

// Obtener ruta del directorio actual (equivalente a __dirname en CommonJS)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Cargar variables de entorno desde .env en la raíz del proyecto
dotenv.config({ path: resolve(__dirname, '..', '.env') })

const BASE_URL = process.env.MBA3_BASE_URL
const CODIGO = process.env.MBA3_CODIGO
const PWD = process.env.MBA3_PWD

if (!BASE_URL || !CODIGO || !PWD) {
  console.error('\n❌ ERROR: Falta configurar variables de entorno en .env')
  console.error('\nVariables requeridas:')
  console.error('  - MBA3_BASE_URL')
  console.error('  - MBA3_CODIGO')
  console.error('  - MBA3_PWD')
  console.error('\nCrea un archivo .env en la raíz del proyecto con estas variables.')
  process.exit(1)
}

/**
 * Obtiene el JWT (sesión) mediante LOGIN.
 * 
 * El JWT obtenido debe ser usado en peticiones posteriores de APIs o Consultas.
 * Usa el método consulta() de MBA3Client para realizar consultas SQL con el JWT.
 * 
 * @returns {Promise<string|null>} - JWT obtenido o null si hay error
 */
async function main() {
  const client = new MBA3Client(BASE_URL)
  
  try {
    const token = await client.login(CODIGO, PWD)
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ LOGIN EXITOSO - JWT (sesión) obtenido')
    console.log('='.repeat(60))
    console.log(`\nJWT: ${token}`)
    console.log(`\n⚠️  IMPORTANTE: Almacena este JWT para usarlo en tus peticiones.`)
    console.log(`   El JWT tiene un tiempo de expiración limitado.`)
    console.log(`   Si expira, deberás realizar un nuevo LOGIN.\n`)
    
    return token
  } catch (error) {
    console.log('\n' + '='.repeat(60))
    console.log('❌ ERROR EN LOGIN')
    console.log('='.repeat(60))
    console.log(`\n${error.message}\n`)
    return null
  }
}

// Ejecutar main si es llamado directamente
main()
  .then((token) => {
    if (token) {
      process.exit(0)
    } else {
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('Error inesperado:', error)
    process.exit(1)
  })

export default main

