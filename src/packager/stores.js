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

export {
  error,
  progress
};
