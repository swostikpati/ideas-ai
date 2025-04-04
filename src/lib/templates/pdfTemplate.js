export function generatePdfHtml(summary) {
  return `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 2rem;
            line-height: 1.6;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 16px;
          }
          pre {
            background-color: #f5f5f5;
            padding: 1rem;
            border-radius: 5px;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
        </style>
      </head>
      <body>
        <h1>Your Nighttime Idea Summary</h1>
        <pre>${summary}</pre>
      </body>
    </html>
  `;
}
