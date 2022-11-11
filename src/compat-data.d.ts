// Auto-generated from https://github.com/mdn/browser-compat-data/blob/main/schemas/compat-data.schema.json
// then fixed manually.
//
//   npx json-schema-to-typescript -i compat-data.schema.json -o compat-data.d.ts --unreachableDefinitions

export type BrowserName = string;

export type VersionValue = string;

/**
 * This interface was referenced by `CompatDataFile`'s JSON-Schema definition
 * via the `patternProperty` "^(?!__compat)(?!webextensions)[a-zA-Z_0-9-$@]*$".
 *
 * This interface was referenced by `CompatDataFile`'s JSON-Schema
 * via the `definition` "identifier".
 */
export type Identifier = { [key: string]: Identifier } & {
  __compat?: CompatStatement;
};

/**
 * This interface was referenced by `CompatDataFile`'s JSON-Schema definition
 * via the `patternProperty` "^webextensions*$".
 */
export type WebextensionsIdentifier = Identifier;

/**
 * This interface was referenced by `CompatDataFile`'s JSON-Schema
 * via the `definition` "support_statement".
 */
export type SupportStatement =
  | SimpleSupportStatement
  | SimpleSupportStatement[];
/**
 * The data for the support of each browser, containing a `support_statement` object for each browser identifier with information about versions, prefixes, or alternate names, as well as notes.
 */
export type SupportBlock = Partial<Record<BrowserName, SupportStatement>>;
/**
 * This interface was referenced by `CompatDataFile`'s JSON-Schema
 * via the `definition` "spec_url_value".
 */
export type SpecUrlValue = string;
/**
 * This interface was referenced by `CompatDataFile`'s JSON-Schema
 * via the `definition` "impl_url_value".
 */
export type ImplUrlValue = string;

export interface CompatDataFile {}

/**
 * This interface was referenced by `CompatDataFile`'s JSON-Schema definition
 * via the `patternProperty` "^__compat$".
 *
 * This interface was referenced by `CompatDataFile`'s JSON-Schema
 * via the `definition` "compat_statement".
 */
export interface CompatStatement {
  /**
   * A string containing a human-readable description of the feature.
   */
  description?: string;
  /**
   * A URL that points to an MDN reference page documenting the feature. The URL should be language-agnostic.
   */
  mdn_url?: string;
  /**
   * An optional URL or array of URLs, each of which is for a specific part of a specification in which this feature is defined. Each URL must contain a fragment identifier.
   */
  spec_url?: string | string[];
  /**
   * The path to the file that defines this feature in browser-compat-data, relative to the repository root. Useful for guiding potential contributors towards the correct file to edit. This is automatically generated at build time and should never manually be specified.
   */
  source_file?: string;
  support: SupportBlock;
  status?: StatusBlock;
}

/**
 * This interface was referenced by `CompatDataFile`'s JSON-Schema
 * via the `definition` "simple_support_statement".
 */
export interface SimpleSupportStatement {
  /**
   * A string (indicating which browser version added this feature), the value true (indicating support added in an unknown version), the value false (indicating the feature is not supported), or the value null (indicating support is unknown).
   */
  version_added: VersionValue;
  /**
   * A string, indicating which browser version removed this feature, or the value true, indicating that the feature was removed in an unknown version.
   */
  version_removed?: VersionValue;
  /**
   * A prefix to add to the sub-feature name (defaults to empty string). If applicable, leading and trailing '-' must be included.
   */
  prefix?: string;
  /**
   * An alternative name for the feature, for cases where a feature is implemented under an entirely different name and not just prefixed.
   */
  alternative_name?: string;
  /**
   * An optional array of objects describing flags that must be configured for this browser to support this feature.
   *
   * @minItems 1
   */
  flags?: FlagStatement[];
  /**
   * An optional changeset/commit URL for the revision which implemented the feature in the source code, or the URL to the bug tracking the implementation, for the associated browser.
   */
  impl_url?: string | string[];
  /**
   * A boolean value indicating whether or not the implementation of the sub-feature deviates from the specification in a way that may cause compatibility problems. It defaults to false (no interoperability problems expected). If set to true, it is recommended that you add a note explaining how it diverges from the standard (such as that it implements an old version of the standard, for example).
   */
  partial_implementation?: true;
  /**
   * A string or array of strings containing additional information.
   */
  notes?: string | string[];
}
/**
 * This interface was referenced by `CompatDataFile`'s JSON-Schema
 * via the `definition` "flag_statement".
 */
export interface FlagStatement {
  /**
   * An enum that indicates the flag type.
   */
  type: "preference" | "runtime_flag";
  /**
   * A string giving the name of the flag or preference that must be configured.
   */
  name: string;
  /**
   * A string giving the value which the specified flag must be set to for this feature to work.
   */
  value_to_set?: string;
}

/**
 * An object containing information about the stability of the feature.
 */
export interface StatusBlock {
  /**
   * A boolean value that indicates whether this functionality is intended to be an addition to the Web platform. Set to false, it means the functionality is mature, and no significant incompatible changes are expected in the future.
   */
  experimental: boolean;
  /**
   * A boolean value indicating whether the feature is part of an active specification or specification process.
   */
  standard_track: boolean;
  /**
   * A boolean value that indicates whether the feature is no longer recommended. It might be removed in the future or might only be kept for compatibility purposes. Avoid using this functionality.
   */
  deprecated: boolean;
}
