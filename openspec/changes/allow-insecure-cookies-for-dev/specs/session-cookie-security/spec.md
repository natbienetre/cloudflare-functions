## Purpose

Defines the security defaults for session cookies issued by the auto-session plugin, and the single explicit, opt-in mechanism a deployer has to relax those defaults for non-HTTPS environments.

## ADDED Requirements

### Requirement: Session cookies are Secure and HttpOnly by default
The system SHALL issue session cookies (on login and on logout) with the `Secure` and `HttpOnly` attributes set whenever the plugin is configured without an explicit opt-out, regardless of the request's scheme.

#### Scenario: Default configuration, login over HTTPS
- **WHEN** a caller's login handler resolves an authenticated session and the plugin was configured without `allowInsecureCookies`
- **THEN** the `Set-Cookie` header for the session cookie includes both `Secure` and `HttpOnly`

#### Scenario: Default configuration, login over plain HTTP
- **WHEN** a caller's login handler resolves an authenticated session for a request received over plain HTTP and the plugin was configured without `allowInsecureCookies`
- **THEN** the `Set-Cookie` header for the session cookie still includes both `Secure` and `HttpOnly`

#### Scenario: Default configuration, logout
- **WHEN** a session is ended and the plugin was configured without `allowInsecureCookies`
- **THEN** the cookie-clearing `Set-Cookie` header includes both `Secure` and `HttpOnly`

### Requirement: Insecure cookies require an explicit opt-in
The system SHALL only omit the `Secure` attribute from a session cookie when the plugin was explicitly configured with `allowInsecureCookies: true`. The system SHALL always keep `HttpOnly` set, even when `allowInsecureCookies: true`.

#### Scenario: Opt-in configuration, login over plain HTTP
- **WHEN** a caller's login handler resolves an authenticated session for a request received over plain HTTP and the plugin was configured with `allowInsecureCookies: true`
- **THEN** the `Set-Cookie` header for the session cookie omits `Secure` and still includes `HttpOnly`

#### Scenario: Opt-in configuration, logout
- **WHEN** a session is ended and the plugin was configured with `allowInsecureCookies: true`
- **THEN** the cookie-clearing `Set-Cookie` header omits `Secure` and still includes `HttpOnly`

#### Scenario: No implicit opt-in from the request scheme
- **WHEN** a request is received over plain HTTP and the plugin was configured without `allowInsecureCookies`
- **THEN** the system does not infer or default to omitting `Secure` based on the request's scheme alone
