import { cn } from '@/lib/utils';

export function Badge({ className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        'bg-secondary text-secondary-foreground',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
