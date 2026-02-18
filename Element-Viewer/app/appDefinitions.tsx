import { ChemicalElement, MatterState, PhysicsState } from '../types';

export const IconIdeaBulb = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="10.5" r="5.5" fill="currentColor" opacity="0.18" stroke="none" />
    <path d="M12 3.5a5 5 0 0 0-3.2 8.84c.62.53 1.2 1.47 1.2 2.45V16h4v-1.2c0-.98.58-1.92 1.2-2.45A5 5 0 0 0 12 3.5z" />
    <path d="M10.5 18.2h3" />
    <path d="M10 20.4h4" />
    <path d="M12 2v1" />
  </svg>
);

export const IconPiP = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 10h6V4" />
    <path d="m2 4 6 6" />
    <path d="M21 10V7a2 2 0 0 0-2-2h-7" />
    <path d="M3 14v2a2 2 0 0 0 2 2h3" />
    <rect x="12" y="14" width="10" height="7" rx="1" />
  </svg>
);

export const IconMaximize = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 3h6v6" />
    <path d="m21 3-7 7" />
    <path d="m3 21 7-7" />
    <path d="M9 21H3v-6" />
  </svg>
);

export const IconMinimize = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m14 10 7-7" />
    <path d="M20 10h-6V4" />
    <path d="m3 21 7-7" />
    <path d="M4 14h6v6" />
  </svg>
);

export interface ContextMenuData {
  x: number;
  y: number;
  element: ChemicalElement;
  physicsState: PhysicsState;
}

export interface IAConfiguracao {
  elementos?: string[] | null;
  temperatura_K?: number | null;
  pressao_Pa?: number | null;
  interpretacao_do_modelo?: string | null;
}

export interface IAReactionSubstance {
  substanceName: string;
  formula: string;
  suggestedColorHex: string;
  mass: number;
  meltingPointK: number;
  boilingPointK: number;
  specificHeatSolid: number;
  specificHeatLiquid: number;
  specificHeatGas: number;
  latentHeatFusion: number;
  latentHeatVaporization: number;
  enthalpyVapJmol: number;
  enthalpyFusionJmol: number;
  triplePoint: { tempK: number; pressurePa: number };
  criticalPoint: { tempK: number; pressurePa: number };
}

export interface IAStructuredContent {
  configuracao_ia?: IAConfiguracao;
  substancia_reacao?: IAReactionSubstance;
  timestamp_atualizacao?: number;
}

export const roundTo = (value: number, digits = 2): number => Number(value.toFixed(digits));

export const normalizeElementLookup = (value: string): string => value.trim().toLowerCase();

export const clampPositive = (value: number, fallback: number): number => (Number.isFinite(value) && value > 0 ? value : fallback);

export const safeHexColor = (value: string): string => {
  if (typeof value !== 'string') return '#38bdf8';
  const trimmed = value.trim();
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(trimmed) ? trimmed : '#38bdf8';
};

export const formatCompact = (value: number, unit: string) => `${roundTo(value, 2)} ${unit}`;

export const phaseToReadable = (state: MatterState): string => {
  switch (state) {
    case MatterState.SOLID:
      return 'solido';
    case MatterState.MELTING:
      return 'fusao (solido -> liquido)';
    case MatterState.EQUILIBRIUM_MELT:
      return 'equilibrio solido-liquido';
    case MatterState.LIQUID:
      return 'liquido';
    case MatterState.BOILING:
      return 'ebulicao/vaporizacao (liquido -> gas)';
    case MatterState.EQUILIBRIUM_BOIL:
      return 'equilibrio liquido-gas';
    case MatterState.EQUILIBRIUM_TRIPLE:
      return 'ponto triplo (solido + liquido + gas)';
    case MatterState.SUBLIMATION:
      return 'sublimacao (solido -> gas)';
    case MatterState.EQUILIBRIUM_SUB:
      return 'equilibrio solido-gas';
    case MatterState.GAS:
      return 'gas';
    case MatterState.TRANSITION_SCF:
      return 'transicao de fluido supercritico';
    case MatterState.SUPERCRITICAL:
      return 'fluido supercritico';
    default:
      return 'estado desconhecido';
  }
};

export const phaseToPresentPhases = (state: MatterState): string[] => {
  switch (state) {
    case MatterState.EQUILIBRIUM_TRIPLE:
      return ['solido', 'liquido', 'gas'];
    case MatterState.MELTING:
    case MatterState.EQUILIBRIUM_MELT:
      return ['solido', 'liquido'];
    case MatterState.BOILING:
    case MatterState.EQUILIBRIUM_BOIL:
      return ['liquido', 'gas'];
    case MatterState.SUBLIMATION:
    case MatterState.EQUILIBRIUM_SUB:
      return ['solido', 'gas'];
    case MatterState.TRANSITION_SCF:
    case MatterState.SUPERCRITICAL:
      return ['fluido supercritico'];
    case MatterState.LIQUID:
      return ['liquido'];
    case MatterState.GAS:
      return ['gas'];
    case MatterState.SOLID:
    default:
      return ['solido'];
  }
};

export const getSupportedEquilibria = (element: ChemicalElement): string[] => {
  const hasTriplePoint = !!element.properties.triplePoint;
  const canSublimationEq = hasTriplePoint && !!element.properties.enthalpyFusionJmol;

  const equilibria = ['EQUILIBRIUM_MELT (solido + liquido)', 'EQUILIBRIUM_BOIL (liquido + gas)'];

  if (canSublimationEq) equilibria.push('EQUILIBRIUM_SUB (solido + gas)');
  if (hasTriplePoint) equilibria.push('EQUILIBRIUM_TRIPLE (solido + liquido + gas)');

  return equilibria;
};

export const readOpenAiStructuredContent = (): unknown => {
  if (typeof window === 'undefined' || !window.openai) return null;

  const openaiWithStructured = window.openai as typeof window.openai & {
    structuredContent?: unknown;
  };

  if (openaiWithStructured.structuredContent && typeof openaiWithStructured.structuredContent === 'object') {
    return openaiWithStructured.structuredContent;
  }

  if (openaiWithStructured.toolOutput && typeof openaiWithStructured.toolOutput === 'object') {
    const toolOutput = openaiWithStructured.toolOutput as Record<string, unknown>;
    if (toolOutput.structuredContent && typeof toolOutput.structuredContent === 'object') {
      return toolOutput.structuredContent;
    }
    return toolOutput;
  }

  return null;
};
