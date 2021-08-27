<script>
  import {theme} from './stores';
</script>

<select bind:value={$theme}>
  <option value="system">Use system theme</option>
  <option value="light">Light</option>
  <option value="dark">Dark</option>
</select>
