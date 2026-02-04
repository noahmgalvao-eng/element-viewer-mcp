
import { ChemicalElement } from "../types";

// The 11 Frames extracted from the provided SVG liquid path
export const MATTER_PATH_FRAMES = [
  "M -60,-120 C -20,-120 20,-120 60,-120 C 60,-80 60,-40 60,0 C 20,0 -20,0 -60,0 C -60,-40 -60,-80 -60,-120 Z",
  "M -55,-100 C -20,-105 20,-105 55,-100 C 75,-60 75,-30 70,0 C 20,5 -20,5 -70,0 C -75,-30 -75,-60 -55,-100 Z",
  "M -80,-60 C -40,-70 40,-60 80,-55 C 100,-30 110,-10 100,0 C 40,5 -40,5 -100,0 C -110,-10 -100,-30 -80,-60 Z",
  "M -100,-35 C -50,-45 50,-40 100,-30 C 115,-15 110,5 90,5 C 40,8 -40,8 -90,5 C -110,5 -115,-15 -100,-35 Z",
  "M -130,-15 C -80,-25 -30,-30 20,-20 C 70,-10 120,-25 140,-10 C 150,5 130,15 0,15 C -130,15 -150,5 -130,-15 Z",
  "M -130,-15 C -90,-35 -40,-10 10,-25 C 60,-40 110,-15 140,-10 C 150,5 130,15 0,15 C -130,15 -150,5 -130,-15 Z",
  "M -91,-10 C -63,-24 -28,-7 7,-17 C 42,-28 77,-10 98,-7 C 105,3 91,10 0,10 C -91,10 -105,3 -91,-10 Z",
  "M -52,-6 C -36,-14 -16,-4 4,-10 C 24,-16 44,-6 56,-4 C 60,2 52,6 0,6 C -52,6 -60,2 -52,-6 Z",
  "M -19,-2 C -13,-5 -6,-1 1,-3 C 9,-6 16,-2 21,-1 C 22,0 19,2 0,2 C -19,2 -22,0 -19,-2 Z",
  "M 0,0 C 0,0 0,0 0,0 C 0,0 0,0 0,0 C 0,0 0,0 0,0 C 0,0 0,0 0,0 C 0,0 0,0 0,0 C 0,0 0,0 0,0 C 0,0 0,0 0,0 Z",
  "M 0,0 C 0,0 0,0 0,0 C 0,0 0,0 0,0 C 0,0 0,0 0,0 C 0,0 0,0 0,0 C 0,0 0,0 0,0 C 0,0 0,0 0,0 C 0,0 0,0 0,0 Z"
];

