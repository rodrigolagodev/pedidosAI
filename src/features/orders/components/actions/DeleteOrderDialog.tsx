'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteOrder } from '@/features/orders/actions/order-actions';

import { useRouter } from 'next/navigation';

interface DeleteOrderDialogProps {
  orderId: string;
  trigger?: React.ReactNode;
  className?: string;
}

export function DeleteOrderDialog({ orderId, trigger, className }: DeleteOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDeleting(true);

    try {
      const result = await deleteOrder(orderId);

      if (result.success) {
        toast.success('Pedido eliminado permanentemente');
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Error al eliminar el pedido');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Ocurrió un error inesperado');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={e => e.stopPropagation()}>
        {trigger || (
          <Button
            variant="ghost"
            size="icon"
            className={`text-red-500 hover:text-red-600 hover:bg-red-50 ${className}`}
            title="Eliminar permanentemente"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Eliminar pedido</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent onClick={e => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>¿Estás absolutamente seguro?</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente el pedido, sus ítems,
            mensajes de chat y archivos de audio asociados de nuestros servidores.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={e => {
              e.stopPropagation();
              setOpen(false);
            }}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar permanentemente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
