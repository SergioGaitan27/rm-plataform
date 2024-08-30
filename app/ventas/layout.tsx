import { Metadata } from 'next'
import { generateMetadata as generateMetadataHelper } from '../generateMetadata'
import Head from 'next/head'

export const metadata: Metadata = generateMetadataHelper('/ventas')

export default function CatalogoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>
      {children}
    </>
  )
}