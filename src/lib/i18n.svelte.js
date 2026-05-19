import en from "../locales/en.json";
import tr from "../locales/tr.json";

const locales = { en, tr };

class I18nManager {
  // Svelte 5 reactive state for active locale
  locale = $state("en");

  // Derived messages dictionary corresponding to the active locale
  messages = $derived(locales[this.locale] || locales["en"]);

  /**
   * Initializes the locale from chrome.storage.local or falls back to system preferences.
   * @param {string} [savedLocale] Custom saved locale code
   */
  init(savedLocale) {
    if (savedLocale && locales[savedLocale]) {
      this.locale = savedLocale;
      return;
    }
    // Auto-detect browser/system language
    const browserLang = (typeof navigator !== "undefined" ? navigator.language : "en").split("-")[0];
    if (locales[browserLang]) {
      this.locale = browserLang;
    } else {
      this.locale = "en";
    }
  }

  /**
   * Updates the active locale, persisting it to chrome storage.
   * @param {string} lang Language code ('en', 'tr', etc.)
   */
  setLocale(lang) {
    if (locales[lang]) {
      this.locale = lang;
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get("bds_settings", (data) => {
          const settings = data.bds_settings || {};
          settings.locale = lang;
          chrome.storage.local.set({ bds_settings: settings });
        });
      }
    }
  }

  /**
   * Resolves a dotted-path localization key and performs template variable interpolation.
   * Supports falling back to English if the translation is missing in the active language.
   * 
   * @param {string} path Dotted key path (e.g. 'settings.advancedSettings')
   * @param {Record<string, any>} [vars] Template variables to interpolate (e.g. { version: '2.0' })
   * @returns {string} The localized and interpolated string
   */
  t(path, vars = {}) {
    const parts = path.split(".");

    // 1. Resolve within active locale's dictionary
    let value = this.resolvePath(this.messages.messages, parts);

    // 2. If missing, fall back to English dictionary
    if (value === undefined && this.locale !== "en") {
      value = this.resolvePath(locales["en"].messages, parts);
    }

    // 3. If completely missing, return key path as a safety string
    if (value === undefined) {
      return path;
    }

    let str = String(value);

    // 4. Interpolate variables placeholders (e.g. {{version}} or {{n}})
    for (const [key, val] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g"), val);
    }

    return str;
  }

  /**
   * Helper to traverse a nested dictionary path
   * @private
   */
  resolvePath(obj, parts) {
    let current = obj;
    for (const part of parts) {
      if (current && typeof current === "object") {
        current = current[part];
      } else {
        return undefined;
      }
    }
    return current;
  }
}

export const i18n = new I18nManager();
export const t = (path, vars) => i18n.t(path, vars);
