import { Button } from '@/components/ui/button';
import { TapButton } from '@/components/ui/motion-button';
import { ArrowLeft, X, CheckCircle2 } from 'lucide-react';

interface ReviewHeaderProps {
  isFinalizing: boolean;
  isCancelling: boolean;
  unclassifiedItemsCount: number;
  onBack: () => void;
  onCancel: () => void;
  onSave: () => void;
  onFinalize: () => void;
}

export function ReviewHeader({
  isFinalizing,
  isCancelling,
  unclassifiedItemsCount,
  onBack,
  onCancel,
  onSave,
  onFinalize,
}: ReviewHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>

      <div className="hidden md:flex items-center gap-2">
        <TapButton
          variant="outline"
          className="text-destructive hover:bg-destructive/10 border-destructive/50"
          onClick={onCancel}
          disabled={isFinalizing || isCancelling}
        >
          <X className="mr-2 h-4 w-4" />
          Cancelar Pedido
        </TapButton>
        <TapButton variant="outline" onClick={onSave} disabled={isFinalizing || isCancelling}>
          Guardar Cambios
        </TapButton>
        <TapButton
          onClick={onFinalize}
          disabled={isFinalizing || isCancelling || unclassifiedItemsCount > 0}
        >
          {isFinalizing ? 'Enviando...' : 'Enviar Pedido'}
          <CheckCircle2 className="ml-2 h-4 w-4" />
        </TapButton>
      </div>
    </div>
  );
}
