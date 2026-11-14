// Donor screening rules and configuration
export const DEFAULT_DONOR_RULES = {
  minWeightKg: 50,
  minHemoglobinGdl: 13.0,
  minAgeYears: 18,
  maxAgeYears: 65,
  screeningDisclaimer:
    'Initial donor screening values are configurable guidelines to help assess preliminary eligibility. Final donor eligibility is strictly determined on-site by qualified medical professionals in accordance with local healthcare regulations and standard clinical screening protocols.'
};

export const COUNTRY_CODES = [
  { code: '+91', country: 'IN', label: 'India (+91)' },
  { code: '+1', country: 'US/CA', label: 'USA / Canada (+1)' },
  { code: '+44', country: 'UK', label: 'UK (+44)' },
  { code: '+61', country: 'AU', label: 'Australia (+61)' },
  { code: '+971', country: 'AE', label: 'UAE (+971)' },
  { code: '+65', country: 'SG', label: 'Singapore (+65)' },
  { code: '+49', country: 'DE', label: 'Germany (+49)' },
];

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
