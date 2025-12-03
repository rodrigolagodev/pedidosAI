'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Archive } from 'lucide-react';
import { toast } from 'sonner';
import { archiveOrder } from '@/features/orders/actions/order-actions';
import { useRouter } from 'next/navigation';

interface ArchiveButtonProps {
  orderId: string;
  variant?: 'ghost' | 'outline' | 'default' | 'secondary' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function ArchiveButton({
  orderId,
  variant = 'ghost',
  size = 'sm',
  className,
}: ArchiveButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click handlers (like row expansion)
    setIsLoading(true);

    try {
      const result = await archiveOrder(orderId);

      if (result.success) {
        toast.success('Pedido archivado correctamente');
        router.refresh();
      } else {
        toast.error(result.error || 'Error al archivar el pedido');
      }
    } catch (error) {
      console.error('Error archiving order:', error);
      toast.error('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleArchive}
      disabled={isLoading}
      title="Archivar pedido"
    >
      <Archive className="h-4 w-4" />
      <span className="sr-only">Archivar pedido</span>
    </Button>
  );
}
