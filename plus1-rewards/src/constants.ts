import { PlanCategory } from './types';

export const FEATURE_KEYS = [
  'doctors',
  'specialist',
  'meds_acute',
  'meds_chronic',
  'meds_combined',
  'radiology',
  'pathology',
  'dentistry',
  'optometry',
  'out_of_area',
  'hospital_illness',
  'accident',
  'funeral',
  'emergency'
];

export const FEATURE_DESCRIPTIONS: Record<string, string> = {
  doctors: "Consultations available via a registered Day1 Health Network Provider. Limited to 5 doctor visits per member per annum. A Pay-as-you-Go Virtual Doctor consultation platform is available for members to utilise thereafter. Pre-authorisation is required. A 1 month waiting period applies.",
  specialist: "Specialist Benefit of up to R 1 000 per family per annum. Subject to pre-authorisation and referral from a Day1 Health Network GP. A 3 month waiting period applies.",
  meds_acute: "Acute medication is covered according to the Day1 Health formulary. A 1 month waiting period applies.",
  meds_chronic: "Chronic Medication is limited to R500 per member per month and up to R6000 per member per annum. A 3 month waiting period applies on chronic medication for unknown conditions and a 12 month waiting period on pre-existing conditions. All chronic medication is subject to pre-authorisation.",
  meds_combined: "Chronic medication covered according to the 1Doctor Health formulary. A 3 month waiting period applies on chronic medication for unknown conditions and 12 months waiting period on pre-existing conditions. (All chronic medication is subject to pre-authorisation. An additional administration fee may be levied on all approved chronic medication.)",
  radiology: "Basic radiology according to the Day1 Health formulary via a Day1 Health network GP. Black and white diagnostic x-rays only. A 1 month waiting period applies.",
  pathology: "Basic diagnostic blood tests on referral by a Day1 Health Network GP and subject to a list of basic pathology tests approved by Day1 Health. A 1 month waiting period applies.",
  dentistry: "Basic treatment includes preventative cleaning, fillings, extractions and emergency pain and sepsis control via a Day1 Health Network Dentist. 2 visits per member per annum. Pre-authorisation is required for each visit. A 3 month waiting period applies.",
  optometry: "One eye test and one set of glasses every 24 months per the specific Iso Leso Optics agreed protocol range. A 12 month waiting period applies.",
  out_of_area: "In the event that you cannot see your Network GP, the Plan will allow 3 \"out of area\" visits per family per annum to an alternative Network GP or GP of your choice, subject to pre-authorisation. A 1 month waiting period applies.",
  hospital_illness: "Covers up to R 10,000 after the first 24 Hours in hospital, up to R 10,000 for the second day in hospital, up to R10,000 for the third day in hospital. Thereafter R 2 000.00 per day up to a maximum of 21 days. A 3 month waiting period applies and a 12 month pre-existing conditions exclusion applies.",
  accident: "Up to R 250,000 per single member per incident and up to R 500,000 per family per incident. Immediate cover.",
  funeral: "Principal member & Spouse R 30,000, Child > 14 years R 10 000. Child > 6 years R 5,000. Child > 0 years > R 2,500. Stillborn > 28 weeks R1,250. A 3 month waiting period applies. (Benefit only available to Plan members.)",
  emergency: "24 Hour Emergency Services, Medical Assistance and Pre-Authorisation provided by Africa Assist. Immediate cover. Guaranteed private hospital admission with preference to all Life Healthcare, Mediclinic, Africa Health Care and Clinix hospitals."
};

export const WAITING_PERIODS: Record<string, string> = {
  doctors: "1 Month",
  specialist: "3 Months",
  meds_acute: "1 Month",
  meds_chronic: "3 - 12 Months",
  meds_combined: "3 - 12 Months",
  radiology: "1 Month",
  pathology: "1 Month",
  dentistry: "3 Months",
  optometry: "12 Months",
  out_of_area: "1 Month",
  hospital_illness: "3 - 12 Months",
  accident: "Immediate",
  funeral: "3 Months",
  emergency: "Immediate"
};

