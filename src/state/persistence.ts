import { atom, WritableAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { SetStateAction } from 'react'
import { z } from 'zod'

/**
 * Every config gets its own `localStorage` key, so that one unreadable
 * config falls back to its defaults on its own instead of taking the
 * others down with it.
 */
const storageKeyPrefix = 'metronomous:'

/**
 * What a config looks like on disk: the config itself, next to the version
 * of the shape it was written against — which is what lets `decode` know
 * which migrations are still owed to it.
 */
const storedConfigSchema = z.object({
  version: z.number().int().nonnegative(),
  config: z.unknown(),
})

/**
 * The schema for one config field, validating whatever `JSON.parse`
 * produced — hence the `unknown` input.
 */
export type ConfigFieldSchema<Value> = z.ZodType<Value, unknown>

/**
 * A schema per field of `T`. Declared as an object literal `satisfies
 * ConfigShape<T>`, it is the one place where a config's runtime type and
 * its validation can't drift apart: a field of `T` with no schema, a
 * schema for a field that no longer exists, and a schema for the wrong
 * type all fail to compile.
 */
export type ConfigShape<T> = { [K in keyof T]-?: ConfigFieldSchema<T[K]> }

/**
 * A config shape as `z.object` wants it. Not `z.ZodRawShape`, whose values
 * are core schemas without the `.optional()` / `.catch()` builders.
 */
type ConfigRawShape = Record<string, z.ZodType>

type LenientShape<Shape extends ConfigRawShape> = {
  [K in keyof Shape]: z.ZodCatch<z.ZodOptional<Shape[K]>>
}

/**
 * Turns a config shape into an object schema in which every field
 * independently falls back to "absent", which `persistedConfigAtom` then
 * fills back in from the defaults. That is what makes most future shape
 * changes free: a field that didn't exist when the config was written, one
 * that has since been dropped, and one whose valid values changed all cost
 * their own default rather than the whole config.
 *
 * Unknown fields being dropped is the other half of the same bargain — a
 * config written by a *newer* build is read for whatever the two builds
 * still have in common.
 */
export const configSchema = <Shape extends ConfigRawShape>(shape: Shape) =>
  z.object(
    Object.fromEntries(
      Object.entries(shape).map(([field, fieldSchema]) => [
        field,
        fieldSchema.optional().catch(undefined),
      ])
    ) as LenientShape<Shape>
  )

/**
 * A field that `configSchema` fell back on is left *present* and
 * `undefined` by zod, which would shadow the default it is meant to fall
 * back to when the two are merged. Dropping those keys is what makes the
 * merge in `persistedConfigAtom` mean "the defaults, overridden by the
 * fields that were actually readable".
 */
const readableFields = <T extends object>(config: Partial<T>): Partial<T> =>
  Object.fromEntries(
    Object.entries(config).filter(([, value]) => value !== undefined)
  ) as Partial<T>

/**
 * Rewrites a config written against version `n` into the shape of version
 * `n + 1`, keyed by `n` in `ConfigMigrations`.
 *
 * Only changes that field-level validation can't absorb on its own need
 * one — a renamed field, a change of unit, a value whose *meaning* changed
 * while its type stayed valid. Adding, removing or re-typing a field
 * doesn't: see `configSchema`.
 */
export type ConfigMigration = (config: unknown) => unknown
export type ConfigMigrations = Record<number, ConfigMigration | undefined>

/**
 * Brings a stored config up to the current version, one migration at a
 * time. Returns `null` when it can't, which the caller reads as "fall back
 * to the defaults".
 */
const migrate = (
  storedVersion: number,
  storedConfig: unknown,
  version: number,
  migrations: ConfigMigrations
): { config: unknown } | null => {
  // Written by a newer build than this one: we can't know what it did, but
  // every field this build still recognizes is validated individually
  // anyway, so read it for what the two versions have in common instead of
  // throwing the config away. That way a user who lands on an older build
  // (a stale tab, a rollback) doesn't lose their settings.
  if (storedVersion >= version) {
    return { config: storedConfig }
  }

  let config = storedConfig

  for (let from = storedVersion; from < version; from++) {
    const migration = migrations[from]

    // A gap in the chain — a version bumped without its migration. The
    // defaults are the only safe answer.
    if (migration === undefined) {
      return null
    }

    config = migration(config)
  }

  return { config }
}

/**
 * `localStorage` isn't always reachable: a browser configured to deny site
 * data throws on the very first access, and a full quota throws on write.
 * Persistence is a convenience here, so every access is best-effort — a
 * failure costs the user their saved settings, not the app.
 */
const readRaw = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key)
  } catch {
    // Storage denied.
    return null
  }
}

