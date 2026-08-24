/**
 * Countries and their administrative regions for the checkout address form.
 *
 * The form previously took State and Country as free text with US examples
 * ("NY", "United States") on a marketplace priced in INR, so a shipping label
 * could be filled in with anything at all. India is listed first and in full,
 * because that is where almost every order ships; other countries fall back to
 * a free-text region field rather than shipping a 4,000-row dataset for a
 * handful of orders.
 */

export interface Country {
    code: string;
    name: string;
    /** Dial code, used to prefill the phone field. */
    dial: string;
}

/** India first - the rest alphabetical. */
export const COUNTRIES: Country[] = [
    { code: "IN", name: "India", dial: "+91" },
    { code: "AE", name: "United Arab Emirates", dial: "+971" },
    { code: "AU", name: "Australia", dial: "+61" },
    { code: "BD", name: "Bangladesh", dial: "+880" },
    { code: "CA", name: "Canada", dial: "+1" },
    { code: "DE", name: "Germany", dial: "+49" },
    { code: "FR", name: "France", dial: "+33" },
    { code: "ID", name: "Indonesia", dial: "+62" },
    { code: "IE", name: "Ireland", dial: "+353" },
    { code: "IT", name: "Italy", dial: "+39" },
    { code: "JP", name: "Japan", dial: "+81" },
    { code: "LK", name: "Sri Lanka", dial: "+94" },
    { code: "MY", name: "Malaysia", dial: "+60" },
    { code: "NL", name: "Netherlands", dial: "+31" },
    { code: "NP", name: "Nepal", dial: "+977" },
    { code: "NZ", name: "New Zealand", dial: "+64" },
    { code: "QA", name: "Qatar", dial: "+974" },
    { code: "SA", name: "Saudi Arabia", dial: "+966" },
    { code: "SG", name: "Singapore", dial: "+65" },
    { code: "ZA", name: "South Africa", dial: "+27" },
    { code: "ES", name: "Spain", dial: "+34" },
    { code: "CH", name: "Switzerland", dial: "+41" },
    { code: "TH", name: "Thailand", dial: "+66" },
    { code: "GB", name: "United Kingdom", dial: "+44" },
    { code: "US", name: "United States", dial: "+1" },
];

/** All 28 states and 8 union territories. */
export const INDIAN_STATES: string[] = [
    "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam",
    "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
    "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
    "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

const US_STATES = [
    "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware",
    "Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky",
    "Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi",
    "Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico",
    "New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania",
    "Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
    "Virginia","Washington","West Virginia","Wisconsin","Wyoming",
];

const CA_PROVINCES = [
    "Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Labrador",
    "Northwest Territories","Nova Scotia","Nunavut","Ontario","Prince Edward Island",
    "Quebec","Saskatchewan","Yukon",
];

const AU_STATES = [
    "Australian Capital Territory","New South Wales","Northern Territory","Queensland",
    "South Australia","Tasmania","Victoria","Western Australia",
];

const REGIONS: Record<string, string[]> = {
    IN: INDIAN_STATES,
    US: US_STATES,
    CA: CA_PROVINCES,
    AU: AU_STATES,
};

/** Regions for a country, or an empty list meaning "accept free text". */
export function regionsFor(countryCode: string): string[] {
    return REGIONS[countryCode] || [];
}

/** What to call the region field in this country. */
export function regionLabel(countryCode: string): string {
    if (countryCode === "IN") return "State / UT";
    if (countryCode === "CA") return "Province";
    if (countryCode === "GB") return "County";
    return "State / Region";
}

/** What to call the postal code, and how to check it. */
export function postalRules(countryCode: string): { label: string; pattern?: RegExp; hint: string } {
    if (countryCode === "IN") return { label: "PIN code", pattern: /^[1-9][0-9]{5}$/, hint: "6 digits, e.g. 302001" };
    if (countryCode === "US") return { label: "ZIP code", pattern: /^\d{5}(-\d{4})?$/, hint: "5 digits" };
    if (countryCode === "GB") return { label: "Postcode", hint: "" };
    return { label: "Postal code", hint: "" };
}

export function countryByName(name: string): Country | undefined {
    return COUNTRIES.find((c) => c.name.toLowerCase() === (name || "").toLowerCase());
}
