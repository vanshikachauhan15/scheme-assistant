import { FACET_VALUES } from './facetValues.js'

/**
 * When a popular topic is active, show only these facets (after State) and limit options.
 * Arrays must use exact values from `FACET_VALUES`.
 */
export const TOPIC_FACET_LAYOUT = {
  Housing: {
    facets: ['schemeName', 'benefit', 'income', 'document', 'age'],
    optionSubset: {
      schemeName: ['', 'PMAY', 'National'],
      benefit: ['', 'housing', 'subsidy', 'loan', 'grant', 'insurance', 'pension'],
      income: ['', 'BPL', 'EWS', 'income limit', 'upto 3 lakh', '3 to 8 lakh', 'above 8 lakh', 'lakh', 'income'],
      document: ['', 'aadhaar', 'certificate', 'ration', 'application', 'bank'],
      age: ['', '60', '18', 'student', 'child'],
    },
  },
  Agriculture: {
    facets: ['schemeName', 'benefit', 'income', 'document', 'age'],
    optionSubset: {
      schemeName: ['', 'PM-KISAN', 'MGNREGA', 'National'],
      benefit: ['', 'subsidy', 'loan', 'grant', 'pension', 'insurance'],
      income: ['', 'BPL', 'EWS', 'income limit', 'upto 3 lakh', '3 to 8 lakh', 'above 8 lakh', 'lakh', 'income'],
      document: ['', 'aadhaar', 'certificate', 'ration', 'application', 'bank'],
      age: ['', '18', 'student', 'child', '60'],
    },
  },
  Health: {
    facets: ['schemeName', 'benefit', 'age', 'income', 'document'],
    optionSubset: {
      schemeName: ['', 'Ayushman', 'National'],
      benefit: ['', 'insurance', 'subsidy', 'pension', 'grant', 'housing'],
      age: ['', '60', '18', 'child', 'student'],
      income: ['', 'BPL', 'EWS', 'income limit', 'upto 3 lakh', '3 to 8 lakh', 'above 8 lakh', 'lakh', 'income'],
      document: ['', 'aadhaar', 'certificate', 'ration', 'application', 'bank'],
    },
  },
  Education: {
    facets: ['schemeName', 'benefit', 'age', 'document', 'income'],
    optionSubset: {
      schemeName: ['', 'Scholarship', 'National'],
      benefit: ['', 'scholarship', 'grant', 'loan', 'subsidy'],
      age: ['', 'student', 'child', '18', '60'],
      document: ['', 'aadhaar', 'certificate', 'application', 'bank', 'ration'],
      income: ['', 'BPL', 'EWS', 'income limit', 'upto 3 lakh', '3 to 8 lakh', 'above 8 lakh', 'lakh', 'income'],
    },
  },
  Women: {
    facets: ['gender', 'benefit', 'schemeName', 'income', 'document', 'age'],
    optionSubset: {
      gender: ['', 'women', 'men'],
      benefit: ['', 'scholarship', 'housing', 'subsidy', 'loan', 'grant', 'insurance', 'pension'],
      schemeName: ['', 'National', 'PMAY', 'Ayushman', 'Scholarship'],
      income: ['', 'BPL', 'EWS', 'income limit', 'upto 3 lakh', '3 to 8 lakh', 'above 8 lakh', 'lakh', 'income'],
      document: ['', 'aadhaar', 'certificate', 'ration', 'application', 'bank'],
      age: ['', '18', 'student', 'child', '60'],
    },
  },
  Student: {
    facets: ['age', 'benefit', 'schemeName', 'document', 'income'],
    optionSubset: {
      age: ['', 'student', 'child', '18', '60'],
      benefit: ['', 'scholarship', 'loan', 'grant', 'subsidy'],
      schemeName: ['', 'Scholarship', 'National'],
      document: ['', 'aadhaar', 'certificate', 'application', 'bank', 'ration'],
      income: ['', 'BPL', 'EWS', 'income limit', 'upto 3 lakh', '3 to 8 lakh', 'above 8 lakh', 'lakh', 'income'],
    },
  },
}

/**
 * @param {string | null} topicKey
 * @returns {string[]}
 */
export function facetOrderForTopic(topicKey) {
  if (!topicKey || !TOPIC_FACET_LAYOUT[topicKey]) return null
  return TOPIC_FACET_LAYOUT[topicKey].facets
}

/**
 * @param {string | null} topicKey
 * @param {string} facetKey
 * @returns {string[]}
 */
export function facetValuesForTopic(topicKey, facetKey) {
  const all = FACET_VALUES[facetKey]
  if (!topicKey || !TOPIC_FACET_LAYOUT[topicKey]) return all
  const allowed = TOPIC_FACET_LAYOUT[topicKey].optionSubset?.[facetKey]
  if (!allowed) return all
  return allowed.filter((v) => all.includes(v))
}
