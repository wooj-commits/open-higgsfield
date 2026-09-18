export class MissingCredentialsError extends Error {
  constructor(message = "Missing generation API configuration") {
    super(message);
    this.name = "MissingCredentialsError";
  }
}

export function requireIdAndSecret(apiKey: string): string {
  const colon = apiKey.indexOf(":");
  if (colon <= 0 || colon === apiKey.length - 1) {
    throw new Error("HF_API_KEY must be id:secret");
  }
  return apiKey;
}

export function toAuthorizationHeader(apiKey: string): string {
  return `Key ${requireIdAndSecret(apiKey)}`;
}
