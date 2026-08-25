import type { Dictionary } from "@/i18n/dictionaries"

/**
 * English dictionary. Must stay structurally identical to zh.ts —
 * TypeScript reports any missing or extra key against the Dictionary type.
 */
export const en: Dictionary = {
  meta: {
    siteName: "Tinker",
    title: "Tinker · Developer Toolbox",
    titleTemplate: "%s · Tinker",
    description:
      "A set of lightweight, browser-only developer tools. No sign-up, no upload — everything runs locally in your browser.",
  },

  common: {
    copy: "Copy",
    copied: "Copied",
    copyFailed: "Copy failed — please select the text and copy manually",
    clear: "Clear",
    sample: "Sample",
    input: "Input",
    output: "Output",
    text: "Text",
    file: "File",
    selectFile: "Choose a file",
    localOnly: "Everything runs locally in your browser",
    download: "Download",
  },

  header: {
    allTools: "All tools",
    toggleTheme: "Toggle theme",
    theme: {
      light: "Light",
      dark: "Dark",
      system: "System",
    },
    language: "Language",
  },

  footer: {
    tagline: "Tinker · Lightweight, browser-only developer tools. No sign-up, just open and go.",
  },

  home: {
    title: "Developer Toolbox",
    subtitle: "A set of lightweight, browser-only developer tools.",
  },

  notFound: {
    message: "This page doesn't exist — the link may be wrong, or the tool may have been renamed.",
    backHome: "Back to all tools",
  },

  explorer: {
    searchPlaceholder: "Search tools, e.g. jwt…",
    searchLabel: "Search tools",
    all: "All",
    empty: "No matching tools.",
    clearFilters: "Clear filters",
    recent: "Recently used",
    clearRecent: "Clear",
  },

  categories: {
    crypto: "Crypto & Security",
    encoding: "Encoding",
    format: "Formatting",
    generator: "Generators",
    datetime: "Date & Time",
    text: "Text",
  },

  tools: {
    jwt: {
      name: "JWT Toolkit",
      description:
        "Decode a JWT, verify its signature and claims, or sign a new one with your own key.",
      keywords: ["decode", "verify", "signature", "claims", "bearer"],
    },
    hash: {
      name: "Hash Calculator",
      description: "Compute MD5 / SHA-1 / SHA-256 / SHA-384 / SHA-512 digests of text or files.",
      keywords: ["digest", "fingerprint", "integrity"],
    },
    base64: {
      name: "Base64 Encoder",
      description: "Convert text, images and binary data to and from Base64 / Base64URL.",
      keywords: ["encode", "decode", "image", "binary", "data url"],
    },
    url: {
      name: "URL Encoder",
      description:
        "Convert percent-encoding both ways, and break a URL into its parts and query parameters.",
      keywords: ["escape", "unescape", "query string", "parameters", "parse"],
    },
    json: {
      name: "JSON Formatter",
      description: "Format, minify and validate JSON, with a tree view and path extraction.",
      keywords: ["pretty print", "prettify", "tree", "lint"],
    },
    color: {
      name: "Color Converter",
      description: "Convert between HEX / RGB / HSL / OKLCH, with a contrast checker.",
      keywords: ["convert", "palette", "accessibility", "a11y"],
    },
    generator: {
      name: "Random Generator",
      description:
        "Generate UUID v4 / v7 and NanoID in bulk, plus strong passwords with a custom character set.",
      keywords: ["identifier", "secret", "passphrase", "bulk"],
    },
    qrcode: {
      name: "QR Code Generator",
      description: "Turn text, links or Wi-Fi credentials into a downloadable QR code.",
      keywords: ["barcode"],
    },
    timestamp: {
      name: "Timestamp Converter",
      description: "Convert Unix timestamps and dates both ways, with a time zone comparison.",
      keywords: ["date", "time zone", "convert"],
    },
    regex: {
      name: "Regex Tester",
      description: "Live match highlighting, capture groups and a common-pattern cheat sheet.",
      keywords: ["test", "capture group", "cheat sheet"],
    },
    diff: {
      name: "Text Diff",
      description: "Compare two blocks of text line by line or character by character.",
      keywords: ["difference", "changes"],
    },
  },

  errors: {
    base64: {
      empty: "Enter some Base64 text",
      illegalChars: "Contains characters that aren't valid Base64",
      invalid: "Can't decode — this isn't valid Base64",
    },
    color: {
      empty: "Enter a color",
      hexLength: "Wrong HEX length — expected 3, 4, 6 or 8 digits",
      rgbParts: "rgb() needs at least 3 components",
      rgbValues: "Can't read the rgb() components",
      hslParts: "hsl() needs at least 3 components",
      hslValues: "Can't read the hsl() components",
      oklchParts: "oklch() needs at least 3 components",
      oklchValues: "Can't read the oklch() components",
      unknownFormat: "Unrecognized color format — HEX / RGB / HSL / OKLCH are supported",
    },
    timestamp: {
      empty: "Enter a timestamp or date",
      outOfRange: "Number is outside the representable range",
      unrecognized: "Unrecognized date format",
    },
    json: {
      trailingContent: "Unexpected trailing content: “{text}”",
      minusNeedsDigit: "A minus sign must be followed by a digit",
      unrecognizedChar: "Unexpected character “{char}”",
      expectColon: "Expected “:”",
      expectCommaOrBrace: "Expected “,” or “}”",
      expectKey: "Expected an object key",
      expectCommaOrBracket: "Expected “,” or “]”",
      unterminatedString: "Unterminated string",
      badUnicodeEscape: "Invalid \\u escape",
      badNumber: "Invalid number “{text}”",
      native: "{message}",
      position: "near line {line}, column {column}",
    },
    url: {
      empty: "Enter a URL",
      unparsable: "Can't parse this — check that it's a valid URL",
      strayPercent: "The % at character {position} isn't followed by two hex digits",
      badUtf8: "The percent-encoded bytes aren't valid UTF-8",
    },
    jwt: {
      empty: "Enter a JWT.",
      jwe: "This is a JWE (an encrypted token, 5 segments). This tool only handles JWS-form JWTs (3 segments).",
      segmentCount: "A JWT should have 3 segments separated by “.” — this one has {count}.",
      notObject: "This segment isn't a JSON object",
      secretRequired: "Enter a key",
      badBase64Secret: "Not a valid Base64 / Base64URL string",
      badHex: "Not a valid hexadecimal string",
      jwkNotJson: "The JWK isn't valid JSON",
      jwkSymmetric: "This is a symmetric key (oct) — switch to an HS algorithm",
      pkcs1Unsupported:
        "PKCS#1 isn't supported yet — convert it to PKCS#8 (-----BEGIN PRIVATE KEY-----)",
      unknownKeyFormatVerify:
        "Unrecognized key format — paste an SPKI public key (-----BEGIN PUBLIC KEY-----), an X.509 certificate, or a JWK",
      unknownKeyFormatSign:
        "Unrecognized key format — paste a PKCS#8 private key (-----BEGIN PRIVATE KEY-----) or a JWK",
      signatureMismatch: "Signature verification failed: the key doesn't match this token.",
      jwsInvalid: "Malformed token — it can't be parsed as a JWS.",
      algMismatch: "The algorithm in the token header doesn't match the one selected.",
      algUnsupported: "This browser or these parameters don't support that algorithm: {message}",
      jwkInvalid: "Invalid JWK: {message}",
      native: "{message}",
      headerPrefix: "Couldn't parse the header: {message}",
      payloadPrefix: "Couldn't parse the payload: {message}",
    },
  },

  hashTool: {
    inputHint: "Text or a file — everything is computed locally",
    textLabel: "Text to hash",
    textPlaceholder: "Enter the text you want to hash",
    resultTitle: "Digests",
    busy: "Computing…",
    resultHint: "The same data under several common digest algorithms",
    waiting: "Hashes update as you type",
    emptyState: "Enter text or choose a file on the left.",
  },

  jsonTool: {
    inputHint: "Paste or type JSON — JS object literal syntax works too",
    inputFooter:
      "Lenient mode: single quotes, unquoted keys, trailing commas, and // or /* comments are all accepted",
    inputLabel: "JSON input",
    viewText: "Text",
    viewTree: "Tree",
    pretty: "Pretty",
    minified: "Minified",
    waiting: "Waiting for input",
    valid: "Valid JSON",
    invalid: "Invalid JSON — check the input",
    emptyState: "Paste or type JSON on the left…",
    pathCopied: "Copied path {path}",
  },

  colorTool: {
    inputHint: "Any of HEX / RGB / HSL / OKLCH",
    pickerLabel: "Color picker",
    textLabel: "Color value",
    outputHint: "The same color in several common notations",
    waiting: "Converts as you type",
    emptyState: "Enter a color on the left.",
    contrastTitle: "Contrast check",
    contrastHint: "WCAG 2 contrast — check whether your text color is legible on its background",
    background: "Background",
    backgroundPickerLabel: "Background color picker",
    ratio: "contrast",
    needForeground: "Enter a valid text color above first.",
    normalAa: "Normal text AA",
    normalAaa: "Normal text AAA",
    largeAa: "Large text AA",
    largeAaa: "Large text AAA",
    pass: "Pass",
    fail: "Fail",
    requirement: "needs ≥ {threshold}",
  },

  base64Tool: {
    encode: "Encode",
    decode: "Decode",
    inputHint: "Text or a file — everything stays on your machine",
    encodeTextLabel: "Text to encode",
    encodeTextPlaceholder: "Enter the text you want to encode",
    outputHint: "Encoded output",
    encodeEmptyState: "Enter text or choose a file on the left.",
    decodeInputHint: "Paste Base64 — both the standard and URL-safe alphabets are recognized",
    decodeInputFooter: "You can paste a prefixed string like data:image/png;base64,... directly",
    decodeTextLabel: "Base64 to decode",
    decodeWaiting: "Decodes as you type",
    decodeFailed: "Decoding failed",
    detectedImage: "Detected an image",
    decodedAsText: "Decoded as UTF-8 text",
    notDisplayable: "Not displayable text",
    decodeEmptyState: "Paste Base64 text on the left.",
    imageAlt: "Preview of the decoded image",
    imageMeta: "{mime} · {bytes} bytes",
    binaryNote:
      "Decoded {bytes} bytes of binary data, which isn't displayable text — use Download in the top right.",
  },

  jsonTree: {
    expand: "Expand",
    collapse: "Collapse",
    copyPath: "Copy path",
    copyPathTitle: "Click to copy path {path}",
    itemCount: { one: "{count} item", other: "{count} items" },
  },

  generatorTool: {
    tabs: { uuid: "UUID / NanoID", password: "Passwords" },
    settingsTitle: "Settings",
    resultTitle: "Results",
    resultCount: "{count} total",
    copyAll: "Copy all",
    regenerate: "Regenerate",
    generating: "Generating…",

    uuid: {
      settingsHint: "Pick a type and how many",
      typeLabel: "Type",
      types: {
        v4: "UUID v4 (random)",
        v7: "UUID v7 (sortable)",
        nanoid: "NanoID",
      },
      countLabel: "Count",
      countRange: "1–200",
      uppercase: "Uppercase",
      keepDashes: "Keep hyphens",
    },

    password: {
      settingsHint: "Pick a length and character set",
      lengthLabel: "Length",
      lengthRange: "4–128 characters",
      countLabel: "How many",
      charsets: {
        uppercase: "Uppercase",
        lowercase: "Lowercase",
        numbers: "Digits",
        symbols: "Symbols",
      },
      excludeAmbiguous: "Exclude look-alike characters",
      needCharset: "Select at least one character type",
      strengthPrefix: "Estimated strength: ",
      strengthDetail: " (~{bits} bits of entropy, {pool}-character pool)",
      strength: {
        weak: "Weak",
        medium: "Medium",
        strong: "Strong",
        veryStrong: "Very strong",
      },
    },
  },

  jwtTool: {
    tabs: { decode: "Decode", verify: "Verify", sign: "Sign" },

    algorithmGroups: {
      hmac: "HMAC (shared secret)",
      rsa: "RSA (key pair)",
      rsaPss: "RSA-PSS (key pair)",
      ecdsa: "ECDSA (key pair)",
      eddsa: "EdDSA (key pair)",
    },
    secretEncodings: {
      utf8: "UTF-8 text",
      base64url: "Base64 / Base64URL",
      hex: "Hexadecimal",
    },

    claims: {
      iss: "Issuer",
      sub: "Subject",
      aud: "Audience",
      exp: "Expiration time",
      nbf: "Not valid before",
      iat: "Issued at",
      jti: "JWT ID",
    },
    headers: {
      alg: "Signing algorithm",
      typ: "Token type",
      cty: "Content type",
      kid: "Key ID",
      jku: "JWK Set URL",
      x5t: "Certificate thumbprint",
    },

    decode: {
      sample: "Sample",
      placeholder: "Paste a JWT like eyJhbGciOi…",
      parseFailed: "Can't parse this",
      algNoneTitle: "alg is none",
      algNoneBody:
        "This token has no signature protection — anyone can forge it. Always reject this algorithm in production.",
      resultTitle: "Decoded",
      goVerify: "Verify the signature",
      headerHint: "Describes the signing algorithm and key",
      noStandardFields: "No registered fields",
      payloadHint: "The claims it carries",
      viewJson: "JSON",
      viewDetail: "Details",
      detailNote: "Time-based claims are converted to your local time automatically.",
      signatureHint:
        "The raw Base64URL. Decoding does not verify the signature — use a key on the Verify tab.",
      emptySignature: "(no signature)",
      noClaims: "This payload has no claims.",
      expiredSuffix: " · expired",
      invalidTime: "Invalid date",
    },

    key: {
      secretLabel: "Shared secret",
      publicLabel: "Public key / certificate",
      privateLabel: "Private key",
      encodingLabel: "Secret encoding",
      secretPlaceholder: "your-256-bit-secret",
      publicPlaceholder:
        "-----BEGIN PUBLIC KEY-----\n…\n-----END PUBLIC KEY-----\n\nA JWK or X.509 certificate works too",
      privatePlaceholder:
        "-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----\n\nA JWK (PKCS#8) works too",
      secretNote: "HMAC uses the same key to sign and verify — keep it secret.",
      publicNote:
        "Accepts SPKI public keys (-----BEGIN PUBLIC KEY-----), X.509 certificates and JWKs.",
      privateNote: "Accepts PKCS#8 private keys (-----BEGIN PRIVATE KEY-----) and JWKs.",
      algorithmLabel: "Signing algorithm",
    },

    verify: {
      needToken: "Enter the JWT you want to verify.",
      needSecret: "Enter a key and verification starts automatically.",
      placeholder: "Paste the JWT to verify",
      keyTitle: "Verification key",
      keyHint: "Pick an algorithm and supply the key used to verify the signature",
      algMismatchNotice:
        "Heads up: the token header declares {tokenAlg}, which doesn't match the selected {alg} — verification will always fail.",
      expectedAlg: "Expected algorithm",
      resultTitle: "Result",
      claimsTitle: "Claim checks (optional)",
      claimsHint:
        "Checks beyond the signature: validity is always checked; issuer and audience only when filled in",
      expectedIss: "Expected issuer (iss)",
      expectedAud: "Expected audience (aud)",
      tolerance: "Clock tolerance (seconds)",
      verifying: "Verifying…",
      failedTitle: "Signature verification failed",
      validTitle: "Signature is valid",
      validButClaims:
        "The key matches the signature, but not every claim check below passed — a server would still reject this token.",
      validAll: "The key matches the signature and every claim check passed.",
      checks: {
        exp: "Expiration (exp)",
        nbf: "Not before (nbf)",
        iss: "Issuer (iss)",
        aud: "Audience (aud)",
      },
      details: {
        time: "{time} ({relative})",
        expired: "{time} ({relative}) · token has expired",
        notYet: "{time} ({relative}) · not valid yet",
        expNotSet: "Not set — this token never expires",
        issMatch: "Matches the expected value: {expected}",
        issMismatch: "Expected {expected}, got {actual}",
        audMatch: "Contains the expected value: {expected}",
        audMismatch: "Expected to contain {expected}, got {actual}",
      },
    },

    sign: {
      payloadNotObject: "The payload must be a JSON object",
      jsonSyntaxError: "JSON syntax error: {message}",
      secretGenerated: "Generated a random 256-bit secret",
      keyPairGenerated: "Generated an {alg} key pair",
      tokenGenerated: "Token generated",
      keyTitle: "Signing key",
      keyHint: "Pick an algorithm, then generate or paste the key used to sign",
      randomSecret: "Random secret",
      generateKeyPair: "Generate key pair",
      publicKeyLabel: "Matching public key (for verification)",
      payloadHint: "The claims written into the token",
      reset: "Reset",
      autoClaimsNote:
        "iat and exp are written automatically by the switches below — no need to add them here.",
      kidLabel: "Key ID (kid, optional)",
      kidPlaceholder: "kid to write into the header",
      expLabel: "Expires in",
      expPlaceholder: "2h / 7d / 30m — leave empty for no exp",
      iatLabel: "Issued at (iat)",
      iatNote: "Set to the current time",
      generate: "Generate token",
      cryptoNote:
        "Signing uses the browser's built-in Web Crypto — your key never leaves the page.",
      failedTitle: "Signing failed",
      resultTitle: "Result",
      resultHint: "The signed token — open it straight away in Decode or Verify",
      openInDecode: "Open in Decode",
      finalPayload: "Payload as written",
    },

    preview: {
      editLabel: "Edit JWT",
      noSignature: "(unsigned)",
    },
  },

  timestampTool: {
    inputHint: "A timestamp or a date string — the format is detected automatically",
    now: "Now",
    inputFooter:
      "Bare numbers are read as seconds / milliseconds / microseconds / nanoseconds by digit count; anything else is parsed as a date string such as ISO 8601 or RFC 2822",
    inputLabel: "Timestamp or date",
    resultTitle: "Converted",
    waiting: "Converts as you type",
    resultHint: "The same instant in several common notations",
    emptyState: "Enter a timestamp or date on the left.",
    unixSeconds: "Unix timestamp (seconds)",
    unixMillis: "Unix timestamp (milliseconds)",
    iso: "ISO 8601 (UTC)",
    rfc2822: "RFC 2822 (UTC)",
    localTime: "Local time ({zone})",
    relative: "Relative to now",
    timezoneTitle: "Time zones",
    timezoneHint: "The same instant as local time elsewhere",
    localZone: "Local · {zone}",
    timezones: {
      UTC: "UTC",
      "America/Los_Angeles": "Los Angeles",
      "America/New_York": "New York",
      "Europe/London": "London",
      "Europe/Paris": "Paris",
      "Asia/Dubai": "Dubai",
      "Asia/Kolkata": "New Delhi",
      "Asia/Shanghai": "Beijing / Shanghai",
      "Asia/Tokyo": "Tokyo",
      "Australia/Sydney": "Sydney",
    },
  },

  urlTool: {
    encode: "Encode",
    decode: "Decode",
    parse: "Parse",
    variantComponent: "Parameter value",
    variantUri: "Whole URL",
    variantHintComponent:
      "encodeURIComponent: also encodes / ? & = # — use this for a query parameter value",
    variantHintUri:
      "encodeURI: keeps the URL's structural characters, encoding only spaces, non-ASCII and the like",
    encodeInputHint: "Raw text",
    encodeTextLabel: "Text to encode",
    encodeTextPlaceholder: "héllo & spaces / special chars",
    encodeOutputHint: "Percent-encoded output",
    encodeEmptyState: "Enter the text you want to encode on the left.",
    decodeInputHint: "Paste percent-encoded text",
    decodeTextLabel: "Text to decode",
    plusAsSpace: "+ means space",
    plusFooter:
      "In a query string, + means a space (form-urlencoded); in a path, + is a literal plus sign",
    decodeWaiting: "Decodes as you type",
    decodeResult: "Decoded output",
    decodeFailed: "Decoding failed",
    decodeEmptyState: "Paste the encoded text on the left.",
    parseInputTitle: "URL",
    parseInputHint:
      "A full link, a protocol-less example.com/x, or a relative path like /api?x=1 all work",
    parseInputLabel: "URL to parse",
    parsePlaceholder: "https://user@api.example.com:8443/v1/search?q=café&page=2#result",
    inferredProtocol: "No protocol given — parsed as https://.",
    relativePath: "Relative path — only the path, query string and fragment are parsed.",
    partsTitle: "Parts",
    partsHint: "Click an icon to copy that value",
    paramsTitle: "Query parameters",
    paramsHint: "{count} found, decoded",
    noParamsHint: "No query parameters",
    noParams: "This URL has no query parameters.",
    repeated: "repeated",
    emptyValue: "(empty)",
    parts: {
      protocol: "Protocol",
      username: "Username",
      password: "Password",
      hostname: "Host",
      port: "Port",
      origin: "Origin",
      pathname: "Path",
      pathnameDecoded: "Path (decoded)",
      search: "Query string",
      hash: "Fragment",
      href: "Normalized",
    },
  },
}
