import { ApiError } from './api'

const knownMessages = {
  'El correo es obligatorio': 'validation.emailRequired',
  'El correo no es válido': 'validation.emailInvalid',
  'La contraseña es obligatoria': 'validation.passwordRequired',
  'La contraseña debe tener al menos 8 caracteres': 'validation.passwordShort',
  'El nombre es obligatorio': 'validation.nameRequired',
  'El nombre debe tener entre 1 y 80 caracteres': 'validation.nameLength',
  'Ese correo ya está registrado': 'auth.duplicateEmail',
  'Ese nombre de usuario ya está en uso': 'auth.duplicateUsername',
  'El nombre de usuario es obligatorio': 'validation.usernameRequired',
  'El nombre de usuario solo puede tener letras, números, puntos o guiones bajos (1 a 30)': 'validation.usernameCharset',
  'Ingresa tu correo o usuario': 'validation.identifierRequired',
  'Ingresa un correo válido': 'validation.emailInvalid',
  'Ingresa un usuario válido': 'validation.usernameCharset',
  'Correo, usuario o contraseña incorrectos': 'auth.invalidCredentials',
  'La sesión ya no es válida. Vuelve a iniciar sesión.': 'auth.sessionExpired',
  'La sesión no es válida o ya expiró': 'auth.sessionExpired',
  'Debe iniciar sesión': 'auth.sessionRequired',
  'La cuenta está suspendida': 'auth.suspended',
  'Ocurrió un error inesperado': 'auth.unexpected',
}

const fields = {
  nombre: 'name',
  nombreUsuario: 'username',
  correo: 'email',
  identificador: 'identifier',
  password: 'password',
}

function translateMessage(mensaje) {
  if (!mensaje) return 'auth.unavailable'
  return knownMessages[mensaje] || mensaje
}

export function describeApiError(error) {
  if (!(error instanceof ApiError) || error.codigo === 'RED' || error.status === 0) {
    return { fields: {}, form: 'auth.unavailable' }
  }

  const fieldErrors = {}
  const list = error.detalles?.errores

  if (Array.isArray(list)) {
    for (const item of list) {
      const field = fields[item.campo]
      if (!field || fieldErrors[field]) continue
      fieldErrors[field] = translateMessage(item.mensaje)
    }
  }

  if (error.codigo === 'CONFLICTO' && Object.keys(fieldErrors).length === 0) {
    const message = translateMessage(error.message)
    fieldErrors[message === 'auth.duplicateUsername' ? 'username' : 'email'] = message
  }

  return {
    fields: fieldErrors,
    form: Object.keys(fieldErrors).length > 0 ? '' : translateMessage(error.message),
  }
}
