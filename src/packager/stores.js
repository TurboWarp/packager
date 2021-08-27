import {writable} from 'svelte/store';

const error = writable(null);
const progress = writable({
  progress: 0,
  visible: false,
  text: ''
});
progress.reset = () => {
  progress.set({
    progress: 0,
    visible: false,
    text: ''
  });
};

const POSSIBLE_THEMES = [
  'system',
  'dark',
  'light'
];
const THEME_KEY = 'P4.theme';
const theme = writable('system');
try {
  const storedTheme = localStorage.getItem(THEME_KEY);
  if (POSSIBLE_THEMES.includes(storedTheme)) {
    theme.set(storedTheme);
  }
} catch (e) {
  // Ignore
}
theme.subscribe((value) => {
  try {
    if (value === 'system') {
      localStorage.removeItem(THEME_KEY);
    } else {
      localStorage.setItem(THEME_KEY, value);
    }
  } catch (e) {
    // ignore
  }
});

export {
  error,
  progress,
  theme
};
