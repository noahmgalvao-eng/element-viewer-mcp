
import { ChemicalElement, MatterState, MatterRect, Bounds, ViewBoxDimensions } from '../../types';

interface GeometryInput {
    element: ChemicalElement;
    pressure: number;
    currentTemp: number;
    meltProgress: number;
    phase: MatterState;
    viewBounds: ViewBoxDimensions;
    scfTransitionProgress: number;
    sublimationProgress: number;
}

interface GeometryOutput {
    matterRect: MatterRect;
    gasBounds: Bounds;
    compressionFactor: number;
    scfOpacity: number;
}

// Lattice Config (Constant Reuse)
const ROWS = 5;
const PARTICLE_RADIUS = 6;
const MIN_PACKED_HEIGHT = ROWS * PARTICLE_RADIUS * 2;
const INIT_W = 134;
const INIT_H = 134;

export const calculateGeometry = ({
    element,
    pressure,
    currentTemp,
    meltProgress,
    phase,
    viewBounds,
    scfTransitionProgress,
    sublimationProgress
}: GeometryInput): GeometryOutput => {

    const { bulkModulusGPa } = element.properties;

    // --- COMPRESSION ---
    const hasOfficialBulkModulus = typeof bulkModulusGPa === "number" && isFinite(bulkModulusGPa) && bulkModulusGPa > 0;
    const bulkModulusPa = hasOfficialBulkModulus ? (bulkModulusGPa * 1e9) : undefined;
    const compressionRatio = hasOfficialBulkModulus && bulkModulusPa
        ? pressure / (pressure + bulkModulusPa)
        : 0;
    const theoreticalCompressionFactor = hasOfficialBulkModulus
        ? (1 - (compressionRatio * 0.6))
        : 1;

    let targetW = INIT_W;
    let targetH = INIT_H;
    let squeezeProgress = 0;

    // --- GEOMETRY SHAPE LOGIC ---
    if (phase === MatterState.SUBLIMATION || phase === MatterState.EQUILIBRIUM_SUB) {
        // SUBLIMATION: No Puddle Spreading. Fixed Width. Height shrinks.
        targetW = INIT_W;
        // As sublimationProgress goes 0 -> 1, Height goes 100% -> 0%
        targetH = INIT_H * (1 - sublimationProgress);
    } else {
        // STANDARD MELTING/SOLID BEHAVIOR
        squeezeProgress = Math.pow(Math.max(0, Math.min(1, meltProgress)), 0.4); 
        targetW = 134 + (166 * meltProgress); 
        const uncompressedH = 134 - (64 * squeezeProgress); 
        targetH = uncompressedH;
    }

    // Apply Compression
    if (targetH > 0) {
        targetH = targetH * theoreticalCompressionFactor;
        if (targetH < MIN_PACKED_HEIGHT && (phase !== MatterState.SUBLIMATION && phase !== MatterState.EQUILIBRIUM_SUB)) {
            // Only clamp minimum height if NOT sublimating (sublimation can disappear completely)
            targetH = MIN_PACKED_HEIGHT; 
        }
    }
    
    // Safety check for Sublimation nearing completion
    if (targetH < 0) targetH = 0;

    const effectiveCompressionFactor = (phase === MatterState.SUBLIMATION || phase === MatterState.EQUILIBRIUM_SUB) 
        ? theoreticalCompressionFactor // Just simple compression
        : targetH / (134 - (64 * squeezeProgress)); // Relative to uncompressed melt state

    const matterRect: MatterRect = {
        w: targetW, h: targetH, x: 200 - (targetW / 2), y: 300 - targetH 
    };

    // --- GAS BOUNDS ---
    let gasBounds: Bounds = {
        minX: matterRect.x, maxX: matterRect.x + matterRect.w, minY: matterRect.y, maxY: matterRect.y + matterRect.h
    };

    // Bounds need to be active for Gas, Boiling, SCF, Triple Point AND Sublimation
    const hasGasPhase = phase === MatterState.GAS || 
                        phase === MatterState.BOILING || 
                        phase === MatterState.EQUILIBRIUM_BOIL ||
                        phase === MatterState.EQUILIBRIUM_TRIPLE ||
                        phase === MatterState.SUPERCRITICAL || 
                        phase === MatterState.TRANSITION_SCF ||
                        phase === MatterState.SUBLIMATION ||
                        phase === MatterState.EQUILIBRIUM_SUB;

    if (hasGasPhase) {
         // --- NOVO CÓDIGO DA CAIXA DE GÁS ---
         // 1. Normalização Termodinâmica
         const tNorm = Math.max(1, currentTemp) / 300; // 300K = 1
         const pAtm = Math.max(1e-5, pressure) / 101325; // 1 atm = 1

         // 2. Proporção Volumétrica Ideal (T / P^0.4)
         // O expoente 0.4 amacia a imensa escala de 100 GPa para que a UI continue responsiva
         const vProp = tNorm / Math.pow(pAtm, 0.4);

         // 3. Mapeamento Assintótico (0 a 1)
         // C é a constante de "half-max". Se vProp == 1.5, a expansão é 0.5 (50%).
         const C = 1.5;
         const expansionFactor = vProp / (vProp + C);

         // 4. Geometria Base e Distâncias 
         const baseGasW = 134; 
         const baseGasH = 134;
         const baseGasRect = { x: 200 - (baseGasW / 2), y: 300 - baseGasH, w: baseGasW, h: baseGasH };
         const leftDist = baseGasRect.x - viewBounds.minX;
         const rightDist = viewBounds.maxX - (baseGasRect.x + baseGasRect.w);
         const topDist = baseGasRect.y - viewBounds.minY;
         const bottomDist = viewBounds.maxY - (baseGasRect.y + baseGasRect.h);

         gasBounds.minX = baseGasRect.x - (leftDist * expansionFactor);
         gasBounds.maxX = (baseGasRect.x + baseGasRect.w) + (rightDist * expansionFactor);
         gasBounds.minY = baseGasRect.y - (topDist * expansionFactor);
         gasBounds.maxY = (baseGasRect.y + baseGasRect.h) + (bottomDist * expansionFactor);

         // Keep gas domain inside the camera bounds
         gasBounds.minX = Math.max(viewBounds.minX, gasBounds.minX);
         gasBounds.maxX = Math.min(viewBounds.maxX, gasBounds.maxX);
         gasBounds.minY = Math.max(viewBounds.minY, gasBounds.minY);
         gasBounds.maxY = Math.min(viewBounds.maxY, gasBounds.maxY);
         // --- FIM DO NOVO CÓDIGO ---
    }

    // --- SCF OPACITY ---
    let scfOpacity = 0;
    if (phase === MatterState.SUPERCRITICAL || phase === MatterState.TRANSITION_SCF) {
        const MAX_VOL = (viewBounds.width * viewBounds.height);
        const MIN_VOL = INIT_W * INIT_H;
        const currentVolume = (gasBounds.maxX - gasBounds.minX) * (gasBounds.maxY - gasBounds.minY);
        const densityRatio = (currentVolume - MIN_VOL) / (MAX_VOL - MIN_VOL);
        const calculatedOpacity = 0.8 - (densityRatio * 0.6);
        scfOpacity = Math.max(0.2, Math.min(0.8, calculatedOpacity)) * scfTransitionProgress;
    }

    return {
        matterRect,
        gasBounds,
        compressionFactor: effectiveCompressionFactor,
        scfOpacity
    };
};
