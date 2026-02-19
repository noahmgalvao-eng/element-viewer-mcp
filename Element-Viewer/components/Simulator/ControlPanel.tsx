import React, { useMemo, useState } from 'react';
import { Badge } from '@openai/apps-sdk-ui/components/Badge';
import { Input } from '@openai/apps-sdk-ui/components/Input';
import { RadioGroup } from '@openai/apps-sdk-ui/components/RadioGroup';
import { Select } from '@openai/apps-sdk-ui/components/Select';
import { SelectControl } from '@openai/apps-sdk-ui/components/SelectControl';
import { Slider } from '@openai/apps-sdk-ui/components/Slider';
import { Switch } from '@openai/apps-sdk-ui/components/Switch';
import { SettingsSlider } from '@openai/apps-sdk-ui/components/Icon';
import {
  TempUnit,
  PressureUnit,
  TEMP_UNITS,
  PRESSURE_UNITS,
  toKelvin,
  fromKelvin,
  toPascal,
  fromPascal,
} from '../../utils/units';

interface Props {
  temperature: number;
  setTemperature: (t: number) => void;
  pressure: number;
  setPressure: (p: number) => void;
  meltPoint: number;
  boilPoint: number;
  showParticles: boolean;
  setShowParticles: (v: boolean) => void;
  onInteractionChange: (isActive: boolean) => void;
  onSliderRelease?: () => void;
}

const ControlPanel: React.FC<Props> = ({
  temperature,
  setTemperature,
  pressure,
  setPressure,
  meltPoint,
  boilPoint,
  showParticles,
  setShowParticles,
  onInteractionChange,
  onSliderRelease,
}) => {
  const [tempUnit, setTempUnit] = useState<TempUnit>('K');
  const [pressureUnit, setPressureUnit] = useState<PressureUnit>('Pa');
  const [pressureReadout, setPressureReadout] = useState<'scientific' | 'compact'>('scientific');
  const [activeControl, setActiveControl] = useState<'temperature' | 'pressure' | null>(null);

  const minTempK = 0;
  const maxTempK = 6000;
  const minSliderTemp = fromKelvin(minTempK, tempUnit);
  const maxSliderTemp = fromKelvin(maxTempK, tempUnit);

  const currentTempDisplay = fromKelvin(temperature, tempUnit);
  const currentPressureDisplay = fromPascal(pressure, pressureUnit);

  const logPressureValue = useMemo(() => {
    if (pressure > 0.0001) return Math.log10(pressure);
    return -4;
  }, [pressure]);

  const startInteraction = (target: 'temperature' | 'pressure') => {
    if (activeControl !== target) {
      setActiveControl(target);
      onInteractionChange(true);
    }
  };

  const endInteraction = () => {
    setActiveControl(null);
    onInteractionChange(false);
    onSliderRelease?.();
  };

  const handleTempInputChange = (value: number) => {
    if (!Number.isFinite(value)) return;
    setTemperature(toKelvin(value, tempUnit));
  };

  const handlePressureInputChange = (value: number) => {
    if (!Number.isFinite(value)) return;
    if (value <= 0) {
      setPressure(0);
      return;
    }
    setPressure(toPascal(value, pressureUnit));
  };

  const handlePressureSliderChange = (value: number) => {
    if (value <= -3.9) {
      setPressure(0);
      return;
    }
    setPressure(Math.pow(10, value));
  };

  return (
    <section
      className="space-y-4 rounded-3xl border border-default bg-surface p-4 shadow-sm"
      onPointerUp={endInteraction}
      onPointerCancel={endInteraction}
    >
      <SelectControl
        variant="soft"
        selected
        block
        size="sm"
        StartIcon={SettingsSlider}
        onInteract={() => {}}
      >
        Environmental controls
      </SelectControl>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-default">Temperature</p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={Number(currentTempDisplay.toFixed(tempUnit === 'K' ? 0 : 2))}
              onChange={(event) => handleTempInputChange(Number(event.target.value))}
              className="w-28"
            />
            <Select
              options={TEMP_UNITS.map((unit) => ({ value: unit.value, label: unit.label }))}
              value={tempUnit}
              onChange={(next) => setTempUnit(next.value as TempUnit)}
              block={false}
              size="sm"
            />
          </div>
        </div>

        <Slider
          value={currentTempDisplay}
          min={minSliderTemp}
          max={maxSliderTemp}
          step={tempUnit === 'K' ? 10 : 1}
          unit={tempUnit}
          onChange={(value) => {
            startInteraction('temperature');
            handleTempInputChange(value);
          }}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            color={Math.abs(temperature - meltPoint) < 50 ? 'warning' : 'secondary'}
            variant="soft"
          >
            Tmelt {meltPoint.toFixed(2)} K
          </Badge>
          <Badge
            color={Math.abs(temperature - boilPoint) < 100 ? 'danger' : 'secondary'}
            variant="soft"
          >
            Tboil {boilPoint.toFixed(2)} K
          </Badge>
        </div>
      </div>

      <div className="border-t border-subtle pt-4" />

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-default">Pressure</p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="any"
              value={Number(currentPressureDisplay.toPrecision(6))}
              onChange={(event) => handlePressureInputChange(Number(event.target.value))}
              className="w-32"
            />
            <Select
              options={PRESSURE_UNITS.map((unit) => ({ value: unit.value, label: unit.label }))}
              value={pressureUnit}
              onChange={(next) => setPressureUnit(next.value as PressureUnit)}
              block={false}
              size="sm"
            />
          </div>
        </div>

        <Slider
          value={logPressureValue}
          min={-4}
          max={11}
          step={0.05}
          label="Log scale"
          onChange={(value) => {
            startInteraction('pressure');
            handlePressureSliderChange(value);
          }}
        />

        <RadioGroup
          aria-label="Pressure readout style"
          value={pressureReadout}
          onChange={(next) => setPressureReadout(next)}
          direction="row"
          className="text-xs"
        >
          <RadioGroup.Item value="scientific">Scientific</RadioGroup.Item>
          <RadioGroup.Item value="compact">Compact</RadioGroup.Item>
        </RadioGroup>

        <Badge color="secondary" variant="outline">
          {pressureReadout === 'scientific'
            ? `${pressure.toExponential(4)} Pa`
            : `${(pressure / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} kPa`}
        </Badge>
      </div>

      <div className="border-t border-subtle pt-4" />

      <Switch
        checked={showParticles}
        onCheckedChange={setShowParticles}
        label="X-Ray Vision"
        labelPosition="start"
      />
    </section>
  );
};

export default ControlPanel;
