import {addMessages, getLocaleFromNavigator, init} from 'svelte-i18n';
import P4 from './P4.svelte';
import './analytics';

addMessages('en', require('../locales/en.json'));
init({
  fallbackLocale: 'en',
  initialLocale: getLocaleFromNavigator()
});

const app = new P4({
  target: document.getElementById('app')
});
