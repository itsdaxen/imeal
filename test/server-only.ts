// `server-only` throws when bundled for the browser, which is the point of it in the
// app. Under Vitest there is no such bundle, so it resolves to nothing rather than
// forcing server modules to drop a marker that protects them in production.
export {};
