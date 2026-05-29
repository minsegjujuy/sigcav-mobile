export interface AuthenticationRequest {
  username: string;
  password: string;
}

export interface AuthenticationResponse {
  jwt: string;
  requiresTwoFactor: boolean;
  challengeId: string;
  message: string;
}

export interface TwoFactorVerifyRequest {
  challengeId: string;
  code: string;
}

export interface TwoFactorResendRequest {
  challengeId: string;
}

export interface MessageResponse {
  message: string;
  challengeId: string;
}
