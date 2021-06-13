import styles from './style.css';

class Question {
  constructor (parent, text) {
    this.parent = parent;
    this.text = text;

    this.root = document.createElement('div');
    this.root.className = styles.questionRoot;

    this.inner = document.createElement('div');
    this.inner.className = styles.questionInner;

    this.inputContainer = document.createElement('div');
    this.inputContainer.className = styles.questionInputOuter;

    this.input = document.createElement('input');
    this.input.className = styles.questionInput;
    this.input.addEventListener('keypress', this.onkeypress.bind(this));

    this.inputContainer.appendChild(this.input);
    this.inner.appendChild(this.inputContainer);
    this.root.appendChild(this.inner);
    this.parent._addLayer(this.root);
    this.input.focus();

    this.answerCallback = new Promise((resolve) => {
      this.callback = resolve;
    });
  }

  answer () {
    return this.answerCallback;
  }

  submit () {
    this.callback(this.input.value);
    this.destroy();
  }

  onkeypress (e) {
    if (e.key === 'Enter') {
      this.submit();
    }
  }

  destroy () {
    this.root.remove();
    this.parent.question = null;
  }
}

export default Question;
