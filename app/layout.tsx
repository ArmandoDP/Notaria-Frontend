import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Notaría Pública No. 3',
  description: 'Plataforma de solicitud y estado de trabajo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}