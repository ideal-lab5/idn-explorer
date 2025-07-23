import Document, { Head, Html, Main, NextScript } from 'next/document';

// Ensure reflect-metadata is loaded in the global scope
if (typeof window !== 'undefined') {
  // This will execute on the client side
  require('reflect-metadata');
}

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="preconnect" href="https://rsms.me/" />
          <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
          {/* Add a script to load reflect-metadata before any other JS */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Ensure reflect-metadata is available globally
                try {
                  if (typeof window !== 'undefined') {
                    // Check if it's already loaded
                    if (!window.Reflect || !window.Reflect.decorate) {
                      console.log('Loading reflect-metadata in document head');
                      // Create a global Reflect object if not exists
                      window.Reflect = window.Reflect || {};
                    }
                  }
                } catch (e) {
                  console.error('Error initializing Reflect:', e);
                }
              `,
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