export const ELEMENTS: ChemicalElement[] = [
  {
    atomicNumber: 79,
    symbol: "Au",
    name: "Ouro",
    classification: { group: "11", groupBlock: "IB", groupName: "Metais de Transição", period: 6, electronShells: 6 },
    mass: 196.97,
    properties: { 
      meltingPointK: 1337.33, boilingPointK: 3129, bulkModulusGPa: 180,
      latentHeatFusion: 63700, latentHeatVaporization: 1644000,
      specificHeatSolid: 129, specificHeatLiquid: 150, specificHeatGas: 63,
      criticalPoint: { tempK: 7250, pressurePa: 550000000 },
      triplePoint: { tempK: 1337.33, pressurePa: 0.023 },
      electronegativity: 2.54, atomicRadiusPm: 144, density: 19.30,
      electronConfiguration: "[Xe] 4f¹⁴ 5d¹⁰ 6s¹", thermalConductivity: 318,
      electricalConductivity: 4.5e7, // 45 MS/m
      electronAffinity: 222.8, ionizationEnergy: 890.1, oxidationStates: [3, 1],
      simonA_Pa: 5900000000, simonC: 2.0, // a = 5.9 GPa
      enthalpyFusionJmol: 12550
    },
    visualDNA: { solid: { color: "#FFD700", opacidade: 1.0 }, liquid: { color: "#FFD700", opacidade: 1.0 }, gas: { color: "#FFD700", opacidade: 1.0 } },
    category: 'metal'
  },
  {
    atomicNumber: 11,
    symbol: "Na",
    name: "Sódio",
    classification: { group: "1", groupBlock: "IA", groupName: "Metais Alcalinos", period: 3, electronShells: 3 },
    mass: 22.99,
    properties: { 
      meltingPointK: 370.87, boilingPointK: 1156, bulkModulusGPa: 6.3,
      latentHeatFusion: 113000, latentHeatVaporization: 3896000,
      specificHeatSolid: 1230, specificHeatLiquid: 1380, specificHeatGas: 900,
      criticalPoint: { tempK: 2573, pressurePa: 35000000 },
      triplePoint: { tempK: 370.87, pressurePa: 0.00000014 },
      electronegativity: 0.93, atomicRadiusPm: 186, density: 0.97,
      electronConfiguration: "[Ne] 3s¹", thermalConductivity: 142,
      electricalConductivity: 2.1e7, // 21 MS/m
      electronAffinity: 52.8, ionizationEnergy: 495.8, oxidationStates: [1],
      simonA_Pa: 850000000, simonC: 2.5, // a = 0.85 GPa
      enthalpyFusionJmol: 2600
    },
    visualDNA: { solid: { color: "#E5E7EB", opacidade: 1.0 }, liquid: { color: "#E5E7EB", opacidade: 1.0 }, gas: { color: "#E5E7EB", opacidade: 1.0 } },
    specialBehavior: { highPressureTurnover: true }, category: 'metal'
  },
  {
    atomicNumber: 1,
    symbol: "H",
    name: "Hidrogênio",
    classification: { group: "1", groupBlock: "IA", groupName: "Não-Metais (Diatômico)", period: 1, electronShells: 1 },
    mass: 1.008,
    properties: {
      meltingPointK: 14.01, boilingPointK: 20.28, enthalpyVapJmol: 904, bulkModulusGPa: 0.2,
      latentHeatFusion: 58000, latentHeatVaporization: 455000,
      specificHeatSolid: 10000, specificHeatLiquid: 13000, specificHeatGas: 14304,
      criticalPoint: { tempK: 33, pressurePa: 1293000 },
      triplePoint: { tempK: 13.80, pressurePa: 7042 },
      electronegativity: 2.20, atomicRadiusPm: 53, density: 0.000089,
      electronConfiguration: "1s¹", thermalConductivity: 0.18,
      electricalConductivity: 0, // Insulator
      electronAffinity: 72.8, ionizationEnergy: 1312.0, oxidationStates: [1, -1],
      simonA_Pa: 20000000, simonC: 1.5, // a = 20 MPa (Very sensitive)
      enthalpyFusionJmol: 117
    },
    visualDNA: { solid: { color: "#FFFFFF", opacidade: 1.0 }, liquid: { color: "#FFFFFF", opacidade: 1.0 }, gas: { color: "#FFFFFF", opacidade: 1.0 } },
    molecularForms: [{ symbol: "H₂", maxTempK: 3000 }], category: 'non-metal'
  },
  {
    atomicNumber: 3,
    symbol: "Li",
    name: "Lítio",
    classification: { group: "1", groupBlock: "IA", groupName: "Metais Alcalinos", period: 2, electronShells: 2 },
    mass: 6.94,
    properties: {
      meltingPointK: 453.65, boilingPointK: 1603, bulkModulusGPa: 11,
      latentHeatFusion: 432000, latentHeatVaporization: 21200000,
      specificHeatSolid: 3582, specificHeatLiquid: 4380, specificHeatGas: 3000,
      criticalPoint: { tempK: 3223, pressurePa: 67000000 },
      triplePoint: { tempK: 453.65, pressurePa: 0.00000003 },
      electronegativity: 0.98, atomicRadiusPm: 152, density: 0.534,
      electronConfiguration: "[He] 2s¹", thermalConductivity: 85,
      electricalConductivity: 1.1e7, // 11 MS/m
      electronAffinity: 59.6, ionizationEnergy: 520.2, oxidationStates: [1],
      simonA_Pa: 1000000000, simonC: 2.5, // a = 1.0 GPa
      enthalpyFusionJmol: 3000
    },
    visualDNA: { solid: { color: "#C7C7C7", opacidade: 1.0 }, liquid: { color: "#C7C7C7", opacidade: 1.0 }, gas: { color: "#C7C7C7", opacidade: 1.0 } },
    category: 'metal'
  },
  {
    atomicNumber: 19,
    symbol: "K",
    name: "Potássio",
    classification: { group: "1", groupBlock: "IA", groupName: "Metais Alcalinos", period: 4, electronShells: 4 },
    mass: 39.098,
    properties: {
      meltingPointK: 336.7, boilingPointK: 1032, bulkModulusGPa: 3.1,
      latentHeatFusion: 59590, latentHeatVaporization: 2000000, 
      specificHeatSolid: 757, specificHeatLiquid: 800, specificHeatGas: 520,
      criticalPoint: { tempK: 2280, pressurePa: 16000000 },
      triplePoint: { tempK: 336.7, pressurePa: 0.00013 },
      electronegativity: 0.82, atomicRadiusPm: 227, density: 0.862,
      electronConfiguration: "[Ar] 4s¹", thermalConductivity: 102,
      electricalConductivity: 1.4e7, // 14 MS/m
      electronAffinity: 48.4, ionizationEnergy: 418.8, oxidationStates: [1],
      simonA_Pa: 400000000, simonC: 2.5, // a = 0.4 GPa
      enthalpyFusionJmol: 2330
    },
    visualDNA: { solid: { color: "#E0E0E0", opacidade: 1.0 }, liquid: { color: "#E0E0E0", opacidade: 1.0 }, gas: { color: "#E0E0E0", opacidade: 1.0 } },
    category: 'metal'
  },
  {
    atomicNumber: 12,
    symbol: "Mg",
    name: "Magnésio",
    classification: { group: "2", groupBlock: "IIA", groupName: "Metais Alcalinos Terrosos", period: 3, electronShells: 3 },
    mass: 24.305,
    properties: {
      meltingPointK: 923, boilingPointK: 1363, bulkModulusGPa: 45,
      latentHeatFusion: 348000, latentHeatVaporization: 5250000,
      specificHeatSolid: 1023, specificHeatLiquid: 1100, specificHeatGas: 900,
      criticalPoint: { tempK: 3115, pressurePa: 40000000 },
      triplePoint: { tempK: 923, pressurePa: 361 },
      electronegativity: 1.31, atomicRadiusPm: 160, density: 1.74,
      electronConfiguration: "[Ne] 3s²", thermalConductivity: 156,
      electricalConductivity: 2.3e7, // 23 MS/m
      electronAffinity: 0, ionizationEnergy: 737.7, oxidationStates: [2],
      simonA_Pa: 3000000000, simonC: 2.0, // a = 3.0 GPa
      enthalpyFusionJmol: 8480
    },
    visualDNA: { solid: { color: "#9ca3af", opacidade: 1.0 }, liquid: { color: "#9ca3af", opacidade: 1.0 }, gas: { color: "#9ca3af", opacidade: 1.0 } },
    category: 'metal'
  }
];
