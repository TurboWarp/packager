<script>
  import {_} from '../locales/';

  export let slug;
  export let href;

  const link = slug ? `https://docs.turbowarp.org/${slug}` : href;
</script>

<style>
  a {
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
</style>

<a href={link} title={$_('options.learnMore')} target="_blank" rel="noopener noreferrer">(?)</a>