export const PLAN_CATEGORIES: PlanCategory[] = [
  {
    id: 'day-to-day',
    label: 'Day To Day',
    plans: [
      {
        id: 'dtd-single',
        name: 'Single',
        tagline: 'Basic Day to Day coverage',
        prices: { Single: 385, Couple: 674, Family: 867 },
        features: {
          doctors: { label: 'Doctor Visits', value: '5 visits/yr', isIncluded: true },
          specialist: { label: 'Specialist', value: 'R1,000/yr', isIncluded: true },
          meds_acute: { label: 'Acute Meds', value: 'Included', isIncluded: true },
          meds_chronic: { label: 'Chronic Meds', value: 'R500/mo', isIncluded: true },
          meds_combined: { label: 'Acute & Chronic', value: '❌', isIncluded: false },
          radiology: { label: 'Radiology', value: 'Basic', isIncluded: true },
          pathology: { label: 'Pathology', value: 'Basic', isIncluded: true },
          dentistry: { label: 'Dentistry', value: '2 visits/yr', isIncluded: true },
          optometry: { label: 'Optometry', value: 'Every 24mo', isIncluded: true },
          out_of_area: { label: 'Out-of-Area', value: '3 visits/yr', isIncluded: true },
          hospital_illness: { label: 'Hospital Illness', value: '❌', isIncluded: false },
          accident: { label: 'Accident', value: '❌', isIncluded: false },
          funeral: { label: 'Funeral', value: 'R20,000', isIncluded: true },
          emergency: { label: 'Emergency', value: '✅', isIncluded: true },
        }
      },
      {
        id: 'dtd-couple',
        name: 'Couple',
        tagline: 'Day to Day for two',
        prices: { Single: 674, Couple: 674, Family: 867 },
        features: {
          doctors: { label: 'Doctor Visits', value: '5 visits/yr', isIncluded: true },
          specialist: { label: 'Specialist', value: 'R1,000/yr', isIncluded: true },
          meds_acute: { label: 'Acute Meds', value: 'Included', isIncluded: true },
          meds_chronic: { label: 'Chronic Meds', value: 'R500/mo', isIncluded: true },
          meds_combined: { label: 'Acute & Chronic', value: '❌', isIncluded: false },
          radiology: { label: 'Radiology', value: 'Basic', isIncluded: true },
          pathology: { label: 'Pathology', value: 'Basic', isIncluded: true },
          dentistry: { label: 'Dentistry', value: '2 visits/yr', isIncluded: true },
          optometry: { label: 'Optometry', value: 'Every 24mo', isIncluded: true },
          out_of_area: { label: 'Out-of-Area', value: '3 visits/yr', isIncluded: true },
          hospital_illness: { label: 'Hospital Illness', value: '❌', isIncluded: false },
          accident: { label: 'Accident', value: '❌', isIncluded: false },
          funeral: { label: 'Funeral', value: 'R20,000', isIncluded: true },
          emergency: { label: 'Emergency', value: '✅', isIncluded: true },
        }
      },
      {
        id: 'dtd-family',
        name: 'Family',
        tagline: 'Full family Day to Day',
        prices: { Single: 867, Couple: 867, Family: 867 },
        features: {
          doctors: { label: 'Doctor Visits', value: '5 visits/yr', isIncluded: true, isBetter: true },
          specialist: { label: 'Specialist', value: 'R1,000/yr', isIncluded: true, isBetter: true },
          meds_acute: { label: 'Acute Meds', value: 'Included', isIncluded: true, isBetter: true },
          meds_chronic: { label: 'Chronic Meds', value: 'R500/mo', isIncluded: true, isBetter: true },
          meds_combined: { label: 'Acute & Chronic', value: '❌', isIncluded: false },
          radiology: { label: 'Radiology', value: 'Basic', isIncluded: true, isBetter: true },
          pathology: { label: 'Pathology', value: 'Basic', isIncluded: true, isBetter: true },
          dentistry: { label: 'Dentistry', value: '2 visits/yr', isIncluded: true, isBetter: true },
          optometry: { label: 'Optometry', value: 'Every 24mo', isIncluded: true, isBetter: true },
          out_of_area: { label: 'Out-of-Area', value: '3 visits/yr', isIncluded: true, isBetter: true },
          hospital_illness: { label: 'Hospital Illness', value: '❌', isIncluded: false },
          accident: { label: 'Accident', value: '❌', isIncluded: false },
          funeral: { label: 'Funeral', value: 'R20,000', isIncluded: true, isBetter: true },
          emergency: { label: 'Emergency', value: '✅', isIncluded: true, isBetter: true },
        }
      }
    ]
  },
  {
    id: 'hospital',
    label: 'Hospital',
    plans: [
      {
        id: 'v-plus-h',
        name: 'Value Plus',
        tagline: 'Essential hospital cover',
        prices: { Single: 390, Couple: 702, Family: 858 },
        features: {
          doctors: { label: 'Doctor Visits', value: '❌', isIncluded: false },
          specialist: { label: 'Specialist', value: '❌', isIncluded: false },
          meds_acute: { label: 'Acute Meds', value: '❌', isIncluded: false },
          meds_chronic: { label: 'Chronic Meds', value: '❌', isIncluded: false },
          meds_combined: { label: 'Acute & Chronic', value: '❌', isIncluded: false },
          radiology: { label: 'Radiology', value: '❌', isIncluded: false },
          pathology: { label: 'Pathology', value: '❌', isIncluded: false },
          dentistry: { label: 'Dentistry', value: '❌', isIncluded: false },
          optometry: { label: 'Optometry', value: '❌', isIncluded: false },
          out_of_area: { label: 'Out-of-Area', value: '❌', isIncluded: false },
          hospital_illness: { label: 'Hospital Illness', value: 'R10,000/day', isIncluded: true },
          accident: { label: 'Accident', value: 'R150,000', isIncluded: true },
          funeral: { label: 'Funeral', value: 'R20,000', isIncluded: true },
          emergency: { label: 'Emergency', value: '✅', isIncluded: true },
        }
      },
      {
        id: 'plat-h',
        name: 'Platinum',
        tagline: 'Enhanced hospital benefits',
        prices: { Single: 560, Couple: 1008, Family: 1232 },
        features: {
          doctors: { label: 'Doctor Visits', value: '❌', isIncluded: false },
          specialist: { label: 'Specialist', value: '❌', isIncluded: false },
          meds_acute: { label: 'Acute Meds', value: '❌', isIncluded: false },
          meds_chronic: { label: 'Chronic Meds', value: '❌', isIncluded: false },
          meds_combined: { label: 'Acute & Chronic', value: '❌', isIncluded: false },
          radiology: { label: 'Radiology', value: '❌', isIncluded: false },
          pathology: { label: 'Pathology', value: '❌', isIncluded: false },
          dentistry: { label: 'Dentistry', value: '❌', isIncluded: false },
          optometry: { label: 'Optometry', value: '❌', isIncluded: false },
          out_of_area: { label: 'Out-of-Area', value: '❌', isIncluded: false },
          hospital_illness: { label: 'Hospital Illness', value: 'R10,000/day', isIncluded: true },
          accident: { label: 'Accident', value: 'R150,000', isIncluded: true },
          funeral: { label: 'Funeral', value: 'R20,000', isIncluded: true },
          emergency: { label: 'Emergency', value: '✅', isIncluded: true },
        }
      },
      {
        id: 'exec-h',
        name: 'Executive',
        tagline: 'Premium hospital protection',
        prices: { Single: 640, Couple: 1152, Family: 1408 },
        features: {
          doctors: { label: 'Doctor Visits', value: '❌', isIncluded: false },
          specialist: { label: 'Specialist', value: '❌', isIncluded: false },
          meds_acute: { label: 'Acute Meds', value: '❌', isIncluded: false },
          meds_chronic: { label: 'Chronic Meds', value: '❌', isIncluded: false },
          meds_combined: { label: 'Acute & Chronic', value: '❌', isIncluded: false },
          radiology: { label: 'Radiology', value: '❌', isIncluded: false },
          pathology: { label: 'Pathology', value: '❌', isIncluded: false },
          dentistry: { label: 'Dentistry', value: '❌', isIncluded: false },
          optometry: { label: 'Optometry', value: '❌', isIncluded: false },
          out_of_area: { label: 'Out-of-Area', value: '❌', isIncluded: false },
          hospital_illness: { label: 'Hospital Illness', value: 'R10,000/day + R2,000/day', isIncluded: true, isBetter: true },
          accident: { label: 'Accident', value: 'R250,000', isIncluded: true, isBetter: true },
          funeral: { label: 'Funeral', value: 'R30,000', isIncluded: true, isBetter: true },
          emergency: { label: 'Emergency', value: '✅ Priority', isIncluded: true, isBetter: true },
        }
      }
    ]
  },
  {
    id: 'comprehensive',
    label: 'Comprehensive',
    plans: [
      {
        id: 'v-plus-c',
        name: 'Value Plus',
        tagline: 'Full Day to Day + Hospital',
        prices: { Single: 665, Couple: 1151, Family: 1417 },
        features: {
          doctors: { label: 'Doctor Visits', value: '5 visits/yr', isIncluded: true },
          specialist: { label: 'Specialist', value: 'R1,000/yr', isIncluded: true },
          meds_acute: { label: 'Acute Meds', value: '❌', isIncluded: false },
          meds_chronic: { label: 'Chronic Meds', value: '❌', isIncluded: false },
          meds_combined: { label: 'Acute & Chronic', value: 'Included', isIncluded: true },
          radiology: { label: 'Radiology', value: 'Basic', isIncluded: true },
          pathology: { label: 'Pathology', value: 'Basic', isIncluded: true },
          dentistry: { label: 'Dentistry', value: '2 visits/yr', isIncluded: true },
          optometry: { label: 'Optometry', value: 'Every 24mo', isIncluded: true },
          out_of_area: { label: 'Out-of-Area', value: '3 visits/yr', isIncluded: true },
          hospital_illness: { label: 'Hospital Illness', value: 'R10,000/day', isIncluded: true },
          accident: { label: 'Accident', value: 'R150,000', isIncluded: true },
          funeral: { label: 'Funeral', value: 'R20,000', isIncluded: true },
          emergency: { label: 'Emergency', value: '✅', isIncluded: true },
        }
      },
      {
        id: 'plat-c',
        name: 'Platinum',
        tagline: 'Superior combined benefits',
        prices: { Single: 896, Couple: 1611, Family: 1969 },
        features: {
          doctors: { label: 'Doctor Visits', value: '5 visits/yr', isIncluded: true },
          specialist: { label: 'Specialist', value: 'R1,000/yr', isIncluded: true },
          meds_acute: { label: 'Acute Meds', value: '❌', isIncluded: false },
          meds_chronic: { label: 'Chronic Meds', value: '❌', isIncluded: false },
          meds_combined: { label: 'Acute & Chronic', value: 'Included', isIncluded: true },
          radiology: { label: 'Radiology', value: 'Basic', isIncluded: true },
          pathology: { label: 'Pathology', value: 'Basic', isIncluded: true },
          dentistry: { label: 'Dentistry', value: '2 visits/yr', isIncluded: true },
          optometry: { label: 'Optometry', value: 'Every 24mo', isIncluded: true },
          out_of_area: { label: 'Out-of-Area', value: '3 visits/yr', isIncluded: true },
          hospital_illness: { label: 'Hospital Illness', value: 'R10,000/day', isIncluded: true },
          accident: { label: 'Accident', value: 'R150,000', isIncluded: true },
          funeral: { label: 'Funeral', value: 'R20,000', isIncluded: true },
          emergency: { label: 'Emergency', value: '✅', isIncluded: true },
        }
      },
      {
        id: 'exec-c',
        name: 'Executive',
        tagline: 'The ultimate health protection',
        prices: { Single: 985, Couple: 1724, Family: 2118 },
        features: {
          doctors: { label: 'Doctor Visits', value: '5 visits/yr + Virtual', isIncluded: true, isBetter: true },
          specialist: { label: 'Specialist', value: 'R1,000/yr', isIncluded: true, isBetter: true },
          meds_acute: { label: 'Acute Meds', value: '❌', isIncluded: false },
          meds_chronic: { label: 'Chronic Meds', value: '❌', isIncluded: false },
          meds_combined: { label: 'Acute & Chronic', value: 'Included', isIncluded: true, isBetter: true },
          radiology: { label: 'Radiology', value: 'Basic', isIncluded: true, isBetter: true },
          pathology: { label: 'Pathology', value: 'Basic', isIncluded: true, isBetter: true },
          dentistry: { label: 'Dentistry', value: '2 visits/yr', isIncluded: true, isBetter: true },
          optometry: { label: 'Optometry', value: 'Every 24mo', isIncluded: true, isBetter: true },
          out_of_area: { label: 'Out-of-Area', value: '3 visits/yr', isIncluded: true, isBetter: true },
          hospital_illness: { label: 'Hospital Illness', value: 'R10,000/day + R2,000/day', isIncluded: true, isBetter: true },
          accident: { label: 'Accident', value: 'R250,000', isIncluded: true, isBetter: true },
          funeral: { label: 'Funeral', value: 'R30,000', isIncluded: true, isBetter: true },
          emergency: { label: 'Emergency', value: '✅ Priority', isIncluded: true, isBetter: true },
        }
      }
    ]
  },
  {
    id: 'senior',
    label: 'Senior',
    plans: [
      {
        id: 'senior-dtd',
        name: 'Day to Day',
        tagline: 'Senior Day to Day focus',
        prices: { Single: 425, Couple: 850, Family: 850 },
        features: {
          doctors: { label: 'Doctor Visits', value: '5 visits/yr', isIncluded: true },
          specialist: { label: 'Specialist', value: '❌', isIncluded: false },
          meds_acute: { label: 'Acute Meds', value: 'Included', isIncluded: true },
          meds_chronic: { label: 'Chronic Meds', value: 'R500/mo', isIncluded: true },
          meds_combined: { label: 'Acute & Chronic', value: '❌', isIncluded: false },
          radiology: { label: 'Radiology', value: 'Basic', isIncluded: true },
          pathology: { label: 'Pathology', value: 'Basic', isIncluded: true },
          dentistry: { label: 'Dentistry', value: '2 visits/yr', isIncluded: true },
          optometry: { label: 'Optometry', value: 'Every 24mo', isIncluded: true },
          out_of_area: { label: 'Out-of-Area', value: '3 visits/yr', isIncluded: true },
          hospital_illness: { label: 'Hospital Illness', value: '❌', isIncluded: false },
          accident: { label: 'Accident', value: '❌', isIncluded: false },
          funeral: { label: 'Funeral', value: 'R5,000', isIncluded: true },
          emergency: { label: 'Emergency', value: '✅', isIncluded: true },
        }
      },
      {
        id: 'senior-h',
        name: 'Hospital',
        tagline: 'Senior hospital protection',
        prices: { Single: 425, Couple: 850, Family: 850 },
        features: {
          doctors: { label: 'Doctor Visits', value: '❌', isIncluded: false },
          specialist: { label: 'Specialist', value: '❌', isIncluded: false },
          meds_acute: { label: 'Acute Meds', value: '❌', isIncluded: false },
          meds_chronic: { label: 'Chronic Meds', value: '❌', isIncluded: false },
          meds_combined: { label: 'Acute & Chronic', value: '❌', isIncluded: false },
          radiology: { label: 'Radiology', value: '❌', isIncluded: false },
          pathology: { label: 'Pathology', value: '❌', isIncluded: false },
          dentistry: { label: 'Dentistry', value: '❌', isIncluded: false },
          optometry: { label: 'Optometry', value: '❌', isIncluded: false },
          out_of_area: { label: 'Out-of-Area', value: '❌', isIncluded: false },
          hospital_illness: { label: 'Hospital Illness', value: 'R10,000/day', isIncluded: true },
          accident: { label: 'Accident', value: 'R75,000', isIncluded: true },
          funeral: { label: 'Funeral', value: 'R5,000', isIncluded: true },
          emergency: { label: 'Emergency', value: '✅', isIncluded: true },
        }
      },
      {
        id: 'senior-c',
        name: 'Comprehensive',
        tagline: 'Full senior coverage',
        prices: { Single: 425, Couple: 850, Family: 850 },
        features: {
          doctors: { label: 'Doctor Visits', value: '5 visits/yr', isIncluded: true, isBetter: true },
          specialist: { label: 'Specialist', value: '❌', isIncluded: false },
          meds_acute: { label: 'Acute Meds', value: '❌', isIncluded: false },
          meds_chronic: { label: 'Chronic Meds', value: '❌', isIncluded: false },
          meds_combined: { label: 'Acute & Chronic', value: 'Included', isIncluded: true, isBetter: true },
          radiology: { label: 'Radiology', value: 'Basic', isIncluded: true, isBetter: true },
          pathology: { label: 'Pathology', value: 'Basic', isIncluded: true, isBetter: true },
          dentistry: { label: 'Dentistry', value: '2 visits/yr', isIncluded: true, isBetter: true },
          optometry: { label: 'Optometry', value: 'Every 24mo', isIncluded: true, isBetter: true },
          out_of_area: { label: 'Out-of-Area', value: '3 visits/yr', isIncluded: true, isBetter: true },
          hospital_illness: { label: 'Hospital Illness', value: 'R10,000/day', isIncluded: true, isBetter: true },
          accident: { label: 'Accident', value: 'R75,000', isIncluded: true, isBetter: true },
          funeral: { label: 'Funeral', value: 'R5,000', isIncluded: true, isBetter: true },
          emergency: { label: 'Emergency', value: '✅', isIncluded: true, isBetter: true },
        }
      }
    ]
  }
];
