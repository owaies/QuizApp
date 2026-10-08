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

## Development notes

- Keep credentials and connection strings out of Git. Use `.env.example` for variable names and safe placeholders.
- Run the submission regression checklist in `docs/` after changing answer or scoring logic.
- Preserve the existing authentication and authorization boundaries when adding quiz or administration endpoints.

## Security

Environment files containing real credentials must remain untracked. Passwords should be handled through the existing password-hashing flow, and authentication changes should be tested against both successful and rejected requests.
