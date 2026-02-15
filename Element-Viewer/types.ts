
export interface ElementProperties {
  meltingPointK: number;
  boilingPointK: number;
  enthalpyVapJmol?: number; // For Clausius-Clapeyron
  bulkModulusGPa?: number;   // For solid/liquid compression
  // --- DYNAMIC PHYSICS FIELDS (SI Units: J/kg and J/kg.K) ---
  latentHeatFusion: number;       // J/kg (Solid -> Liquid)
  latentHeatVaporization: number; // J/kg (Liquid -> Gas)
  specificHeatSolid: number;      // J/kg.K
  specificHeatLiquid: number;     // J/kg.K
  specificHeatGas: number;        // J/kg.K
  
  // --- DISPLAY STRINGS (For Estimated Values * or N/A) ---
  specificHeatSolidDisplay?: string;
  specificHeatLiquidDisplay?: string;
  specificHeatGasDisplay?: string;
  latentHeatFusionDisplay?: string;
  latentHeatVaporizationDisplay?: string;

  // --- SOURCE CITATION IDS (1=Wiki, 2=Mendeleev, 3=PubChem, 4=Angstrom, 5=Wolfram) ---
  meltingPointSource?: number;
  boilingPointSource?: number;
  densitySource?: number;
  atomicRadiusSource?: number;
  thermalConductivitySource?: number;
  specificHeatSolidSource?: number;
  specificHeatLiquidSource?: number;
  specificHeatGasSource?: number;
  latentHeatFusionSource?: number;
  latentHeatVaporizationSource?: number;
  electronegativitySource?: number;
  electronAffinitySource?: number;
  ionizationEnergySource?: number;

  // --- CRITICAL POINT DATA ---
  criticalPoint?: {
    tempK: number;
    pressurePa: number;
  };
  // --- TRIPLE POINT DATA ---
  triplePoint?: {
    tempK: number;
    pressurePa: number;
  };
  // --- NEW EXTENDED PROPERTIES ---
  electronegativity?: number; // Pauling Scale
  atomicRadiusPm?: number;    // Picometers
  density?: number;           // g/cm³
  thermalConductivity?: number; // W/(m·K)
  electricalConductivity?: number; // S/m (Siemens per meter)
  electronConfiguration?: string; 
  
  // NEW SCIENTIFIC DATA
  electronAffinity?: number;      // kJ/mol
  ionizationEnergy?: number;      // 1st Ionization Energy (kJ/mol)
  oxidationStates?: number[];     // Common oxidation states (e.g., [1, -1])

  // Simon-Glatzel Parameters (Optional)
  simonA_Pa?: number; // Internal pressure parameter 'a' (Pascals)
  simonC?: number;    // Exponent parameter 'c' (dimensionless)

  // SUBLIMATION DATA
  enthalpyFusionJmol?: number; // Required for Sublimation Calc
}

export interface VisualDNAState {
  color: string;
  opacidade: number;
}

export interface VisualDNA {
  solid: VisualDNAState;
  liquid: VisualDNAState;
  gas: VisualDNAState;
}

export interface SpecialBehavior {
  isWaterLike?: boolean;
  highPressureTurnover?: boolean;
  cantFreezeBelowPa?: number;
}

export interface MolecularState {
    symbol: string;   // e.g., "S₈", "Cl₂"
    maxTempK: number; // The threshold temp where this bond breaks
}

export interface ChemicalElement {
  atomicNumber: number;
  symbol: string;
  name: string;
  // NEW: Classification Data
  classification: {
    group: string;       // IUPAC (e.g., "1", "11")
    groupBlock: string;  // CAS (e.g., "IA", "IB")
    groupName?: string;  // e.g., "Metais Alcalinos"
    period: number;
    electronShells: number;
  };
  mass: number; // Atomic Mass in u
  properties: ElementProperties;
  visualDNA: VisualDNA;
  specialBehavior?: SpecialBehavior;
  molecularForms?: MolecularState[]; // Ordered from lowest energy (largest molecule) to highest
  category: string;
}

export enum MatterState {
  SOLID = 'SOLID',
  MELTING = 'MELTING',
  EQUILIBRIUM_MELT = 'EQUILIBRIUM_MELT',
  LIQUID = 'LIQUID',
  BOILING = 'BOILING',
  EQUILIBRIUM_BOIL = 'EQUILIBRIUM_BOIL',
  EQUILIBRIUM_TRIPLE = 'EQUILIBRIUM_TRIPLE',
  SUBLIMATION = 'SUBLIMATION', // Solid -> Gas directly
  EQUILIBRIUM_SUB = 'EQUILIBRIUM_SUB', // Solid + Gas coexistence
  GAS = 'GAS',
  TRANSITION_SCF = 'TRANSITION_SCF',
  SUPERCRITICAL = 'SUPERCRITICAL'
}

export enum ParticleState {
  TRAPPED = 'TRAPPED',       // Inside the puddle (part of bulk liquid)
  RISING = 'RISING',         // Evaporating
  GAS = 'GAS',               // Free floating (Brownian)
  CONDENSING = 'CONDENSING'  // Returning to liquid
}

export interface Particle {
  id: number;
  state: ParticleState;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number; // Radius
  homeX: number; // The fixed lattice X position
  homeY: number; // The fixed lattice Y position
}

export interface MatterRect {
  w: number;
  h: number;
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface ViewBoxDimensions {
  minX: number;
  minY: number;
  width: number;
  height: number;
  maxX: number; // helper derived from minX + width
  maxY: number; // helper derived from minY + height
}

export interface PhysicsState {
  state: MatterState;
  temperature: number;      // Current System Temperature (K)
  pressure: number;         // Current Pressure (Pa)
  enthalpy: number;         // Total System Energy (Joules)
  simTime: number;
  boilingPointCurrent: number;
  meltingPointCurrent: number;
  sublimationPointCurrent: number; // New: T_sub

  // Progress indicators (0 to 1)
  meltProgress: number; 
  boilProgress: number;     // 0 = Full Liquid, 1 = All Gas
  sublimationProgress: number; // 0 = Full Solid, 1 = All Gas (Sublimated)
  
  // The Particle System
  particles: Particle[];
  pathProgress: number;     // Controls the SVG Puddle shape
  
  powerInput: number;       // Watts (J/s) flowing in/out
  
  // High Pressure Physics
  compressionFactor: number; // 1.0 = Normal, <1.0 = Compressed
  gasBounds: Bounds;         // The rectangular limits for gas particles
  meanParticleSpeed: number; // Average velocity scalar of gas particles
  
  // Authoritative Geometry
  matterRect: MatterRect;

  // Supercritical Fluid Specifics
  scfOpacity: number;        // Calculated opacity for the Nebula layer (0.0 to 1.0)
  scfTransitionProgress: number; // 0 to 1 tracking the transition to/from SCF
}
