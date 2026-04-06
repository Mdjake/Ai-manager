# Saif AI Studio

Advanced single-page AI app built on:

- API: `https://samba-api-free.onrender.com/?query=...`
- Local device memory via `localStorage`
- Local "fine-tune" layer through saved role, style, and training notes

## Features

- Premium startup-style UI
- Persistent local memory
- Recent-chat memory injection
- Training notes and response-style controls
- Export/import local profile
- Assistant identity branding for Developer Saif
- Contact link: `t.me/the_only_one_romeo`

## Run

Open `index.html` in a browser.

If the API blocks local file requests due to CORS in your browser, serve the folder with a simple local server instead of opening the file directly.

## Fine-tune note

This app does not perform true server-side model fine-tuning because the provided API only accepts a query string and returns a response. Instead, it builds a strong local tuning layer by injecting:

- identity instructions
- local memory
- training notes
- recent chat history

If you later get an API that supports custom training, embeddings, or system prompts natively, this UI can be extended to use that too.
