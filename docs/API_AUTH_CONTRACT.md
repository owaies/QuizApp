# QuizApp Authentication Contract

Protected QuizApp endpoints use a JWT passed in the HTTP `Authorization` header.

## Header shape

The accepted form is:

`Authorization: Bearer <jwt>`

The backend validates the header shape before calling `jwt.verify()` with the configured `JWT_SECRET`.

## Protected areas

Authentication is required for question retrieval, quiz submission, user administration, question administration, and settings access. Administrative routes add a role check after token verification.

## Error behavior

Clients should treat `401` as an authentication failure and `403` as an authorization failure. Do not build UI logic around raw server error strings.

## Maintenance

When adding a protected route, apply the existing authentication middleware first and keep role checks separate. Never accept a token from a query parameter or request body when the endpoint already follows the Authorization-header contract.
