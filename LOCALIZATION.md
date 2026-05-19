# Localization Guide

Better DeepSeek supports multiple languages through a lightweight built-in i18n system. All user-facing strings live in JSON files under `src/locales/`. Components import a `t()` function and call it with a key path like `t('settings.save')`. If a key is missing in the active language it falls back to English; if it's missing everywhere the key itself is shown.

## Adding a New Language

Start by cloning the repository and installing dependencies:

```bash
git clone https://github.com/EdgeTypE/better-deepseek.git
cd better-deepseek
npm install
```

### 1. Create a locale file

Copy `src/locales/en.json` to `src/locales/{code}.json` where `{code}` is your language's ISO 639-1 code (e.g., `de`, `fr`, `ja`, `zh`).

### 2. Translate every string

Open your new file and replace the English values with translations. The `updatedAt` field at the top should reflect today's date. The structure inside `messages` must remain identical, keys are never translated, only their values.

Example:
```json
{
  "updatedAt": "2026-05-20",
  "messages": {
    "common": {
      "save": "Speichern",
      "cancel": "Abbrechen"
    },
    "settings": {
      "generalSettings": "Allgemeine Einstellungen"
    }
  }
}
```

### 3. Register the language in the i18n manager

Open `src/lib/i18n.svelte.js` and add your locale to the import and the `locales` map:

```javascript
import en from "../locales/en.json";
import tr from "../locales/tr.json";
import de from "../locales/de.json";              // ← add

const locales = { en, tr, de };                    // ← add
```

### 4. Add the language name to the locale files

Add an entry under `messages.language` so it appears in the Settings language picker:

In `en.json`:
```json
"language": {
  "en": "English",
  "tr": "Türkçe",
  "de": "Deutsch"
}
```

In your new `de.json`:
```json
"language": {
  "en": "Englisch",
  "tr": "Türkisch",
  "de": "Deutsch"
}
```

### 5. Build and test

Rebuild the extension:

```bash
npm run build
```

Load the unpacked extension from `dist-chrome`, open the settings drawer, and switch to your language. Every UI string that uses `t()` should now show your translations.

### Submitting your translation

Open a pull request with your new locale file and the changes to `src/lib/i18n.svelte.js` and `src/locales/en.json`. If you're not comfortable with Git or pull requests, that's fine, just attach your translated JSON file to a [new issue](https://github.com/EdgeTypE/better-deepseek/issues/new) and mention which language it's for. I'll take care of the rest.

## Things to Keep in Mind

- **Do not change the JSON keys** - only the values. The keys are dotted-path identifiers that the code uses to look up translations.
- **Template variables** like `{{version}}`, `{{name}}`, or `{{count}}` must stay exactly as they are, including braces. They are replaced at runtime with dynamic values. Move them around as needed for natural grammar in your language.
- **HTML in values** - some values contain `<strong>` tags or other inline HTML. These are rendered with `{@html ...}` and must be preserved for security and formatting.
- **Plurals** are handled through separate keys, not through complex plural rules. For example, `filesUploaded` and `filesUploadedShort` are distinct keys rather than a single key with plural logic.
- **Not everything needs translation** - strings sent to the AI model (like auto.js messages) are intentionally kept in English.
