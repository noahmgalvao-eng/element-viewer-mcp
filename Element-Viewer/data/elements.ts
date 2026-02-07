
import { ChemicalElement, ElementProperties } from "../types";
import { SOURCE_DATA } from "./periodic_table_source";
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

// Adapter: Transform Raw JSON + Custom Overrides into Full ChemicalElement Array
export const ELEMENTS: ChemicalElement[] = SOURCE_DATA.elements.map((source: any) => {
  // 1. Determine Custom Override or Fallback
  // If specific data exists for this symbol, use it. Otherwise, default to SODIUM_FALLBACK.
  const customData: ElementCustomData = CUSTOM_DATA[source.symbol] || SODIUM_FALLBACK;

  // Cast properties once to ensure types match for required fields (assuming fallback has them)
  const baseProperties = SODIUM_FALLBACK.properties as ElementProperties;

  // 2. Resolve Density (Source is sometimes g/L for gases, need g/cm³)
  let resolvedDensity = source.density;
  if (source.phase === "Gas" && source.density) {
    resolvedDensity = source.density / 1000;
  }

  // Fallback if density missing in source
  if (!resolvedDensity) {
    resolvedDensity = customData.properties?.density || baseProperties.density;
  }

  // 3. Resolve Properties (Merge: Fallback < Custom < Source Source-of-Truth)
  const resolvedProperties: ElementProperties = {
    // Start with Sodium Fallback (guarantees physics engine constants like latentHeat exist)
    ...baseProperties,

    // Overwrite with Specific Custom Properties (if any)
    ...customData.properties,

    // Overwrite with Source Data (Source of Truth for Identity/Basic Phys)
    meltingPointK: source.melt || customData.properties?.meltingPointK || baseProperties.meltingPointK,
    boilingPointK: source.boil || customData.properties?.boilingPointK || baseProperties.boilingPointK,
    density: resolvedDensity,
    electronegativity: source.electronegativity_pauling || customData.properties?.electronegativity,
    electronAffinity: source.electron_affinity || customData.properties?.electronAffinity,
    ionizationEnergy: source.ionization_energies ? source.ionization_energies[0] : customData.properties?.ionizationEnergy,
    electronConfiguration: source.electron_configuration_semantic,

    // Extended fields
    atomicRadiusPm: customData.properties?.atomicRadiusPm || baseProperties.atomicRadiusPm,
  } as ElementProperties;

  return {
    atomicNumber: source.number,
    symbol: source.symbol,
    name: customData.name || source.name, // Use Portuguese Name if available, else English

    classification: {
      group: String(source.group),
      groupBlock: source.block.toUpperCase(), // s, p, d, f -> S, P, D, F
      groupName: customData.classification?.groupName || "Elemento Químico",
      period: source.period,
      electronShells: source.shells ? source.shells.length : 0
    },

    mass: source.atomic_mass,
    category: customData.category || SODIUM_FALLBACK.category || 'metal',

    properties: resolvedProperties,

    visualDNA: customData.visualDNA || SODIUM_FALLBACK.visualDNA,
    specialBehavior: customData.specialBehavior || SODIUM_FALLBACK.specialBehavior,
    molecularForms: customData.molecularForms || SODIUM_FALLBACK.molecularForms
  };
});