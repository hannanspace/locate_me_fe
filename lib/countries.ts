export const countries = [
  {
    name: 'Malaysia',
    code: 'MY',
    states: [
      'Johor',
      'Kedah',
      'Kelantan',
      'Malacca (Melaka)',
      'Negeri Sembilan',
      'Pahang',
      'Penang',
      'Perak',
      'Perlis',
      'Sabah',
      'Sarawak',
      'Selangor',
      'Terengganu',
      'Federal Territories',
    ],
  },
  {
    name: 'Singapore',
    code: 'SG',
    states: ['Singapore'],
  },
  {
    name: 'Brunei',
    code: 'BN',
    states: ['Brunei-Muara', 'Belait', 'Tutong', 'Temburong'],
  },
  {
    name: 'Thailand',
    code: 'TH',
    states: [
      'Bangkok',
      'Chiang Mai',
      'Chiang Rai',
      'Phuket',
      'Krabi',
      'Pattaya',
      'Other',
    ],
  },
  {
    name: 'Indonesia',
    code: 'ID',
    states: [
      'Bali',
      'Jakarta',
      'Bandung',
      'Surabaya',
      'Medan',
      'Yogyakarta',
      'Other',
    ],
  },
];

export const getStatesByCountry = (country: string): string[] => {
  const countryData = countries.find((c) => c.name === country);
  return countryData?.states || [];
};
