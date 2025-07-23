// Load reflect-metadata at the very top of the file, before any other imports
import 'reflect-metadata';

import type { AppProps } from 'next/app';
// Import our client initialization
import '@/lib/client-init';

export default function App({ Component, pageProps }: AppProps) {
  // This ensures reflect-metadata is loaded before any component rendering
  return <Component {...pageProps} />;
}
