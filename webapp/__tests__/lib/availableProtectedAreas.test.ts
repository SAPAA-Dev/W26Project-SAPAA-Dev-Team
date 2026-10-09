import { availableProtectedAreas } from '@/lib/sites/availableProtectedAreas';

const areas = [
  { id: 9, name: 'Lakeland' },
  { id: 10, name: 'Wainwright Dunes' },
];

describe('availableProtectedAreas', () => {
  it('hides a protected area that another site already uses', () => {
    const sites = [
      { id: 1, protected_area_id: 9 },
      { id: 2, protected_area_id: null },
    ];

    expect(availableProtectedAreas(areas, sites, null).map((area) => area.id)).toEqual([10]);
  });

  it('keeps the protected area that belongs to the site being edited', () => {
    const sites = [{ id: 1, protected_area_id: 9 }];

    expect(availableProtectedAreas(areas, sites, 1).map((area) => area.id)).toEqual([9, 10]);
  });
});
