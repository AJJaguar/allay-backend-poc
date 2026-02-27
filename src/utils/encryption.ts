import CryptoJS from 'crypto-js';

// const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';
// console.log(ENCRYPTION_KEY, 'ENCRYPTION_KEY');
// if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
//   throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
// }

export const encrypt = (text: string): string => {
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';
  if (!text) return '';
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

export const decrypt = (encryptedText: string): string => {
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';
  if (!encryptedText) return '';
  const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Encrypt sensitive member fields
export const encryptMemberData = (data: any) => {
  return {
    ...data,
    nin: data.nin ? encrypt(data.nin) : null,
    phoneNumber: data.phoneNumber ? encrypt(data.phoneNumber) : null,
    altPhoneNumber: data.altPhoneNumber ? encrypt(data.altPhoneNumber) : null,
    nokPhone: data.nokPhone ? encrypt(data.nokPhone) : null,
  };
};

// Decrypt sensitive member fields
export const decryptMemberData = (data: any) => {
  if (!data) return data;
  return {
    ...data,
    nin: data.nin ? decrypt(data.nin) : null,
    phoneNumber: data.phoneNumber ? decrypt(data.phoneNumber) : null,
    altPhoneNumber: data.altPhoneNumber ? decrypt(data.altPhoneNumber) : null,
    nokPhone: data.nokPhone ? decrypt(data.nokPhone) : null,
  };
};
