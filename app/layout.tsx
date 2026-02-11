import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Isaac's CGPA Tracker",
  description: 'Geophysics • Federal University of Technology, Minna • Nigerian Grading System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
