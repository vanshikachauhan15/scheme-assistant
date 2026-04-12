/** Filter values sent to CSV logic (must stay ASCII / match dataset). */
export const FACET_ORDER = [
  'pension',
  'age',
  'income',
  'gender',
  'document',
  'schemeName',
  'benefit',
]

export const FACET_IDS = {
  pension: 'facet-pension',
  age: 'facet-age',
  income: 'facet-income',
  gender: 'facet-gender',
  document: 'facet-document',
  schemeName: 'facet-scheme-name',
  benefit: 'facet-benefit',
}

export const FACET_VALUES = {
  pension: ['', 'pension', 'retirement', 'old age', 'senior'],
  age: ['', '60', '18', 'student', 'child'],
  income: [
    '',
    'income',
    'BPL',
    'EWS',
    'income limit',
    'upto 3 lakh',
    '3 to 8 lakh',
    'above 8 lakh',
    'lakh',
  ],
  gender: ['', 'women', 'men'],
  document: ['', 'aadhaar', 'certificate', 'ration', 'application', 'bank'],
  schemeName: ['', 'PM-KISAN', 'Ayushman', 'PMAY', 'National', 'Scholarship', 'MGNREGA'],
  benefit: ['', 'scholarship', 'loan', 'subsidy', 'housing', 'insurance', 'pension', 'grant'],
}
