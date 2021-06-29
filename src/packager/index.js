import {addMessages, getLocaleFromNavigator, init} from 'svelte-i18n';
import messages from '../locales/index';
import P4 from './P4.svelte';
import './analytics';

for (const language of Object.keys(messages)) {
  addMessages(language, messages[language]);
}
init({
  fallbackLocale: 'en',
  initialLocale: getLocaleFromNavigator()
});

const app = new P4({
  target: document.getElementById('app')
});
