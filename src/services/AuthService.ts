import { postJson } from '../api/http';
import type {
  AuthenticationResponse,
  MessageResponse,
  TwoFactorResendRequest,
  TwoFactorVerifyRequest,
} from '../features/auth/types';
import { requireApiBaseUrl } from './_serviceUtils';

export const verify = async (data: TwoFactorVerifyRequest): Promise<AuthenticationResponse> => {
  const baseURL = requireApiBaseUrl();
  return postJson<TwoFactorVerifyRequest, AuthenticationResponse>(baseURL, '/auth/2fa/verify', data);
};

export const resend = async (data: TwoFactorResendRequest): Promise<MessageResponse> => {
  const baseURL = requireApiBaseUrl();
  return postJson<TwoFactorResendRequest, MessageResponse>(baseURL, '/auth/2fa/resend', data);
};

