
import { ChemicalElement, ElementProperties } from "../types";
import { SOURCE_DATA } from "./periodic_table_source";
import { SCIENTIFIC_DATA } from "./scientific_data";
import { CUSTOM_DATA, SODIUM_FALLBACK, ElementCustomData } from "./elements-visuals";

// The 11 Frames extracted from the provided SVG liquid path (Preserved from original)
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

// Adapter: Transform Raw JSON (Layer 1) + Scientific (Layer 2) + Custom (Layer 3)
export const ELEMENTS: ChemicalElement[] = SOURCE_DATA.elements.map((source: any) => {

  // 1. Setup Data Layers
  const symbol = source.symbol;

  // Layer 2: Scientific Data (Physics + Color)
  const scientific = (SCIENTIFIC_DATA as any)[symbol];

  // Layer 3: Custom Data (Legacy Props + Simulation Tuning)
  const customData: ElementCustomData = CUSTOM_DATA[symbol] || SODIUM_FALLBACK;

  // Helper for Layer 3 retention & Safety Fallbacks
  const baseLegacyProps = SODIUM_FALLBACK.properties as ElementProperties;
  const specificLegacyProps = customData.properties || {};

  // HELPER: Sanity Check for Physics (Prevents 0/Infinity/NaN bugs)
  // If scientific data is missing or 0, fallback to Sodium defaults (Layer 3 base).
  const ensurePhysical = (val: number | undefined | null, fallback: number): number => {
    return (typeof val === 'number' && val > 0) ? val : fallback;
  };

  // 2. Resolve Base Properties (Layer 1 Corrections)
  let resolvedDensity = source.density;
  if (source.phase === "Gas" && source.density) {
    resolvedDensity = source.density / 1000;
  }
  if (!resolvedDensity) {
    resolvedDensity = baseLegacyProps.density || 1.0;
  }

  // 3. Construct Properties Object adhering to Merge Strategy
  const properties: ElementProperties = {
    // --- BASE IDENTITY (Layer 1) ---
    // If Melt/Boil are missing in source, use Fallback to prevent "Always Gas" behavior at 298K
    meltingPointK: ensurePhysical(source.melt, baseLegacyProps.meltingPointK),
    boilingPointK: ensurePhysical(source.boil, 9999),
    density: resolvedDensity,
    electronegativity: source.electronegativity_pauling || 0,
    electronConfiguration: source.electron_configuration_semantic,
    electronAffinity: source.electron_affinity || 0,
    ionizationEnergy: source.ionization_energies ? source.ionization_energies[0] : 0,

    // --- NEW PHYSICS (Layer 2 - Scientific Data with Safety Fallbacks) ---
    // CRITICAL FIX: Never allow these to be 0 for simulation stability.
    specificHeatSolid: ensurePhysical(scientific?.specificHeat, baseLegacyProps.specificHeatSolid),
    specificHeatLiquid: ensurePhysical(scientific?.specificHeat, baseLegacyProps.specificHeatLiquid),
    specificHeatGas: ensurePhysical(scientific?.specificHeat, baseLegacyProps.specificHeatGas),

    thermalConductivity: scientific?.thermalConductivity ?? baseLegacyProps.thermalConductivity ?? 10,
    atomicRadiusPm: ensurePhysical(scientific?.atomicRadiusPm, baseLegacyProps.atomicRadiusPm!),
    oxidationStates: scientific?.oxidationStates ?? [],

    latentHeatFusion: ensurePhysical(scientific?.latentHeat?.fusion, baseLegacyProps.latentHeatFusion),
    latentHeatVaporization: ensurePhysical(scientific?.latentHeat?.vaporization, baseLegacyProps.latentHeatVaporization),

    // --- RETAINED LEGACY (Layer 3 - Custom/Sodium Fallback) ---
    bulkModulusGPa: specificLegacyProps.bulkModulusGPa ?? baseLegacyProps.bulkModulusGPa,
    criticalPoint: specificLegacyProps.criticalPoint ?? baseLegacyProps.criticalPoint,
    triplePoint: specificLegacyProps.triplePoint ?? baseLegacyProps.triplePoint,

    // Simulation Tuning Parameters (Always Layer 3)
    simonA_Pa: specificLegacyProps.simonA_Pa ?? baseLegacyProps.simonA_Pa,
    simonC: specificLegacyProps.simonC ?? baseLegacyProps.simonC,

    // Optional Enthalpy Overrides
    enthalpyFusionJmol: specificLegacyProps.enthalpyFusionJmol ?? baseLegacyProps.enthalpyFusionJmol,
    enthalpyVapJmol: specificLegacyProps.enthalpyVapJmol,
  };

  // 4. Construct Visual DNA (Strictly from Layer 2 Scientific Data)
  const elementColor = scientific?.color || "#94a3b8"; // Default to Slate-400 if missing (e.g. Uue)

  const generatedVisualDNA = {
    solid: { color: elementColor, opacidade: 1.0 },
    liquid: { color: elementColor, opacidade: 1.0 },
    gas: { color: elementColor, opacidade: 1.0 }
  };

  return {
    atomicNumber: source.number,
    symbol: source.symbol,
    name: customData.name || source.name,

    classification: {
      group: String(source.group),
      groupBlock: source.block.toUpperCase(),
      groupName: customData.classification?.groupName || "Elemento Químico",
      period: source.period,
      electronShells: source.shells ? source.shells.length : 0
    },

    mass: source.atomic_mass,
    category: customData.category || SODIUM_FALLBACK.category || 'metal',

    properties,
    visualDNA: generatedVisualDNA,
    specialBehavior: customData.specialBehavior || SODIUM_FALLBACK.specialBehavior,
    molecularForms: customData.molecularForms || SODIUM_FALLBACK.molecularForms
  };
});