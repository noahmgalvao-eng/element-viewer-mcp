import { ChemicalElement, MatterState, PhysicsState } from '../types';

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
