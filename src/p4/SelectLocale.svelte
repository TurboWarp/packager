<script>
  import {locale, localeNames} from '../locales/index';
</script>

<select bind:value={$locale}>
  {#each Object.entries(localeNames) as [locale, name]}
    <option value={locale}>{name || locale}</option>
  {/each}
</select>
