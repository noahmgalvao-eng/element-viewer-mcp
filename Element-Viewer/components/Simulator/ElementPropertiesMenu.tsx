import React, { useMemo, useState } from 'react';
import { Badge } from '@openai/apps-sdk-ui/components/Badge';
import { Button } from '@openai/apps-sdk-ui/components/Button';
import {
  ArrowUp,
  CloseBold,
  ExternalLink,
  InfoCircle,
} from '@openai/apps-sdk-ui/components/Icon';
import { Popover } from '@openai/apps-sdk-ui/components/Popover';
import { TextLink } from '@openai/apps-sdk-ui/components/TextLink';
import { CopyTooltip, Tooltip } from '@openai/apps-sdk-ui/components/Tooltip';
import { ChemicalElement, MatterState, PhysicsState } from '../../types';
import { SOURCE_DATA } from '../../data/periodic_table_source';

interface Props {
  data: {
    x: number;
    y: number;
    element: ChemicalElement;
    physicsState: PhysicsState;
  };
  onClose: () => void;
  onSetTemperature: (temp: number) => void;
  onSetPressure: (pressure: number) => void;
}

interface PropertyItem {
  label: string;
  value: string;
  unit?: string;
  sourceId?: number;
  estimated?: boolean;
  renderedValue?: React.ReactNode;
}

interface ReferenceItem {
  id: number;
  text: string;
  href?: string;
}

const TOOLTIP_CLASS = 'tooltip-solid';

const FIXED_REFERENCES: ReferenceItem[] = [
  { id: 2, text: 'L. M. Mentel, mendeleev - A Python resource for properties of chemical elements, ions and isotopes.', href: 'https://github.com/lmmentel/mendeleev' },
  { id: 3, text: 'Servicos de dados fornecidos pelo PubChem PUG-REST API.' },
  { id: 4, text: 'Angstrom Sciences, Inc. (2026). Magnetron Sputtering Reference.', href: 'https://www.angstromsciences.com/magnetron-sputtering-reference' },
  { id: 5, text: 'Wolfram Research, Inc. (2026). ElementData curated properties.', href: 'https://periodictable.com' },
  { id: 6, text: 'Wikipedia contributors. (2025). Template:Periodic table (melting point).', href: 'https://en.wikipedia.org/wiki/Template:Periodic_table_(melting_point)' },
  { id: 7, text: 'Wikipedia contributors. (2026). Boiling points of the elements (data page).', href: 'https://en.wikipedia.org/wiki/Boiling_points_of_the_elements_(data_page)' },
  { id: 8, text: 'Wikipedia contributors. (2026). Melting points of the elements (data page).', href: 'https://en.wikipedia.org/wiki/Melting_points_of_the_elements_(data_page)' },
  { id: 9, text: 'Wikipedia contributors. (2024). Template:Infobox oganesson.', href: 'https://en.wikipedia.org/wiki/Template:Infobox_oganesson' },
  { id: 10, text: 'Wikipedia contributors. (2026, 20 de fevereiro). Boiling points of the elements (data page). Wikipedia.', href: 'https://en.wikipedia.org/wiki/Boiling_points_of_the_elements_(data_page)' },
  { id: 11, text: 'Helmenstine, A. (2023). Triple Point Definition - Triple Point of Water.', href: 'https://sciencenotes.org/triple-point-of-water/' },
  { id: 12, text: 'Wikipedia contributors. (2026, 20 de fevereiro). Triple point. Wikipedia.', href: 'https://en.wikipedia.org/wiki/Triple_point' },
  { id: 13, text: 'KnowledgeDoor. (n.d.). Enthalpy of Fusion. Elements Handbook. Retrieved February 19, 2026.', href: 'https://www.knowledgedoor.com/2/elements_handbook/enthalpy_of_fusion.html' },
  { id: 14, text: 'KnowledgeDoor. (n.d.). Enthalpy of Vaporization. Elements Handbook. Retrieved February 19, 2026.', href: 'https://www.knowledgedoor.com/2/elements_handbook/enthalpy_of_vaporization.html' },
  { id: 15, text: 'KnowledgeDoor. (n.d.). Isothermal Bulk Modulus. Elements Handbook. Retrieved February 19, 2026.', href: 'https://www.knowledgedoor.com/2/elements_handbook/isothermal_bulk_modulus.html' },
  { id: 16, text: 'Wikipedia contributors. (2026, 20 de fevereiro). Copernicium. Wikipedia.', href: 'https://en.wikipedia.org/wiki/Copernicium' },
  { id: 17, text: 'Cannon, J. F. (1974). Behavior of the elements at high pressures. Journal of Physical and Chemical Reference Data, 3(3), 781-824.', href: 'https://srd.nist.gov/JPCRD/jpcrd55.pdf' },
  { id: 18, text: 'KnowledgeDoor. (n.d.). Triple Point. Elements Handbook. Retrieved February 20, 2026.', href: 'https://www.knowledgedoor.com/2/elements_handbook/triple_point.html' },
  { id: 19, text: 'KnowledgeDoor. (n.d.). Critical Point. Elements Handbook. Retrieved February 20, 2026.', href: 'https://www.knowledgedoor.com/2/elements_handbook/critical_point.html' },
];

