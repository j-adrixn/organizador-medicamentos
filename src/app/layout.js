import './globals.css'

export const metadata = {
  title: 'Organizador de Medicamentos',
  description: 'Panel de control IoT para organizar alertas de medicamentos',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
