# Quiz Workflow Regression Checklist

Use this checklist before merging changes to authentication, quiz delivery, answer submission, or scoring. Run checks from a clean checkout and record any skipped environment-dependent steps.

## Automated checks

From the repository root:

```bash
node --test frontend/api-base.test.cjs
```

The frontend API-origin check does not replace backend or browser testing. Install backend dependencies and configure a disposable test database before running any additional integration checks.

## Authentication and sessions

- [ ] Valid credentials create a session/token and reach the expected authenticated page.
- [ ] Incorrect credentials are rejected without revealing whether an account exists.
- [ ] Signup rejects malformed email shapes such as `user@`, `@example.com`, embedded whitespace, and addresses without a dotted domain.
- [ ] Signup accepts a conventional address such as `user@example.com` and trims surrounding whitespace before validation.
- [ ] Missing, malformed, and expired credentials are rejected by protected endpoints.
- [ ] Logging out invalidates the client session and protected views no longer render as authenticated.
- [ ] User A cannot read or change User B's profile, quizzes, or submissions by changing an identifier.

## Quiz attempt and submission

- [ ] A quiz with valid questions loads and displays the expected number of questions.
- [ ] Empty, missing, and malformed answer payloads are handled with a clear validation response.
- [ ] A submission references an existing quiz and only accepts answer identifiers belonging to that quiz.
- [ ] Repeated submission follows the product's intended retry policy and does not silently double-count results.
- [ ] The displayed score matches the server-calculated score for all-correct, all-incorrect, and partially correct attempts.
- [ ] A client cannot set its own score, result owner, or privileged submission status.

## API and deployment configuration

- [ ] Same-origin frontend requests work when no API override is configured.
- [ ] A configured public API origin works when the frontend and API are hosted separately.
- [ ] Browser configuration contains no database URI, signing secret, or other server-only credential.
- [ ] Invalid request bodies return controlled client errors rather than stack traces.
- [ ] CORS permits only the intended frontend origins when cross-origin access is enabled.

## Release record

Record the commit under test, commands run, test results, database/environment assumptions, and any known limitations in the pull request. Do not use real user accounts or production data for manual regression checks.
