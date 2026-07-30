import React from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and configures the root HTML for every web page.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Expo ScrollView Style Reset */}
        <ScrollViewStyleReset />

        {/* Global HTML Root CSS Reset & Background Configuration */}
        <style dangerouslySetInnerHTML={{ __html: `
          html, body, #root, #root > div, [data-contents="true"] {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            min-height: 100vh !important;
            box-sizing: border-box !important;
            background-color: #02050a;
          }
        ` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
