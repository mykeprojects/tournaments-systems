export interface CredentialLoginResponse {
  requiresTwoFactor: boolean;
  challengeToken?: string | null;
  expiresAt?: string | null;
  accessToken?: string | null;
  tokenType?: string | null;
  message?: string | null;
}
