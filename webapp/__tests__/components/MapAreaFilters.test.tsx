import React, { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MapAreaFilters from '@/components/map/MapAreaFilters';

function Harness() {
  const [selectedTypes, setSelectedTypes] = useState<ReadonlySet<string> | null>(null);
  const [selectedSubtypes, setSelectedSubtypes] = useState<ReadonlySet<string> | null>(null);

  return (
    <MapAreaFilters
      types={['NA', 'WPP', 'ER']}
      subtypes={['Conservation', 'Recreation']}
      selectedTypes={selectedTypes}
      selectedSubtypes={selectedSubtypes}
      onTypesChange={setSelectedTypes}
      onSubtypesChange={setSelectedSubtypes}
    />
  );
}

describe('MapAreaFilters (US 2.0.6)', () => {
  it('opens one panel with a searchable, collapsible group and a select-all button for each category (2.0.6 AT1)', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Filter' }));

    const typeGroup = screen.getByRole('region', { name: 'Type' });
    const subtypeGroup = screen.getByRole('region', { name: 'Subtype' });
    expect(within(typeGroup).getByRole('checkbox', { name: 'NA' })).toBeChecked();
    expect(within(subtypeGroup).getByRole('checkbox', { name: 'Conservation' })).toBeChecked();

    const typeSearch = within(typeGroup).getByRole('textbox', { name: 'Search types' });
    await user.type(typeSearch, 'wp');
    expect(within(typeGroup).getByRole('checkbox', { name: 'WPP' })).toBeInTheDocument();
    expect(within(typeGroup).queryByRole('checkbox', { name: 'NA' })).not.toBeInTheDocument();
    expect(within(subtypeGroup).getByRole('checkbox', { name: 'Conservation' })).toBeInTheDocument();
    await user.clear(typeSearch);

    await user.click(within(typeGroup).getByRole('button', { name: /Type/ }));
    expect(within(typeGroup).queryByRole('checkbox', { name: 'WPP' })).not.toBeInTheDocument();
    expect(within(subtypeGroup).getByRole('checkbox', { name: 'Recreation' })).toBeInTheDocument();

    await user.click(within(typeGroup).getByRole('button', { name: 'Select all' }));
    await user.click(within(typeGroup).getByRole('button', { name: /Type/ }));
    expect(within(typeGroup).getByRole('checkbox', { name: 'NA' })).not.toBeChecked();

    await user.click(within(typeGroup).getByRole('checkbox', { name: 'NA' }));
    await user.click(within(typeGroup).getByRole('checkbox', { name: 'WPP' }));
    expect(within(typeGroup).getByRole('checkbox', { name: 'NA' })).toBeChecked();
    expect(within(typeGroup).getByRole('checkbox', { name: 'ER' })).not.toBeChecked();

    await user.click(within(typeGroup).getByRole('button', { name: 'Select all' }));
    expect(within(typeGroup).getByRole('checkbox', { name: 'ER' })).toBeChecked();

    await user.click(within(subtypeGroup).getByRole('checkbox', { name: 'Recreation' }));
    expect(within(subtypeGroup).getByRole('checkbox', { name: 'Recreation' })).not.toBeChecked();
    expect(within(typeGroup).getByRole('checkbox', { name: 'NA' })).toBeChecked();
  });

  it('US 2.0.6: counts only the selected counties that this view lists', async () => {
    const user = userEvent.setup();
    // 'Banff' and 'Jasper' come from the card view, which shares the county selection.
    render(
      <MapAreaFilters
        counties={['Parkland County', 'Strathcona County']}
        selectedCounties={new Set(['Banff', 'Jasper', 'Parkland County'])}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Filter' }));

    const countyGroup = screen.getByRole('region', { name: 'County' });
    expect(within(countyGroup).getByText('1 selected')).toBeInTheDocument();
  });
});
