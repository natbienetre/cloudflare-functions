## Purpose

Defines the security guarantees for cookies issued by the auto-session plugin: session cookies are always `Secure` and `HttpOnly`, and callers configuring a session have no way to weaken or opt out of this.

## ADDED Requirements

### Requirement: Session cookies are unconditionally Secure and HttpOnly
The system SHALL always issue session cookies (on login and on logout) with the `Secure` and `HttpOnly` attributes set, regardless of the request's scheme or any value supplied by the caller's session configuration.

#### Scenario: Login over HTTPS
- **WHEN** a caller's login handler resolves an authenticated session
- **THEN** the `Set-Cookie` header for the session cookie includes both `Secure` and `HttpOnly`

#### Scenario: Login over plain HTTP
- **WHEN** a caller's login handler resolves an authenticated session for a request received over plain HTTP
- **THEN** the `Set-Cookie` header for the session cookie still includes both `Secure` and `HttpOnly`, and the request is not rejected because of the scheme

#### Scenario: Logout
- **WHEN** a session is ended
- **THEN** the cookie-clearing `Set-Cookie` header includes both `Secure` and `HttpOnly`

### Requirement: Session configuration has no caller-controllable secure/httpOnly option
The system SHALL NOT expose a way for a caller's session configuration to request a non-secure or non-HTTP-only session cookie, and SHALL NOT reject a session configuration on the basis of a secure/httpOnly setting.

#### Scenario: Caller omits any secure/httpOnly setting
- **WHEN** a caller's session configuration includes only `data`, and optionally `domain`, `path`, `expires`, `maxAge`, or `sameSite`
- **THEN** the system issues the session cookie successfully with `Secure` and `HttpOnly` set

#### Scenario: No rejection path exists for insecure cookie requests
- **WHEN** a session is started
- **THEN** the system has no code path that inspects a secure/httpOnly setting on the session configuration and therefore never raises a "must be Secure and HttpOnly" error
