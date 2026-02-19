import React, { useMemo, useState } from 'react';
import { Avatar, AvatarGroup } from '@openai/apps-sdk-ui/components/Avatar';
import { Badge } from '@openai/apps-sdk-ui/components/Badge';
import { Button } from '@openai/apps-sdk-ui/components/Button';
import { Search } from '@openai/apps-sdk-ui/components/Icon';
import { Input } from '@openai/apps-sdk-ui/components/Input';
import { SegmentedControl } from '@openai/apps-sdk-ui/components/SegmentedControl';
import { TagInput } from '@openai/apps-sdk-ui/components/TagInput';
import { ELEMENTS } from '../../data/elements';
import { ChemicalElement } from '../../types';

interface Props {
  selectedElements: ChemicalElement[];
  onSelect: (el: ChemicalElement) => void;
  isMultiSelect: boolean;
  onToggleMultiSelect: () => void;
}

const PeriodicTableSelector: React.FC<Props> = ({
  selectedElements,
  onSelect,
  isMultiSelect,
  onToggleMultiSelect,
}) => {
  const [searchValue, setSearchValue] = useState('');

  const filteredElements = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return ELEMENTS;
    return ELEMENTS.filter(
      (el) => el.symbol.toLowerCase().includes(query) || el.name.toLowerCase().includes(query),
    );
  }, [searchValue]);

  const tags = useMemo(
    () => selectedElements.map((el) => ({ value: el.symbol, valid: true })),
    [selectedElements],
  );

  return (
    <section className="space-y-4 rounded-3xl border border-default bg-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="heading-xs text-default">Element Selector</h3>
          <p className="text-xs text-secondary">Choose one element or compare up to six.</p>
        </div>
        <Badge color={isMultiSelect ? 'info' : 'secondary'} variant="soft">
          {isMultiSelect ? 'Compare mode' : 'Single mode'}
        </Badge>
      </div>

      <SegmentedControl
        aria-label="Selection mode"
        value={isMultiSelect ? 'compare' : 'single'}
        onChange={(next) => {
          if ((next === 'compare') !== isMultiSelect) {
            onToggleMultiSelect();
          }
        }}
        block
      >
        <SegmentedControl.Option value="single">Single</SegmentedControl.Option>
        <SegmentedControl.Option value="compare">Compare (max 6)</SegmentedControl.Option>
      </SegmentedControl>

      <Input
        value={searchValue}
        onChange={(event) => setSearchValue(event.target.value)}
        placeholder="Search by name or symbol"
        startAdornment={<Search className="size-4 text-secondary" />}
      />

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-secondary">Selected elements ({selectedElements.length}/6)</p>
          <AvatarGroup size={28}>
            {selectedElements.map((el) => (
              <Avatar
                key={el.atomicNumber}
                name={el.symbol}
                size={28}
                color="info"
                variant="soft"
              />
            ))}
          </AvatarGroup>
        </div>
        <TagInput value={tags} onChange={() => {}} disabled rows={1} size="md" />
      </div>

      <div className="max-h-[22rem] overflow-y-auto pr-1">
        <div className="grid grid-cols-4 gap-2 xs:grid-cols-5 sm:grid-cols-6">
          {filteredElements.map((el) => {
            const isSelected = selectedElements.some((selected) => selected.atomicNumber === el.atomicNumber);
            const selectionIndex = selectedElements.findIndex(
              (selected) => selected.atomicNumber === el.atomicNumber,
            );

            return (
              <Button
                key={el.atomicNumber}
                color={isSelected ? 'primary' : 'secondary'}
                variant={isSelected ? 'solid' : 'soft'}
                size="md"
                block
                onClick={() => onSelect(el)}
                className="!h-16 !rounded-xl !px-1 !py-1 !gap-0.5 !items-center !justify-center !text-center"
              >
                <span className="text-3xs leading-none text-tertiary">{el.atomicNumber}</span>
                <span className="text-sm font-semibold leading-none">{el.symbol}</span>
                {isMultiSelect && isSelected ? (
                  <Badge color="info" variant="outline" size="sm" className="!px-1.5">
                    {selectionIndex + 1}
                  </Badge>
                ) : (
                  <span className="text-3xs leading-none text-secondary">{el.name}</span>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {filteredElements.length === 0 && (
        <p className="text-sm text-tertiary">No elements match this search.</p>
      )}
    </section>
  );
};

export default PeriodicTableSelector;
