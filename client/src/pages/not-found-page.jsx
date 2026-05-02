import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <p className="text-7xl font-bold text-primary">404</p>
        <h1 className="text-2xl font-semibold mt-4">Page not found</h1>
        <p className="text-muted-foreground mt-2">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button className="mt-6">Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
