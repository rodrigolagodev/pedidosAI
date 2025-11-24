import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FadeIn } from './motion';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <FadeIn
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/5',
        className
      )}
    >
      {Icon && (
        <div className="bg-muted p-3 rounded-full mb-4">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-xs mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </FadeIn>
  );
}
