import { availableProtectedAreas } from '@/lib/sites/availableProtectedAreas';

const areas = [
  { id: 9, name: 'Lakeland' },
  { id: 10, name: 'Wainwright Dunes' },
];

describe('availableProtectedAreas (US 2.0.2)', () => {
  it('hides a protected area that another site already uses (2.0.2 AT6)', () => {
    const sites = [
      { id: 1, protected_area_id: 9 },
      { id: 2, protected_area_id: null },
    ];

    expect(availableProtectedAreas(areas, sites, null).map((area) => area.id)).toEqual([10]);
  });

  it('keeps the protected area that belongs to the site being edited (2.0.5 AT1)', () => {
    const sites = [{ id: 1, protected_area_id: 9 }];

    expect(availableProtectedAreas(areas, sites, 1).map((area) => area.id)).toEqual([9, 10]);
  });
});
