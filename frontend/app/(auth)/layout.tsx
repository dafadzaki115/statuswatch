import Link from 'next/link';
import { Activity } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-muted text-foreground flex items-center justify-center border border-border">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Status<span className="text-muted-foreground">Watch</span>
          </span>
        </Link>
        <p className="text-xs text-muted-foreground">
          Platform pemantauan uptime dan SSL berbasis cloud
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-background py-6 px-5 border border-border rounded-lg sm:px-8 shadow-xs">
          {children}
        </div>
      </div>
    </div>
  );
}
