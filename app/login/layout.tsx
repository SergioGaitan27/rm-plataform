import { Metadata } from 'next'
import { generateMetadata as generateMetadataHelper } from '../generateMetadata'

export const metadata: Metadata = generateMetadataHelper('/login')

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}