import { createContext, useContext, useState, ReactNode } from 'react';
import type { CalculatorField } from '@shared/schema';

interface DragDropContextType {
  draggedItem: CalculatorField | null;
  setDraggedItem: (item: CalculatorField | null) => void;
  isDragging: boolean;
}

const DragDropCtx = createContext<DragDropContextType | undefined>(undefined);

export function DragDropProvider({ children }: { children: ReactNode }) {
  const [draggedItem, setDraggedItem] = useState<CalculatorField | null>(null);

  return (
    <DragDropCtx.Provider
      value={{
        draggedItem,
        setDraggedItem,
        isDragging: !!draggedItem,
      }}
    >
      {children}
    </DragDropCtx.Provider>
  );
}

export function useDragDrop() {
  const context = useContext(DragDropCtx);
  if (context === undefined) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
}
