import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GPACE Stage",
  description: "Academic Discussion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
         <style dangerouslySetInnerHTML={{ __html: `
           body { 
             background-color: #fdfbf7 !important; 
             color: #000 !important; 
             margin: 0 !important; 
             padding: 0 !important; 
             display: flex !important; 
             flex-direction: column !important;
             min-height: 100vh !important;
             font-family: sans-serif !important;
           }
           #diagnostic-header {
             background: black;
             color: white;
             padding: 10px;
             font-size: 12px;
             font-weight: bold;
             text-align: center;
             z-index: 9999;
           }
         `}} />
      </head>
      <body>
        <div id="diagnostic-header">GPACE STAGE - SYSTEM READY</div>
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
