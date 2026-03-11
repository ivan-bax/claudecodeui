/**
 * Environment Flag: Is Platform
 * Indicates if the app is running in Platform mode (hosted) or OSS mode (self-hosted)
 */
export const IS_PLATFORM = process.env.VITE_IS_PLATFORM === 'true';

/**
 * Environment Flag: Teleport Auth
 * When true, the X-Teleport-Username header is trusted for authentication.
 * Users are auto-created with auth_method='teleport' (no password).
 */
export const TELEPORT_AUTH = process.env.TELEPORT_AUTH === 'true';