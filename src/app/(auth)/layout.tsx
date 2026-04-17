export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center bg-muted/40 p-6">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
