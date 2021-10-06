import DropArea from './drop-area';
import styles from './style.css';

class Question {
  constructor (parent, text) {
    this.parent = parent;
    this.text = text;

    this.root = document.createElement('div');
    this.root.className = styles.questionRoot;

    this.inner = document.createElement('div');
    this.inner.className = styles.questionInner;

    if (text) {
      this.textElement = document.createElement('div');
      this.textElement.textContent = text;
      this.textElement.className = styles.questionText;
    }

    this.inputContainer = document.createElement('div');
    this.inputContainer.className = styles.questionInputOuter;

    this.input = document.createElement('input');
    this.input.className = styles.questionInput;
    this.input.addEventListener('keypress', this.onkeypress.bind(this));

    this.dropper = new DropArea(this.input, this.dropperCallback.bind(this));

    this.submitButton = document.createElement('button');
    this.submitButton.className = styles.questionSubmitButton;
    this.submitButton.addEventListener('click', this.onsubmitpressclick.bind(this));

    this.inputContainer.appendChild(this.input);
    this.inputContainer.appendChild(this.submitButton);
    if (this.textElement) {
      this.inner.appendChild(this.textElement);
    }
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

  dropperCallback (texts) {
    const text = texts.join('').replace(/\r?\n/g, ' ');
    this.input.value = text;
  }

  onsubmitpressclick () {
    this.submit();
  }

  destroy () {
    this.root.remove();
    this.parent.question = null;
  }
}

export default Question;
