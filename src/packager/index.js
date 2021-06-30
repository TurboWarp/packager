import {addMessages, init} from 'svelte-i18n';
import messages, {getInitialLocale} from '../locales/index';
import P4 from './P4.svelte';
import './analytics';

for (const language of Object.keys(messages).sort()) {
  addMessages(language, messages[language]);
}
init({
  fallbackLocale: 'en',
  initialLocale: getInitialLocale()
});

const app = new P4({
  target: document.getElementById('app')
});
