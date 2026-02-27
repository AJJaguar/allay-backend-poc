/**
 * Nigeria-specific validation utilities
 */

export const validateNIN = (nin: string): boolean => {
  // NIN must be exactly 11 digits
  const ninRegex = /^\d{11}$/;
  return ninRegex.test(nin);
};

export const validatePhoneNumber = (phone: string): boolean => {
  // Accept formats: +2348012345678 or 08012345678
  const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
  return phoneRegex.test(phone);
};

export const normalizePhoneNumber = (phone: string): string => {
  // Convert to standard format: +234...
  if (phone.startsWith('0')) {
    return '+234' + phone.slice(1);
  }
  if (phone.startsWith('234')) {
    return '+' + phone;
  }
  return phone;
};

export const validateKAROTANumber = (karotaNumber: string): boolean => {
  // KAROTA format: KRT-STATE-YEAR-NUMBER
  // Example: KRT-LAG-2024-001
  const karotaRegex = /^KRT-[A-Z]{3}-\d{4}-\d{3,}$/;
  return karotaRegex.test(karotaNumber);
};

export const validateCACNumber = (cacNumber: string): boolean => {
  // CAC number format varies, but typically alphanumeric 6-10 characters
  const cacRegex = /^[A-Z0-9]{6,10}$/;
  return cacRegex.test(cacNumber);
};

export const nigerianStates = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
];

export const validateState = (state: string): boolean => {
  return nigerianStates.includes(state);
};
