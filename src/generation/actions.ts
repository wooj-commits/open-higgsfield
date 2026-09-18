"use server";

import { UnauthorizedError, requireSession } from "@/auth/guard";

import { getModel, parseSettings } from "./catalog";
import type { GenerationPlane } from "./catalog/types";
import { MissingCredentialsError } from "./credentials";
import { generationIsReady, readGenerationEnv } from "./env";
import { createPlatformClient } from "./platform";
import type { StatusResult } from "./platform";
import { toPlatform } from "./to-platform";

export async function getStudioStatus() {
  await requireSession();
  const generation = readGenerationEnv();
  return {
    generationReady: !("missing" in generation),
    missingGeneration: "missing" in generation ? generation.missing : [],
    uploads: process.env.OPEN_HIGGSFIELD_READ_WRITE_TOKEN?.trim() ? "blob" : "local",
  };
}

export async function hasGenerationConfig() {
  try {
    await requireSession();
  } catch (error) {
    if (error instanceof UnauthorizedError) return false;
    throw error;
  }
  return generationIsReady();
}

export async function submitGeneration(plane: GenerationPlane) {
  await requireSession();
  const model = getModel(plane.model);
  const parsed: GenerationPlane = {
    ...plane,
    settings: parseSettings(model, plane.settings),
  };
  const { path, body } = toPlatform(parsed);
  return createPlatformClient(readCredentials()).submit(path, body);
}

/** Every request in flight, answered in one round trip. Next dispatches server
    actions one at a time per client, so a poll per run would queue ahead of the
    next submit — the fan-out belongs on this side of the call, where it is
    genuinely parallel. */
export async function getGenerationStatuses(data: unknown): Promise<StatusResult[]> {
  await requireSession();
  const requestIds = parseRequestIds(data);
  const client = createPlatformClient(readCredentials());
  return Promise.all(
    requestIds.map(async (requestId): Promise<StatusResult> => {
      try {
        return { requestId, status: await client.status(requestId) };
      } catch (caught) {
        return { requestId, error: caught instanceof Error ? caught.message : String(caught) };
      }
    }),
  );
}

function readCredentials() {
  const env = readGenerationEnv();
  if ("missing" in env) {
    throw new MissingCredentialsError(
      `Missing ${env.missing.join(", ")}. Set them in the environment — generation stays off until they are present.`,
    );
  }
  return env;
}

function parseRequestIds(data: unknown): string[] {
  const payload = asObject(data, "Invalid status payload");
  const requestIds = payload.requestIds;
  if (!Array.isArray(requestIds) || requestIds.length === 0) {
    throw new Error("Invalid request ids");
  }
  return requestIds.map((requestId) => {
    if (typeof requestId !== "string" || !requestId) throw new Error("Invalid request id");
    return requestId;
  });
}

function asObject(data: unknown, message: string): Record<string, unknown> {
  if (data === null || typeof data !== "object" || Array.isArray(data)) throw new Error(message);
  return data as Record<string, unknown>;
}
