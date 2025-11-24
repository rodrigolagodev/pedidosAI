'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { Database } from '@/types/database';
import { cn } from '@/lib/utils';

type OrderItem = Database['public']['Tables']['order_items']['Row'];

interface UnclassifiedBadgeProps {
  item: OrderItem;
  onDelete: (itemId: string) => void;
}

export function UnclassifiedBadge({ item, onDelete }: UnclassifiedBadgeProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'relative group inline-flex touch-none',
        isDragging && 'opacity-50 cursor-grabbing',
        !isDragging && 'cursor-grab'
      )}
    >
      <Badge
        variant="secondary"
        className="pl-3 pr-8 py-2 text-sm font-medium border border-border hover:border-primary/50 transition-colors"
      >
        {item.quantity} {item.unit} {item.product}
      </Badge>

      <Button
        size="icon"
        variant="ghost"
        className="absolute right-0 top-0 h-full w-8 rounded-l-none hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100 transition-all"
        onClick={e => {
          e.stopPropagation();
          onDelete(item.id);
        }}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
