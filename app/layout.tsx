import { Provider } from "./provider";
import { Inter } from 'next/font/google'
import './globals.css'
import { generateMetadata as generateMetadataHelper } from './generateMetadata'
import { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata({ params }: { params: { slug: string[] } }): Promise<Metadata> {
  const path = `/${params.slug?.join('/') || ''}`
  const baseMetadata = generateMetadataHelper(path)
  
  return {
    ...baseMetadata,
    icons: [
      { rel: 'icon', url: '/favicon.ico' },
      { rel: 'apple-touch-icon', url: '/apple-icon.png' },
    ],
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.className}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <Provider>
          {children}
        </Provider>
      </body>
    </html>
  );
}