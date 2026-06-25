import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  qrCodeUrl: string;
}

/**
 * Generates a 2FA secret and the corresponding QR code URL (base64 data URI)
 */
export async function generate2FASecret(username: string, schoolName: string): Promise<TwoFactorSetup> {
  const secret = generateSecret();
  const issuer = schoolName.replace(/[^a-zA-Z0-9 ]/g, ''); // alphanumeric only for URL safety
  const otpauthUrl = generateURI({ secret, label: username, issuer });
  const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

  return {
    secret,
    otpauthUrl,
    qrCodeUrl,
  };
}

/**
 * Verifies a 6-digit TOTP code against a secret
 */
export function verify2FACode(code: string, secret: string): boolean {
  try {
    const result = verifySync({ token: code, secret, epochTolerance: 30 });
    return !!result.valid;
  } catch (error) {
    return false;
  }
}
