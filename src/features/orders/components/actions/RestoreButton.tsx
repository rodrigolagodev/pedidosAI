'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { restoreOrder } from '@/features/orders/actions/order-actions';

import { useRouter } from 'next/navigation';

interface RestoreButtonProps {
  orderId: string;
  variant?: 'ghost' | 'outline' | 'default' | 'secondary' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function RestoreButton({
  orderId,
  variant = 'outline',
  size = 'sm',
  className,
}: RestoreButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRestore = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);

    try {
      const result = await restoreOrder(orderId);

      if (result.success) {
        toast.success('Pedido restaurado a revisión');
        router.refresh();
      } else {
        toast.error(result.error || 'Error al restaurar el pedido');
      }
    } catch (error) {
      console.error('Error restoring order:', error);
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
      onClick={handleRestore}
      disabled={isLoading}
      title="Restaurar a estado de revisión"
    >
      <RotateCcw className="h-4 w-4 mr-2" />
      Restaurar
    </Button>
  );
}