const writeRaw = (key: string, raw: string) => {
  try {
    window.localStorage.setItem(key, raw)
  } catch {
    // Storage denied, or out of quota.
  }
}

const removeRaw = (key: string) => {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Storage denied.
  }
}

export type PersistedConfigOptions<T extends object> = {
  /** Namespaced under `metronomous:`. */
  key: string
  /**
   * The version of the config's *shape*. Only ever bumped together with a
   * migration from the version before it — see `ConfigMigration`.
   */
  version: number
  /** Used for a config that was never stored, and per missing field. */
  defaults: T
  /** Built with `configSchema` from a `ConfigShape<T>`. */
  schema: z.ZodType<Partial<NoInfer<T>>, unknown>
  migrations?: ConfigMigrations
}

/**
 * A config atom backed by `localStorage`: reads and writes exactly like the
 * `atom<T>()` it replaces (`focusAtom` included), and writes through to
 * storage on every change.
 *
 * **It hydrates synchronously, at module evaluation** — `localStorage` is a
 * synchronous API, so the stored config is already in the atom before
 * React renders its first frame, and nothing needs to be gated behind a
 * loading state to avoid painting the defaults first. That also holds for
 * the pre-render reads in `main.tsx`.
 *
 * Anything that can go wrong with a stored config — absent, not JSON, not
 * a config at all, written by a version we can't migrate from — resolves
 * to the defaults; anything wrong with a single *field* resolves to that
 * field's default.
 */
export const persistedConfigAtom = <T extends object>({
  key,
  version,
  defaults,
  schema,
  migrations = {},
}: PersistedConfigOptions<T>): WritableAtom<T, [SetStateAction<T>], void> => {
  const decode = (raw: string | null): T => {
    if (raw === null) {
      return defaults
    }

    let json: unknown

    try {
      json = JSON.parse(raw)
    } catch {
      return defaults
    }

    const stored = storedConfigSchema.safeParse(json)

    if (!stored.success) {
      return defaults
    }

    const migrated = migrate(
      stored.data.version,
      stored.data.config,
      version,
      migrations
    )

    if (migrated === null) {
      return defaults
    }

    const parsed = schema.safeParse(migrated.config)

    // Only a config that isn't an object at all gets here: every *field*
    // carries its own fallback.
    if (!parsed.success) {
      return defaults
    }

    return { ...defaults, ...readableFields(parsed.data) }
  }

  // `atomWithStorage` decodes a second time when the atom mounts, and a
  // `storage` event can report a write that changed nothing. Decoding
  // builds a fresh object every time, which would invalidate every
  // consumer's memo for no reason, so identical bytes keep resolving to
  // the same object.
  let cache: { raw: string | null; config: T } | null = null

  const decodeCached = (raw: string | null): T => {
    if (cache !== null && cache.raw === raw) {
      return cache.config
    }

    const config = decode(raw)
    cache = { raw, config }

    return config
  }

  const storedAtom = atomWithStorage<T>(
    `${storageKeyPrefix}${key}`,
    defaults,
    {
      getItem: (key) => decodeCached(readRaw(key)),
      setItem: (key, config) => {
        const raw = JSON.stringify({ version, config })
        cache = { raw, config }
        writeRaw(key, raw)
      },
      removeItem: (key) => {
        cache = null
        removeRaw(key)
      },
      subscribe: (key, callback) => {
        const onStorage = (event: StorageEvent) => {
          // `event.key` is `null` for a `clear()`. Either way the value is
          // re-read from storage rather than taken off the event, so a
          // spurious event just re-decodes the same bytes.
          if (event.key !== null && event.key !== key) {
            return
          }

          callback(decodeCached(readRaw(key)))
        }

        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
      },
    },
    // The whole point: no first frame against the defaults.
    { getOnInit: true }
  )

  // Re-exposed without `atomWithStorage`'s `RESET` in its write signature,
  // so that a persisted config is a drop-in for the plain atom it replaces
  // (`focusAtom` only accepts the plain one) — nothing in the app resets a
  // config, and writing `defaults` does the same thing anyway.
  return atom(
    (get) => get(storedAtom),
    (_get, set, update: SetStateAction<T>) => {
      set(storedAtom, update)
    }
  )
}
