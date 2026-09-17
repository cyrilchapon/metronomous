import { Atom, atom, WritableAtom } from 'jotai'
import { atomWithStorage, RESET } from 'jotai/utils'
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
 * Reads and writes exactly like the `atom<T>()` it replaces — `focusAtom`
 * included — with one move of its own: writing jotai's `RESET` to it drops
 * the stored config. That *removes* the key rather than storing today's
 * defaults in it, so a config that has been reset goes on following the
 * defaults as they change, exactly like one that was never stored.
 */
export type PersistedConfigAtom<T> = WritableAtom<
  T,
  [SetStateAction<T> | typeof RESET],
  void
> & {
  /**
   * Whether anything is stored under this config's key — which is a
   * different question from whether its values differ from the defaults,
   * and the one a reset is actually about. A key that happens to hold
   * today's defaults still pins its user to them, and a key whose every
   * field is unreadable still decodes to them; comparing values would
   * call both "nothing to reset" and leave them stuck that way.
   */
  storedAtom: Atom<boolean>
}

/**
 * A config atom backed by `localStorage`: hydrated on the way in, written
 * through to storage on every change, and resettable with `RESET`.
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
 * field's default. Every such fallback but "nothing stored" is reported on
 * the console, since it is the only way settings quietly disappear.
 */
export const persistedConfigAtom = <T extends object>({
  key,
  version,
  defaults,
  schema,
  migrations = {},
}: PersistedConfigOptions<T>): PersistedConfigAtom<T> => {
  const storageKey = `${storageKeyPrefix}${key}`

  /**
   * Falling back is by design, but it is also the only way a user silently
   * loses settings they had, so it says so out loud — in production too,
   * where it's the one thing that makes "my settings reset themselves"
   * diagnosable from a console. The cache below means a given stored value
   * is only ever decoded, and so reported, once.
   */
  const fallBack = (reason: string): T => {
    console.warn(
      `[metronomous] Ignoring the stored "${storageKey}" config (${reason}). Falling back to its defaults.`
    )
    return defaults
  }

  /**
   * What a *newer* build wrote and this one has no schema for, kept aside
   * with the version it came with. `migrate` already lets the read path
   * tolerate a config from the future; this is what stops the write path
   * from truncating it on the way back out — and from stamping a lower
   * version on it, which would make that newer build replay its migrations
   * over a config that had already been through them.
   */
  let ahead: { version: number; fields: Record<string, unknown> } | null = null

  /**
   * The stored keys this build has no schema for. Only ever kept when they
   * come from a newer version: from an equal or older one they are fields
   * this build has *dropped*, and re-emitting those would keep them alive
   * forever.
   */
  const foreignFields = (storedConfig: unknown): Record<string, unknown> =>
    typeof storedConfig !== 'object' || storedConfig === null
      ? {}
      : Object.fromEntries(
          Object.entries(storedConfig).filter(([field]) => !(field in defaults))
        )

  /**
   * The *known* fields the schema had to fall back on. A stored key that
   * isn't a config field at all is one this build has dropped, which is
   * business as usual rather than something to report — see `configSchema`.
   */
  const unreadableFields = (storedConfig: unknown, readable: Partial<T>) =>
    typeof storedConfig !== 'object' || storedConfig === null
      ? []
      : Object.keys(storedConfig).filter(
          (field) => field in defaults && !(field in readable)
        )

  const decode = (raw: string | null): T => {
    ahead = null

    // Not a failure: nothing was ever stored (a first visit, or a config
    // just reset).
    if (raw === null) {
      return defaults
    }

    let json: unknown

    try {
      json = JSON.parse(raw)
    } catch {
      return fallBack('not JSON')
    }

    const stored = storedConfigSchema.safeParse(json)

    if (!stored.success) {
      return fallBack('not a stored config')
    }

    const migrated = migrate(
      stored.data.version,
      stored.data.config,
      version,
      migrations
    )

    if (migrated === null) {
      return fallBack(`no migration from version ${stored.data.version}`)
    }

    const parsed = schema.safeParse(migrated.config)

    // Only a config that isn't an object at all gets here: every *field*
    // carries its own fallback.
    if (!parsed.success) {
      return fallBack('not an object')
    }

    if (stored.data.version > version) {
      ahead = {
        version: stored.data.version,
        fields: foreignFields(migrated.config),
      }
    }

    const readable = readableFields(parsed.data)
    const unreadable = unreadableFields(migrated.config, readable)

    if (unreadable.length > 0) {
      console.warn(
        `[metronomous] Ignoring unreadable fields of the stored "${storageKey}" config (${unreadable.join(', ')}). Falling back to their defaults.`
      )
    }

    return { ...defaults, ...readable }
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

  /**
   * A same-tab write doesn't fire a `storage` event, so the presence atom
   * below would miss every write this tab makes. `setItem`/`removeItem`
   * announce their own.
   */
  const storedListeners = new Set<() => void>()
  const announceStored = () => {
    storedListeners.forEach((listener) => listener())
  }

  const storedBaseAtom = atom(readRaw(storageKey) !== null)

  storedBaseAtom.onMount = (setStored) => {
    const refresh = () => setStored(readRaw(storageKey) !== null)

    // Storage can have moved between this atom's creation — module
    // evaluation — and whenever something first reads it.
    refresh()

    storedListeners.add(refresh)
    // Deliberately unfiltered: `refresh` re-reads this config's own key, so
    // an event about another one just resolves to the same boolean.
    window.addEventListener('storage', refresh)

    return () => {
      storedListeners.delete(refresh)
      window.removeEventListener('storage', refresh)
    }
  }

  const configAtom = atomWithStorage<T>(
    storageKey,
    defaults,
    {
      getItem: (key) => decodeCached(readRaw(key)),
      setItem: (key, config) => {
        // Whatever a newer build had in there goes back in, under the
        // version it came with — see `ahead`.
        const raw = JSON.stringify(
          ahead === null
            ? { version, config }
            : { version: ahead.version, config: { ...ahead.fields, ...config } }
        )

        cache = { raw, config }
        writeRaw(key, raw)
        announceStored()
      },
      removeItem: (key) => {
        cache = null
        ahead = null
        removeRaw(key)
        announceStored()
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

  return Object.assign(configAtom, {
    // Read-only from the outside: it reflects storage, it doesn't drive it.
    storedAtom: atom((get) => get(storedBaseAtom)),
  })
}