const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '\u2070',
  '1': '\u00b9',
  '2': '\u00b2',
  '3': '\u00b3',
  '4': '\u2074',
  '5': '\u2075',
  '6': '\u2076',
  '7': '\u2077',
  '8': '\u2078',
  '9': '\u2079',
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const formatNumber = (value: number, maxFractionDigits = 4) =>
  value.toLocaleString(undefined, { maximumFractionDigits: maxFractionDigits });

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseDisplayValue = (
  rawValue: unknown,
  unit?: string,
  fallbackNumber?: number,
) => {
  try {
    if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
      return { value: formatNumber(rawValue), estimated: false, na: false };
    }

    if (typeof rawValue === 'string') {
      const normalized = rawValue.replace(/\u00c2/g, '').trim();
      if (!normalized || normalized.toUpperCase() === 'N/A') {
        return { value: 'N/A', estimated: false, na: true };
      }

      const estimated = normalized.includes('*');
      let value = normalized.replace(/\*/g, '').trim();
      if (unit && value) {
        const unitPattern = new RegExp(`\\s*${escapeRegex(unit)}$`, 'i');
        value = value.replace(unitPattern, '').trim();
      }

      if (!value || value.toUpperCase() === 'N/A') {
        return { value: 'N/A', estimated: false, na: true };
      }

      return { value, estimated, na: false };
    }

    if (typeof fallbackNumber === 'number' && Number.isFinite(fallbackNumber)) {
      return { value: formatNumber(fallbackNumber), estimated: false, na: false };
    }
  } catch {
    return { value: 'N/A', estimated: false, na: true };
  }

  return { value: 'N/A', estimated: false, na: true };
};

const formatElectronConfiguration = (config?: string) => {
  try {
    if (!config || config.trim() === '' || config.trim().toUpperCase() === 'N/A') return 'N/A';
    return config
      .trim()
      .split(/\s+/)
      .map((token, index, arr) => {
        const match = token.match(/^(\d+[spdfghijklm])(\d+)$/i);
        const spacer = index < arr.length - 1 ? ' ' : '';
        if (!match) return `${token}${spacer}`;
        const exponent = match[2]
          .split('')
          .map((digit) => SUPERSCRIPT_MAP[digit] || digit)
          .join('');
        return `${match[1]}${exponent}${spacer}`;
      });
  } catch {
    return config || 'N/A';
  }
};

const PropertyCard: React.FC<{ item: PropertyItem }> = ({ item }) => {
  const isNA = item.value === 'N/A';
  const finalText = isNA ? 'N/A' : `${item.value}${item.unit ? ` ${item.unit}` : ''}`;

  return (
    <div className="rounded-xl border border-subtle bg-surface-secondary p-2.5">
      <div className="flex items-start justify-between gap-2">
        <p className="break-words text-3xs uppercase tracking-wide text-secondary">{item.label}</p>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 text-3xs text-tertiary">
          {typeof item.sourceId === 'number' && <span>[{item.sourceId}]</span>}
          {item.estimated && <span>*estimado</span>}
        </div>
      </div>
      <div className="mt-1 break-words text-xs font-mono leading-snug text-default">
        {item.renderedValue && !isNA ? item.renderedValue : finalText}
      </div>
    </div>
  );
};

