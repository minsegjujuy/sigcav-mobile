import { HttpError, postJson } from './http';
import type { AuthenticationRequest, AuthenticationResponse } from '../features/auth/types';
export async function login(
  baseUrl: string,
  request: AuthenticationRequest
): Promise<AuthenticationResponse> {
  const normalized = baseUrl.replace(/\/+$/, '');
  const path = /\/api$/i.test(normalized)
    ? '/auth/login-mobile'
    : '/api/auth/login-mobile';

  const finalUrl = `${normalized}${path}`;

  console.log("=== LOGIN DEBUG START ===");
  console.log("BASE URL:", baseUrl);
  console.log("NORMALIZED:", normalized);
  console.log("PATH:", path);
  console.log("FINAL URL:", finalUrl);
  console.log("REQUEST BODY:", JSON.stringify(request));

  try {
    const response = await postJson<AuthenticationRequest, AuthenticationResponse>(
      baseUrl,
      path,
      request
    );

    console.log("LOGIN SUCCESS RESPONSE:", JSON.stringify(response));
    console.log("=== LOGIN DEBUG END ===");

    return response;

  } catch (e: any) {
    console.log("=== LOGIN ERROR ===");

    if (e instanceof HttpError) {
      console.log("HTTP ERROR STATUS:", e.status);
      console.log("HTTP ERROR MESSAGE:", e.message);
      console.log("HTTP ERROR BODY:", e.bodyText);
    } else {
      console.log("GENERIC ERROR:", e?.message || e);
    }

    console.log("STACK:", e?.stack);
    console.log("=== LOGIN DEBUG END ===");

    if (e instanceof HttpError && e.status === 405) {
      throw new Error(
        `${e.message}. Si la URL parece incorrecta, revisá EXPO_PUBLIC_API_URL y reiniciá Expo con cache clean.`
      );
    }

    throw e;
  }
}
