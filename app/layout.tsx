export const metadata = {
  title: "Banking AI Agent",
  description: "AI-powered credit card assistant",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
