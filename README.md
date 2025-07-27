# Gemini API Client-Side Usage with Ephemeral Tokens

This project is an example of how to securely use the Google Gemini API directly from a client-side application. It features an Astro frontend and a serverless backend running on Cloudflare Workers, which is responsible for generating temporary, single-use authentication tokens.

This approach avoids exposing your main Gemini API key on the client-side, providing a secure way for browsers to interact directly with the Gemini API.

## 🚀 Core Concept

The authentication flow is as follows:

1.  The client-side application (an Astro page) requests an authentication token from our backend API endpoint.
2.  The backend API (`/api/gemini-token`), running as a Cloudflare Worker, receives the request.
3.  Using a securely stored `GEMINI_SECRET_KEY`, the backend communicates with the Google AI Auth service to create an ephemeral, single-use token.
4.  The backend sends this temporary token back to the client.
5.  The client can now use this token to make direct calls to the Gemini API for a limited time (30 minutes in this example) and for a single use.

## ✨ Features

-   **Secure by Design**: Your main API key never leaves the server.
-   **Client-Side Gemini**: Enables direct communication from the browser to the Gemini API.
-   **Ephemeral Tokens**: Tokens are short-lived and single-use, minimizing risk.
-   **Serverless Backend**: Built with Astro and deployed on Cloudflare's efficient serverless platform.
-   **Ready to Deploy**: Pre-configured for deployment on Cloudflare Pages.

## 🛠️ Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v20.x or higher recommended)
-   [pnpm](https://pnpm.io/)
-   A [Cloudflare account](https://dash.cloudflare.com/sign-up)
-   A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### Local Development Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd gemini-live
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Configure Local Environment Variables:**
    Create a file named `.dev.vars` in the root of the project. This file is used by Wrangler to load environment variables for local development.

    ```ini
    # .dev.vars
    GEMINI_SECRET_KEY="your-gemini-api-secret-key"
    ```

4. **Configure Remote Environment Variables:**
    ```bash
    wrangler secret put GEMINI_SECRET_KEY
    ```

### Available Scripts

| Command          | Action                                                               |
| :--------------- | :------------------------------------------------------------------- |
| `pnpm install`   | Installs all necessary dependencies.                                 |
| `pnpm dev`       | Starts the local development server at `localhost:4321`.             |
| `pnpm build`     | Builds the Astro application for production.                         |
| `pnpm preview`   | Builds and previews the site locally using Cloudflare's Wrangler.    |
| `pnpm deploy`    | Deploys the application to your Cloudflare account.                  |
| `pnpm cf-typegen`| Generates TypeScript types for your Cloudflare Worker environment.   |

## ☁️ Deployment

This project is ready to be deployed to **Cloudflare Pages**.

1.  **Run the deploy command:**
    ```bash
    pnpm deploy
    ```
    This command first builds the site and then deploys it using Wrangler.

2.  **Configure Production Environment Variable:**
    After deploying, you must add your `GEMINI_SECRET_KEY` to your project's environment variables in the Cloudflare dashboard.
    -   Go to your project's **Settings** > **Environment Variables**.
    -   Add a new variable with the name `GEMINI_SECRET_KEY` and your key as the value. This will ensure the deployed application can generate tokens.

## 🔌 API Endpoint

### `GET /api/gemini-token`

This endpoint generates a temporary, single-use authentication token for the Gemini API.

-   **Method**: `GET`
-   **Success Response** (`200 OK`):
    ```json
    {
      "token": "v1alpha/tokens/generated-token-string"
    }
    ```
-   **Error Responses** (`500 Internal Server Error`):
    ```json
    { "error": "Missing API Key" }
    ```
    ```json
    { "error": "Failed to create token" }
    ```