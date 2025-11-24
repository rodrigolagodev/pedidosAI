import { Button } from '@/components/ui/button';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';

interface ReviewDialogsProps {
  showBackConfirm: boolean;
  setShowBackConfirm: (show: boolean) => void;
  showCancelConfirm: boolean;
  setShowCancelConfirm: (show: boolean) => void;
  isCancelling: boolean;
  onBack: () => void;
  onCancelOrder: () => void;
}

export function ReviewDialogs({
  showBackConfirm,
  setShowBackConfirm,
  showCancelConfirm,
  setShowCancelConfirm,
  isCancelling,
  onBack,
  onCancelOrder,
}: ReviewDialogsProps) {
  return (
    <>
      <ResponsiveDialog open={showBackConfirm} onOpenChange={setShowBackConfirm}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>¿Estás seguro de volver?</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Si vuelves al chat, perderás el progreso de edición actual si no has finalizado.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <Button variant="outline" onClick={() => setShowBackConfirm(false)}>
              Cancelar
            </Button>
            <Button onClick={onBack}>Volver al chat</Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ResponsiveDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>¿Cancelar pedido?</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Esta acción cancelará el pedido permanentemente. No podrás recuperarlo.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>
              Volver
            </Button>
            <Button variant="destructive" onClick={onCancelOrder} disabled={isCancelling}>
              {isCancelling ? 'Cancelando...' : 'Sí, cancelar pedido'}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
