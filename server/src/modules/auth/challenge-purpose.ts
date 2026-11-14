export const ChallengePurpose = {
  VERIFY_EMAIL: 'VERIFY_EMAIL',
  RESET_PASSWORD: 'RESET_PASSWORD',
  PHONE_LOGIN: 'PHONE_LOGIN',
  LINK_EMAIL: 'LINK_EMAIL',
  LINK_PHONE: 'LINK_PHONE',
} as const;

export type ChallengePurpose =
  (typeof ChallengePurpose)[keyof typeof ChallengePurpose];
