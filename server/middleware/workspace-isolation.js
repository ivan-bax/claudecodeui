import path from 'path';
import { promises as fs } from 'fs';
import { TELEPORT_AUTH, PROJECTS_PATH } from '../constants/config.js';

/**
 * Check whether per-user workspace isolation is active.
 */
export function isIsolationActive() {
  return TELEPORT_AUTH && !!PROJECTS_PATH;
}

/**
 * Returns the workspace root for a given user, e.g. PROJECTS_PATH/<username>.
 * Returns null if isolation is not active.
 */
export function getUserWorkspaceRoot(username) {
  if (!isIsolationActive() || !username) return null;
  return path.join(PROJECTS_PATH, username);
}

/**
 * Validate that a requested path falls within the user's workspace.
 * When isolation is not active, all paths are allowed.
 *
 * @param {string} requestedPath - The path to validate
 * @param {string} username - The authenticated username
 * @returns {Promise<{valid: boolean, resolvedPath?: string, error?: string}>}
 */
export async function validateUserPath(requestedPath, username) {
  if (!isIsolationActive()) {
    return { valid: true, resolvedPath: path.resolve(requestedPath) };
  }

  if (!username) {
    return { valid: false, error: 'Username is required for workspace isolation' };
  }

  if (!requestedPath) {
    return { valid: false, error: 'Path is required' };
  }

  const userRoot = getUserWorkspaceRoot(username);

  try {
    // Resolve to absolute path (normalizes ../ sequences)
    const absolutePath = path.resolve(requestedPath);

    // Try to resolve real path (following symlinks)
    let realPath;
    try {
      await fs.access(absolutePath);
      realPath = await fs.realpath(absolutePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Path doesn't exist yet — resolve parent to follow symlinks there
        const parentPath = path.dirname(absolutePath);
        try {
          const parentRealPath = await fs.realpath(parentPath);
          realPath = path.join(parentRealPath, path.basename(absolutePath));
        } catch (parentError) {
          if (parentError.code === 'ENOENT') {
            // Parent doesn't exist either — use the absolute path as-is
            realPath = absolutePath;
          } else {
            throw parentError;
          }
        }
      } else {
        throw error;
      }
    }

    // Check the resolved path is within the user's workspace
    if (realPath === userRoot || realPath.startsWith(userRoot + path.sep)) {
      return { valid: true, resolvedPath: realPath };
    }

    return {
      valid: false,
      error: `Path is outside your workspace: ${userRoot}`
    };
  } catch (error) {
    return {
      valid: false,
      error: `Path validation failed: ${error.message}`
    };
  }
}

/**
 * Ensure the user's workspace directory exists.
 * No-op if isolation is not active.
 */
export async function ensureUserWorkspace(username) {
  if (!isIsolationActive() || !username) return;

  const userRoot = getUserWorkspaceRoot(username);
  try {
    await fs.mkdir(userRoot, { recursive: true });
  } catch (error) {
    console.error(`[Workspace] Failed to create workspace for ${username}:`, error.message);
    throw error;
  }
}
