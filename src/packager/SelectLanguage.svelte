<script>
  import {onDestroy} from 'svelte';
  import {locale, locales} from 'svelte-i18n';
  import {setInitialLocale} from '../locales/index';
  import supportedLocales from '../locales/supported-locales.json';

  const unsubscribe = locale.subscribe((locale) => {
    setInitialLocale(locale);
  });
  onDestroy(unsubscribe);
</script>

<select bind:value={$locale}>
  {#each $locales as locale}
    <option value={locale}>{supportedLocales[locale].name}</option>
  {/each}
</select>
