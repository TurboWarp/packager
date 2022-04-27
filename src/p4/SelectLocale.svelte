<script>
  import {locale, supportedLocales} from '../locales/index';
</script>

<select bind:value={$locale}>
  {#each Object.entries(supportedLocales) as [locale, name]}
    <option value={locale}>{name}</option>
  {/each}
</select>
