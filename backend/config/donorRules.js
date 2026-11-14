/**
 * Configurable Donor Pre-Screening Guidelines
 * Note: These values serve as initial digital screening thresholds.
 * Final medical eligibility is determined in person by qualified medical staff
 * in accordance with local health authority and blood bank regulations.
 */

const DONOR_SCREENING_RULES = {
  MIN_WEIGHT_KG: parseFloat(process.env.DONOR_MIN_WEIGHT_KG) || 50,
  MIN_HEMOGLOBIN_GDL: parseFloat(process.env.DONOR_MIN_HEMOGLOBIN_GDL) || 13.0,
  MIN_AGE_YEARS: parseInt(process.env.DONOR_MIN_AGE_YEARS, 10) || 18,
  MAX_AGE_YEARS: parseInt(process.env.DONOR_MAX_AGE_YEARS, 10) || 65,
  SCREENING_DISCLAIMER: "Preliminary self-screening only. Meeting these criteria does not constitute medical clearance. Final donor eligibility is evaluated and confirmed by licensed medical professionals at the time of donation."
};

module.exports = DONOR_SCREENING_RULES;
