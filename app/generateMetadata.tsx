import { Metadata } from 'next'

export function generateMetadata(path: string = '/'): Metadata {
  let title = 'RMAZH'
  
  switch(path) {
    case '/':
      title = 'Home | RMAZH'
      break
    case '/login':
      title = 'Login | RMAZH'
      break
    case '/register':
      title = 'Registrar | RMAZH'
      break
    // Añade más casos según sea necesario
    default:
      // Asegúrate de que path no sea undefined antes de usar charAt
      title = path ? `${path.charAt(1).toUpperCase() + path.slice(2)} | RMAZH` : 'RMAZH'
  }

  return {
    title,
    // Puedes añadir más metadatos aquí si lo necesitas
  }
}