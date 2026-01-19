import './global.css';
import { ReduxProvider } from './providers/redux-provider';
export const metadata = {
  title: 'Welcome to inbox-0',
  description: 'AI-Powered WhatsApp Bridge',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* 2. Wrap the children in the ReduxProvider */}
        <ReduxProvider>
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
