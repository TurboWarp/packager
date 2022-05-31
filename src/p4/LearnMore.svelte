<script>
  import {_} from '../locales/';
  import {DOCS_BASE} from '../packager/brand';

  export let slug;
  export let href;

  const link = slug ? `${DOCS_BASE}${slug}` : href;
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
