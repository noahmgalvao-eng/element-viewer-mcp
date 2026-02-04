import React, { useMemo, useEffect, useRef } from 'react';
import { ChemicalElement, ViewBoxDimensions, PhysicsState } from '../../types';
import { usePhysics } from '../../hooks/usePhysics';
import MatterVisualizer from './MatterVisualizer';

interface Props {
  element: ChemicalElement;
  globalTemp: number;
  globalPressure: number;
  layoutScale: {
      quality: number; // 0.1 to 1.0 (Physics)
      visual: number;  // 0.1 to 1.0 (Visual Scale - currently handled by CSS container)
  };
  timeScale: number;
  showParticles: boolean;
  totalElements: number;
  isPaused?: boolean;
  onInspect?: (e: React.MouseEvent, physics: PhysicsState) => void;
  onRegister?: (id: number, getter: () => PhysicsState) => void;
}

const SimulationUnit: React.FC<Props> = ({ element, globalTemp, globalPressure, layoutScale, showParticles, totalElements, timeScale, isPaused = false, onInspect, onRegister }) => {
  
  // --- ViewBox Calculation ---
  // Calculates the visible area of the SVG coordinate system.
  // Base X: Centered at 200. Max width ~300. Padded X range: 20 to 380 (Width 360).
  // Base Y: Solid base is at Y=300.
  
  const viewBox: ViewBoxDimensions = useMemo(() => {
      const minX = 20;
      const width = 360;
      const maxX = minX + width;

      // STEP 2A: Expand "Camera" Ceiling
      // Adjusted to 0 to allow the new large HUD bubble (r=30, cy=30) to touch the top edge seamlessly.
      const minY = 0;
      
      // STEP 3: Floor-Hugging Margin logic
      const SOLID_BASE_Y = 300;
      
      // If in Grid Mode (>2 elements), use tight 1% margin (approx 3px).
      // If in Presentation Mode (<=2), use comfortable 20px padding.
      const bottomMargin = totalElements > 2 ? 3 : 20;
      
      const maxY = SOLID_BASE_Y + bottomMargin;
      const height = maxY - minY;

      return { minX, minY, width, height, maxX, maxY };
  }, [totalElements]);

  // Each unit runs its own isolated physics engine
  const physics = usePhysics({
    element,
    temperature: globalTemp,
    pressure: globalPressure,
    qualityScale: layoutScale.quality,
    viewBounds: viewBox,
    timeScale: timeScale,
    isPaused: isPaused
  });

  // --- Snapshot Registration ---
  // Store latest physics in a ref so the getter always returns fresh state without needing re-registration
  const physicsRef = useRef(physics);
  physicsRef.current = physics;

  useEffect(() => {
    if (onRegister) {
        onRegister(element.atomicNumber, () => physicsRef.current);
    }
  }, [element.atomicNumber, onRegister]);

  return (
    <div className="w-full h-full relative overflow-hidden">
        <MatterVisualizer 
            element={element}
            physics={physics}
            showParticles={showParticles}
            viewBounds={viewBox}
            totalElements={totalElements}
            onInspect={onInspect}
        />
    </div>
  );
};

export default SimulationUnit;