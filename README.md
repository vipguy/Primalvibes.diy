# ✨ Vibe coding just got easier

Your **ideas** become **apps** instantly. [Try the hosted version](https://vibe-coding.use-fireproof.com/) or fork it on [GitHub](https://github.com/vibe-coding/vibe-coding) and bring your own API keys.

![Vibe Coding App Builder](./public/fireproof-logo.png)

This tool lets you build React components with zero setup. With built-in Fireproof data persistence and OpenRouter API access, your creations are powerful and easy to share.

## Example Projects

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="./public/fractal.png" alt="Fractal Explorer" width="400"/>
        <br />
        <b>Fractal Explorer</b>
        <br />
        Interactive fractal visualization with save and load
      </td>
      <td align="center">
        <img src="./public/trivia.png" alt="Trivia Game" width="400"/>
        <br />
        <b>Trivia Game</b>
        <br />
        AI powered questions on any topic
      </td>
    </tr>
  </table>
</div>

## Features

- Build React components using AI
- Save and browse previous chat sessions
- Integrated with Fireproof for data persistence
- Real-time UI preview

## Getting Started

1. Clone the repository
2. Install dependencies with `pnpm i` or `pnpm install`
3. Set up your environment variables by copying `env-template.txt` to `.env` and adding your OpenRouter API key.
4. Run the development server with `pnpm dev`

## Quick Start

```bash
# Install dependencies
pnpm i

# Set up your environment variables
cp env-template.txt .env

# Add your OpenRouter API key, available here
open https://openrouter.ai/settings/keys

# Start development server
pnpm dev
```

## Chat Session History

The application saves each chat session to Fireproof, allowing you to:

- Browse previous chat sessions in the collapsible sidebar
- Return to previous sessions to continue your work
- Keep track of all your component building history
- Track screenshots of your component previews

## Example Prompts

Write a simple app that allows me to chat about gardening, use stream: true for the chat and save response as individual Fireproof documents.
