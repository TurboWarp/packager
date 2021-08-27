<script>
  import {theme} from './stores';
  import {_} from '../locales';
</script>

<select bind:value={$theme}>
  <option value="system">{$_('theme.system')}</option>
  <option value="light">{$_('theme.light')}</option>
  <option value="dark">{$_('theme.dark')}</option>
</select>
