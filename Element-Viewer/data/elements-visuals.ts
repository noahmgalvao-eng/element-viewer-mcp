
import { ElementProperties, SpecialBehavior } from "../types";

// Define the shape of our proprietary overrides (Partial of the full ChemicalElement)
// REMOVED: visualDNA (Now sourced from Scientific Layer)
export interface ElementCustomData {
  name?: string; // Portuguese Override
  classification?: {
    groupName?: string; // Portuguese Override
  };
  properties?: Partial<ElementProperties>;
  specialBehavior?: SpecialBehavior;
  category?: string;
}

// CRITICAL: The Sodium Rule Fallback
// This object contains the exact physics configuration of Sodium (Na).
// Used as the default for any element missing specific custom data.
export const SODIUM_FALLBACK: ElementCustomData = {
  name: "Elemento Genérico",
  classification: {
    groupName: "Elemento Químico",
  },
  category: 'metal',
  properties: {
    // Standard Na Data
    meltingPointK: 370.87,
    boilingPointK: 1156,
    bulkModulusGPa: 6.3,
    latentHeatFusion: 113000,
    latentHeatVaporization: 3896000,
    specificHeatSolid: 1230,
    specificHeatLiquid: 1380,
    specificHeatGas: 900,
    criticalPoint: { tempK: 2573, pressurePa: 35000000 },
    triplePoint: { tempK: 370.87, pressurePa: 0.00000014 },
    electronegativity: 0.93,
    atomicRadiusPm: 186,
    density: 0.97,
    thermalConductivity: 142,
    electronAffinity: 52.8,
    ionizationEnergy: 495.8,
    oxidationStates: [1],
    // Physics Engine Params
    simonA_Pa: 850000000,
    simonC: 2.5,
    enthalpyFusionJmol: 2600,
  },
  specialBehavior: { highPressureTurnover: true }
};

// Proprietary Data for specific elements
export const CUSTOM_DATA: Record<string, ElementCustomData> = {
  "Au": {
    name: "Ouro",
    classification: { groupName: "Metais de Transição" },
    category: 'metal',
    properties: {
      bulkModulusGPa: 180,
      latentHeatFusion: 63700,
      latentHeatVaporization: 1644000,
      specificHeatSolid: 129,
      specificHeatLiquid: 150,
      specificHeatGas: 63,
      criticalPoint: { tempK: 7250, pressurePa: 550000000 },
      triplePoint: { tempK: 1337.33, pressurePa: 0.023 },
      atomicRadiusPm: 144,
      thermalConductivity: 318,
      oxidationStates: [3, 1],
      simonA_Pa: 5900000000,
      simonC: 2.0,
      enthalpyFusionJmol: 12550
    }
  },
  "Na": {
    ...SODIUM_FALLBACK,
    name: "Sódio",
    classification: { groupName: "Metais Alcalinos" }
  },
  "H": {
    name: "Hidrogênio",
    classification: { groupName: "Não-Metais" },
    category: 'non-metal',
    properties: {
      enthalpyVapJmol: 904,
      bulkModulusGPa: 0.2,
      latentHeatFusion: 58000,
      latentHeatVaporization: 455000,
      specificHeatSolid: 10000,
      specificHeatLiquid: 13000,
      specificHeatGas: 14304,
      criticalPoint: { tempK: 33, pressurePa: 1293000 },
      triplePoint: { tempK: 13.80, pressurePa: 7042 },
      atomicRadiusPm: 53,
      thermalConductivity: 0.18,
      oxidationStates: [1, -1],
      simonA_Pa: 20000000,
      simonC: 1.5,
      enthalpyFusionJmol: 117
    }
  },
  "Li": {
    name: "Lítio",
    classification: { groupName: "Metais Alcalinos" },
    category: 'metal',
    properties: {
      bulkModulusGPa: 11,
      latentHeatFusion: 432000,
      latentHeatVaporization: 21200000,
      specificHeatSolid: 3582,
      specificHeatLiquid: 4380,
      specificHeatGas: 3000,
      criticalPoint: { tempK: 3223, pressurePa: 67000000 },
      triplePoint: { tempK: 453.65, pressurePa: 0.00000003 },
      atomicRadiusPm: 152,
      thermalConductivity: 85,
      oxidationStates: [1],
      simonA_Pa: 1000000000,
      simonC: 2.5,
      enthalpyFusionJmol: 3000
    }
  },
  "K": {
    name: "Potássio",
    classification: { groupName: "Metais Alcalinos" },
    category: 'metal',
    properties: {
      bulkModulusGPa: 3.1,
      latentHeatFusion: 59590,
      latentHeatVaporization: 2000000,
      specificHeatSolid: 757,
      specificHeatLiquid: 800,
      specificHeatGas: 520,
      criticalPoint: { tempK: 2280, pressurePa: 16000000 },
      triplePoint: { tempK: 336.7, pressurePa: 0.00013 },
      atomicRadiusPm: 227,
      thermalConductivity: 102,
      oxidationStates: [1],
      simonA_Pa: 400000000,
      simonC: 2.5,
      enthalpyFusionJmol: 2330
    }
  },
  "Mg": {
    name: "Magnésio",
    classification: { groupName: "Metais Alcalinos Terrosos" },
    category: 'metal',
    properties: {
      bulkModulusGPa: 45,
      latentHeatFusion: 348000,
      latentHeatVaporization: 5250000,
      specificHeatSolid: 1023,
      specificHeatLiquid: 1100,
      specificHeatGas: 900,
      criticalPoint: { tempK: 3115, pressurePa: 40000000 },
      triplePoint: { tempK: 923, pressurePa: 361 },
      atomicRadiusPm: 160,
      thermalConductivity: 156,
      oxidationStates: [2],
      simonA_Pa: 3000000000,
      simonC: 2.0,
      enthalpyFusionJmol: 8480
    }
  }
};
