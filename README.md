# NeoLLMChat

**NeoLLMChat** is a self-hosted chat interface for large language models, built with **React** and **ElysiaJS**. It supports multiple LLM providers, includes user authentication, and offers a fast, clean interface for chatting and managing conversations.

---

## Features

-   [x] Open source and fully self-hosted
-   [x] Clean and responsive chat interface
-   [x] Chat history and message editing
-   [x] Multiple model support (OpenAI-compatible APIs)
-   [x] Secure API key encryption
-   [x] Multi-user authentication
-   [x] File attachments
-   [x] Syntax highlighting for code
-   [x] Regenerate messages
-   [x] Export Chat (PDF, Markdown, Plain Text)

---

## Quick Start with Docker

Copy this into your `compose.yml` file:

```yaml
services:
    neollmchat:
        image: ghcr.io/ge0rg3e/neollmchat:latest
        container_name: neollmchat
        ports:
            - 8608:8608
        environment:
            - DATABASE_URL=mongodb://root:{PASSWORD}@mongodb:27017/
            - CONTENT_ENCRYPTION_KEY=your_encryption_key_here
            - JWT_SECRET=your_jwt_secret_here
        restart: always

    mongodb:
        image: mongo
        container_name: mongodb
        environment:
            MONGO_INITDB_ROOT_USERNAME: root
            MONGO_INITDB_ROOT_PASSWORD: example
        restart: always
```

### Notes

-   Generate a secure encryption key and JWT secret from: https://playcode.io/2428711
-   Set a strong MongoDB password

---

## Development Setup

To contribute or run the app locally:

1. Fork and clone the repo
2. Run `bun install` to install dependencies
3. Start the dev server
4. Make your changes
5. Test everything locally
6. Commit and push
7. Open a pull request

Please write clean, simple code that follows existing styles.
