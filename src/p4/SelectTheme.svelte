<script>
  import {theme} from './stores.js';
  import {_} from '../locales/index.js';
</script>

<select bind:value={$theme}>
  <option value="system">{$_('theme.system')}</option>
  <option value="light">{$_('theme.light')}</option>
  <option value="dark">{$_('theme.dark')}</option>
</select>