const ElementPropertiesMenu: React.FC<Props> = ({ data, onClose, onSetTemperature, onSetPressure }) => {
  const { element, physicsState, x, y } = data;
  const [showFullDescription, setShowFullDescription] = useState(false);

  const sourceInfo = SOURCE_DATA.elements.find((entry) => entry.symbol === element.symbol) as
    | Record<string, any>
    | undefined;
  const periodicSourceRef = sourceInfo ? 1 : undefined;
  const wikiUrl = typeof sourceInfo?.source === 'string'
    ? sourceInfo.source
    : 'https://en.wikipedia.org/wiki/Periodic_table';

  const fmt = (value: number, unit = '') =>
    `${value.toLocaleString(undefined, { maximumFractionDigits: 3 })}${unit}`;

  const triplePoint = element.properties.triplePoint;
  const criticalPoint = element.properties.criticalPoint;
  const hasTriplePoint = Boolean(triplePoint && triplePoint.tempK > 0 && triplePoint.pressurePa > 0);
  const hasCriticalPoint = Boolean(criticalPoint && criticalPoint.tempK > 0 && criticalPoint.pressurePa > 0);


  const isLiquidLike = [
    MatterState.LIQUID,
    MatterState.MELTING,
    MatterState.BOILING,
    MatterState.EQUILIBRIUM_MELT,
    MatterState.EQUILIBRIUM_BOIL,
    MatterState.EQUILIBRIUM_TRIPLE,
  ].includes(physicsState.state);

  const isGasLike = [
    MatterState.GAS,
    MatterState.SUPERCRITICAL,
    MatterState.TRANSITION_SCF,
    MatterState.BOILING,
    MatterState.EQUILIBRIUM_BOIL,
    MatterState.SUBLIMATION,
    MatterState.EQUILIBRIUM_SUB,
  ].includes(physicsState.state);

  const actionMeltingPoint = Number.isFinite(physicsState.meltingPointCurrent) && physicsState.meltingPointCurrent > 0
    ? physicsState.meltingPointCurrent
    : element.properties.meltingPointK;
  const actionBoilingPoint = Number.isFinite(physicsState.boilingPointCurrent) && physicsState.boilingPointCurrent > 0
    ? physicsState.boilingPointCurrent
    : element.properties.boilingPointK;
  const actionMeltTarget = isLiquidLike ? Math.max(1, actionMeltingPoint - 25) : actionMeltingPoint + 25;
  const actionBoilTarget = actionBoilingPoint + Math.max(5, actionBoilingPoint * 0.02);
  const sublimationTemp = Math.max(1, physicsState.sublimationPointCurrent || triplePoint?.tempK || actionMeltingPoint);
  const sublimationPressure = triplePoint ? Math.max(1, triplePoint.pressurePa * 0.8) : 1;
  const sublimationTargetTemp = isGasLike ? Math.max(1, sublimationTemp - 40) : sublimationTemp + 40;
  const sublimationDirection = isGasLike ? "<" : ">";

  const atomicMass = parseDisplayValue(
    typeof sourceInfo?.atomic_mass === 'number' ? sourceInfo.atomic_mass : element.mass,
    'u',
  );
  const density = parseDisplayValue(element.properties.densityDisplay);
  const atomicRadius = parseDisplayValue(element.properties.atomicRadiusDisplay, 'pm', element.properties.atomicRadiusPm);
  const electronAffinity = parseDisplayValue(
    typeof sourceInfo?.electron_affinity === 'number' ? sourceInfo.electron_affinity : undefined,
    'kJ/mol',
  );
  const ionizationEnergy = parseDisplayValue(
    Array.isArray(sourceInfo?.ionization_energies) ? sourceInfo.ionization_energies[0] : undefined,
    'kJ/mol',
  );
  const oxidationStates = parseDisplayValue(element.properties.oxidationStatesDisplay);
  const electronConfigurationRaw =
    typeof sourceInfo?.electron_configuration_semantic === 'string'
      ? sourceInfo.electron_configuration_semantic
      : typeof element.properties.electronConfiguration === 'string'
        ? element.properties.electronConfiguration
        : 'N/A';
  const electronConfiguration = parseDisplayValue(electronConfigurationRaw);

  const meltingPoint = parseDisplayValue(element.properties.meltingPointDisplay, 'K', element.properties.meltingPointK);
  const boilingPoint = parseDisplayValue(element.properties.boilingPointDisplay, 'K', element.properties.boilingPointK);
  const triplePointTemp = parseDisplayValue(element.properties.triplePointTempDisplay, 'K', triplePoint?.tempK);
  const triplePointPress = parseDisplayValue(
    element.properties.triplePointPressDisplay,
    'kPa',
    typeof triplePoint?.pressurePa === 'number' ? triplePoint.pressurePa / 1000 : undefined,
  );
  const criticalPointTemp = parseDisplayValue(element.properties.criticalPointTempDisplay, 'K', criticalPoint?.tempK);
  const criticalPointPress = parseDisplayValue(
    element.properties.criticalPointPressDisplay,
    'kPa',
    typeof criticalPoint?.pressurePa === 'number' ? criticalPoint.pressurePa / 1000 : undefined,
  );
  const thermalConductivity = parseDisplayValue(
    element.properties.thermalConductivityDisplay,
    'W/mK',
    element.properties.thermalConductivity,
  );
  const specificHeatSolid = parseDisplayValue(
    element.properties.specificHeatSolidDisplay,
    'J/kgK',
    element.properties.specificHeatSolid,
  );
  const specificHeatLiquid = parseDisplayValue(
    element.properties.specificHeatLiquidDisplay,
    'J/kgK',
    element.properties.specificHeatLiquid,
  );
  const specificHeatGas = parseDisplayValue(
    element.properties.specificHeatGasDisplay,
    'J/kgK',
    element.properties.specificHeatGas,
  );
  const latentHeatFusion = parseDisplayValue(
    element.properties.latentHeatFusionDisplay,
    'J/kg',
    element.properties.latentHeatFusion,
  );
  const latentHeatVaporization = parseDisplayValue(
    element.properties.latentHeatVaporizationDisplay,
    'J/kg',
    element.properties.latentHeatVaporization,
  );
  const enthalpyFusionKjMol = parseDisplayValue(element.properties.enthalpyFusionKjMolDisplay, 'kJ/mol');
  const enthalpyVaporizationKjMol = parseDisplayValue(element.properties.enthalpyVaporizationKjMolDisplay, 'kJ/mol');
  const electricalConductivity = parseDisplayValue(element.properties.electricalConductivityDisplay);
  const bulkModulus = parseDisplayValue(element.properties.bulkModulusDisplay, 'GPa');

  const atomicChemicalProperties: PropertyItem[] = [
    { label: 'Atomic mass', value: atomicMass.value, unit: atomicMass.na ? undefined : 'u', sourceId: periodicSourceRef },
    { label: 'Density', value: density.value, sourceId: periodicSourceRef, estimated: density.estimated },
    { label: 'Raio atômico', value: atomicRadius.value, unit: atomicRadius.na ? undefined : 'pm', sourceId: element.properties.atomicRadiusSource, estimated: atomicRadius.estimated },
    { label: 'Afinidade eletrônica', value: electronAffinity.value, unit: electronAffinity.na ? undefined : 'kJ/mol', sourceId: periodicSourceRef, estimated: electronAffinity.estimated },
    { label: '1ª Energia de ionização', value: ionizationEnergy.value, unit: ionizationEnergy.na ? undefined : 'kJ/mol', sourceId: periodicSourceRef, estimated: ionizationEnergy.estimated },
    { label: 'Estados de oxidação', value: oxidationStates.value, estimated: oxidationStates.estimated },
    { label: 'Electron configuration', value: electronConfiguration.value, sourceId: periodicSourceRef, renderedValue: electronConfiguration.na ? undefined : formatElectronConfiguration(electronConfigurationRaw) },
  ];

  const physicsProperties: PropertyItem[] = [
    { label: 'Melting point', value: meltingPoint.value, unit: meltingPoint.na ? undefined : 'K', sourceId: element.properties.meltingPointSource, estimated: meltingPoint.estimated },
    { label: 'Boiling point', value: boilingPoint.value, unit: boilingPoint.na ? undefined : 'K', sourceId: element.properties.boilingPointSource, estimated: boilingPoint.estimated },
    { label: 'Triple point (temp)', value: triplePointTemp.value, unit: triplePointTemp.na ? undefined : 'K', sourceId: element.properties.triplePointSource, estimated: triplePointTemp.estimated },
    { label: 'Triple point (press)', value: triplePointPress.value, unit: triplePointPress.na ? undefined : 'kPa', sourceId: element.properties.triplePointSource, estimated: triplePointPress.estimated },
    { label: 'Critical point (temp)', value: criticalPointTemp.value, unit: criticalPointTemp.na ? undefined : 'K', sourceId: element.properties.criticalPointSource, estimated: criticalPointTemp.estimated },
    { label: 'Critical point (press)', value: criticalPointPress.value, unit: criticalPointPress.na ? undefined : 'kPa', sourceId: element.properties.criticalPointSource, estimated: criticalPointPress.estimated },
    { label: 'Thermal conductivity', value: thermalConductivity.value, unit: thermalConductivity.na ? undefined : 'W/mK', sourceId: element.properties.thermalConductivitySource, estimated: thermalConductivity.estimated },
    { label: 'Specific heat (solid)', value: specificHeatSolid.value, unit: specificHeatSolid.na ? undefined : 'J/kgK', sourceId: element.properties.specificHeatSolidSource, estimated: specificHeatSolid.estimated },
    { label: 'Specific heat (liquid)', value: specificHeatLiquid.value, unit: specificHeatLiquid.na ? undefined : 'J/kgK', sourceId: element.properties.specificHeatLiquidSource, estimated: specificHeatLiquid.estimated },
    { label: 'Specific heat (gas)', value: specificHeatGas.value, unit: specificHeatGas.na ? undefined : 'J/kgK', sourceId: element.properties.specificHeatGasSource, estimated: specificHeatGas.estimated },
    { label: 'Latent heat (fusion)', value: latentHeatFusion.value, unit: latentHeatFusion.na ? undefined : 'J/kg', sourceId: element.properties.latentHeatFusionSource, estimated: latentHeatFusion.estimated },
    { label: 'Latent heat (vaporization)', value: latentHeatVaporization.value, unit: latentHeatVaporization.na ? undefined : 'J/kg', sourceId: element.properties.latentHeatVaporizationSource, estimated: latentHeatVaporization.estimated },
    { label: 'enthalpyFusionKjMol', value: enthalpyFusionKjMol.value, unit: enthalpyFusionKjMol.na ? undefined : 'kJ/mol', sourceId: element.properties.enthalpyFusionSource, estimated: enthalpyFusionKjMol.estimated },
    { label: 'enthalpyVaporizationKjMol', value: enthalpyVaporizationKjMol.value, unit: enthalpyVaporizationKjMol.na ? undefined : 'kJ/mol', sourceId: element.properties.enthalpyVaporizationSource, estimated: enthalpyVaporizationKjMol.estimated },
    { label: 'bulkModulusGPA', value: bulkModulus.value, unit: bulkModulus.na ? undefined : 'GPa', sourceId: element.properties.bulkModulusSource, estimated: bulkModulus.estimated },
    { label: 'Electrical conductivity', value: electricalConductivity.value, estimated: electricalConductivity.estimated },
  ];

  const references = useMemo<ReferenceItem[]>(
    () => [
      { id: 1, text: `${element.name}. (2026). In Wikipedia.`, href: wikiUrl },
      ...FIXED_REFERENCES,
    ],
    [element.name, wikiUrl],
  );

  const summaryText = element.summary || 'No summary available.';
  const summaryPreview = summaryText.length > 220 ? `${summaryText.slice(0, 220)}...` : summaryText;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1366;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
  const side = x > viewportWidth * 0.6 ? 'left' : 'right';
  const panelWidth = 432;
  const panelLeft = side === 'right'
    ? clamp(x + 12, 8, viewportWidth - panelWidth)
    : clamp(x - panelWidth, 8, viewportWidth - panelWidth);
  const panelTop = clamp(y - 24, 8, viewportHeight - 640);

  return (
    <div className="fixed inset-0 z-[100]" onMouseDown={onClose}>
      <div
        className="pointer-events-auto fixed w-[min(96vw,27rem)] max-h-[min(86vh,40rem)] overflow-y-auto rounded-3xl border border-default bg-surface shadow-xl"
        style={{ left: `${panelLeft}px`, top: `${panelTop}px` }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CopyTooltip copyValue={element.symbol}>
                  <span>
                    <Badge color="info" variant="soft">{element.symbol}</Badge>
                  </span>
                </CopyTooltip>
                <Badge color="secondary" variant="outline">Atomic #{element.atomicNumber}</Badge>
              </div>
              <h3 className="heading-xs text-default">{element.name}</h3>
              <p className="text-xs text-secondary">
                {sourceInfo?.category || element.classification.groupName || 'Generated substance'}
              </p>
            </div>

            <Button color="secondary" variant="ghost" pill uniform onClick={onClose} aria-label="Close details">
              <CloseBold className="size-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Tooltip content="Set global temperature below or above the melting threshold" contentClassName={TOOLTIP_CLASS}>
              <span>
                <Button color="warning" variant="soft" block onClick={() => onSetTemperature(actionMeltTarget)}>
                  <ArrowUp className="size-4" />
                  {isLiquidLike ? 'Solidificar' : 'Fundir'} · T {isLiquidLike ? '<' : '>'} {fmt(actionMeltingPoint, ' K')}
                </Button>
              </span>
            </Tooltip>

            <Tooltip content="Set global temperature above the pressure-adjusted boiling point" contentClassName={TOOLTIP_CLASS}>
              <span>
                <Button
                  color="danger"
                  variant="soft"
                  block
                  disabled={actionBoilingPoint >= 49000}
                  onClick={() => onSetTemperature(actionBoilTarget)}
                >
                  <ArrowUp className="size-4" />
                  Ebulição {actionBoilingPoint >= 49000 ? 'indefinida' : `· T > ${fmt(actionBoilingPoint, ' K')}`}
                </Button>
              </span>
            </Tooltip>

            <Tooltip content="Set pressure below triple point and temperature around sublimation threshold" contentClassName={TOOLTIP_CLASS}>
              <span>
                <Button
                  color="secondary"
                  variant="soft"
                  block
                  disabled={!hasTriplePoint}
                  onClick={() => {
                    if (!triplePoint) return;
                    onSetPressure(sublimationPressure);
                    onSetTemperature(sublimationTargetTemp);
                  }}
                >
                  <ArrowUp className="size-4" />
                  Sublimação {hasTriplePoint ? `· T ${sublimationDirection} ${fmt(sublimationTemp, ' K')} · P < ${fmt(triplePoint!.pressurePa / 1000, ' kPa')}` : ''}
                </Button>
              </span>
            </Tooltip>

            <Tooltip content="Set environment to triple point" contentClassName={TOOLTIP_CLASS}>
              <span>
                <Button
                  color="success"
                  variant="soft"
                  block
                  disabled={!hasTriplePoint}
                  onClick={() => {
                    if (!triplePoint) return;
                    onSetTemperature(triplePoint.tempK);
                    onSetPressure(triplePoint.pressurePa);
                  }}
                >
                  <ArrowUp className="size-4" />
                  Ponto triplo {hasTriplePoint ? `· T = ${fmt(triplePoint!.tempK, ' K')} · P = ${fmt(triplePoint!.pressurePa / 1000, ' kPa')}` : ''}
                </Button>
              </span>
            </Tooltip>

            <Tooltip content="Move to supercritical regime (T and P above critical values)" contentClassName={TOOLTIP_CLASS}>
              <span className="col-span-2">
                <Button
                  color="info"
                  variant="soft"
                  block
                  disabled={!hasCriticalPoint}
                  onClick={() => {
                    if (!criticalPoint) return;
                    onSetTemperature(criticalPoint.tempK + 25);
                    onSetPressure(criticalPoint.pressurePa + 1000);
                  }}
                >
                  <ArrowUp className="size-4" />
                  Supercrítico {hasCriticalPoint ? `> ${fmt(criticalPoint!.tempK, ' K')} · > ${fmt(criticalPoint!.pressurePa / 1000, ' kPa')}` : ''}
                </Button>
              </span>
            </Tooltip>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Popover>
              <Popover.Trigger>
                <Button color="secondary" variant="soft" block>
                  <InfoCircle className="size-4" />
                  Ver descrição
                </Button>
              </Popover.Trigger>
              <Popover.Content
                side="top"
                align="start"
                sideOffset={8}
                minWidth={300}
                maxWidth={380}
                className="z-[130] rounded-2xl border border-default bg-surface shadow-lg"
              >
                <div className="max-h-56 space-y-2 overflow-y-auto p-3" onMouseDown={(event) => event.stopPropagation()}>
                  <p className="text-xs font-medium text-secondary">Descrição do elemento</p>
                  <p className={`text-sm leading-5 text-default ${showFullDescription ? 'whitespace-pre-wrap' : 'line-clamp-2-soft'}`}>
                    {showFullDescription ? summaryText : summaryPreview}
                  </p>
                  {summaryText.length > 220 && (
                    <Button color="secondary" variant="ghost" size="sm" onClick={() => setShowFullDescription((prev) => !prev)}>
                      {showFullDescription ? 'Ver menos' : 'Ver mais'}
                    </Button>
                  )}
                </div>
              </Popover.Content>
            </Popover>

          </div>

          <div className="space-y-3 rounded-2xl border border-subtle bg-surface p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-default">Atomic & Chemical</p>
              <Badge color="secondary" variant="outline">2 colunas</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {atomicChemicalProperties.map((item) => (
                <PropertyCard key={item.label} item={item} />
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-subtle bg-surface p-3">
            <p className="text-sm font-semibold text-default">Physics</p>
            <div className="grid grid-cols-2 gap-2">
              {physicsProperties.map((item) => (
                <PropertyCard key={item.label} item={item} />
              ))}
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-subtle bg-surface p-3">
            <Popover>
              <Popover.Trigger>
                <Button color="secondary" variant="soft" block>
                  <ExternalLink className="size-4" />
                  Ver referências
                </Button>
              </Popover.Trigger>
              <Popover.Content
                side="top"
                align="end"
                sideOffset={8}
                minWidth={320}
                maxWidth={390}
                className="z-[130] rounded-2xl border border-default bg-surface shadow-lg"
              >
                <div className="max-h-64 space-y-2 overflow-y-auto p-3" onMouseDown={(event) => event.stopPropagation()}>
                  <p className="text-xs font-medium text-secondary">Referências definidas no app</p>
                  <ul className="space-y-2">
                    {references.map((reference) => (
                      <li key={reference.id} className="rounded-xl border border-subtle bg-surface-secondary p-2">
                        <div className="flex gap-2">
                          <span className="text-xs font-semibold text-secondary">[{reference.id}]</span>
                          <div className="min-w-0 space-y-1">
                            <p className="break-words text-sm text-default">{reference.text}</p>
                            {reference.href && (
                              <TextLink as="a" href={reference.href} forceExternal>
                                {reference.href}
                              </TextLink>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </Popover.Content>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElementPropertiesMenu;
