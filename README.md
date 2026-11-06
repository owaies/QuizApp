# QuizApp

QuizApp is a full-stack quiz application with a Node.js/Express backend, MongoDB persistence, session/JWT authentication, and a browser-based quiz client.

## Repository layout

- `backend/` - Express API, authentication, quiz and submission services.
- `QuizApp/` - application/client assets.
- `docs/` - development and regression documentation.
- `.env.example` - safe environment-variable template.

## Local setup

1. Install a current LTS version of Node.js.
2. Install backend dependencies:

   ```bash
   cd backend
   npm install
   ```

3. Copy the root environment template and provide local development values:

   ```bash
   cp .env.example .env
   ```

4. Start the API:

   ```bash
   npm start
   ```

The backend package currently uses Express, Mongoose, dotenv, authentication middleware, and session support. MongoDB must be reachable through the connection settings supplied in the environment.

The browser client uses the same origin for API requests by default. When hosting the frontend separately from the API, set `window.QUIZ_API_BASE` to the API origin before loading `frontend/script.js`. Keep this value as a public URL only; never place credentials or server secrets in browser configuration.

Run the API-base configuration regression checks from the repository root with `node --test frontend/api-base.test.cjs`. Run backend validation checks from `backend/` with `npm run test:validation`.

## Development notes

- Keep credentials and connection strings out of Git. Use `.env.example` for variable names and safe placeholders.
- Run the submission regression checklist in `docs/` after changing answer or scoring logic.
- Preserve the existing authentication and authorization boundaries when adding quiz or administration endpoints.

## Authentication input limits

Login passwords are validated against bcrypt's 72-byte UTF-8 input limit before password comparison. This is a byte limit, not a character-count limit: some multi-byte characters consume more than one byte. Registration and login use the same bcrypt boundary, and the validation regression suite covers both ASCII and multi-byte inputs.

## Security

Environment files containing real credentials must remain untracked. Passwords should be handled through the existing password-hashing flow, and authentication changes should be tested against both successful and rejected requests.


## Random question selection

When a positive `questionLimit` is configured for a non-admin quiz session, the API selects a unique random subset with the Fisher-Yates shuffle. The selection is made on a copy, so sampling does not reorder the question collection returned by the database. A missing or zero limit leaves the full question set available.
