# Profile Prompt Builder (Web)

Static web app that generates a prompt you can paste into ChatGPT to extract an explicit/inferred personal profile.

## Run locally

From the repo root:

```bash
cd profile-prompt-web
python3 -m http.server 5173
```

Then open:

`http://localhost:5173/`

## Usage

1. Select the profile sections you want.
2. Adjust options (inferred, sensitive, max bullets).
3. Click `Copy`.
4. Paste the prompt into ChatGPT (the account you want to extract from).
5. Copy the Markdown output into your new chatbot as initialization.
