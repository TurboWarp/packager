const isPromise = (v) => !!v && typeof v.then === 'function';

const jsValueToScratchValue = (v) => {
  if (typeof v === 'boolean' || typeof v === 'number' || typeof v === 'string') {
    return v;
  }
  return '' + v;
};

class UnsafeCloudBehaviorsProvider {
  enable () {

  }

  setEvalValue (value) {
    this.manager.setVariable(this, '☁ eval output', jsValueToScratchValue(value));
  }

  setEvalError (error) {
    console.error('Error evaluating ☁ eval', error);
    this.manager.setVariable(this, '☁ eval error', jsValueToScratchValue(error));
  }

  evaluateAsync (js) {
    try {
      const value = eval(js);
      if (isPromise(value)) {
        value
          .then((v) => this.setEvalValue(v))
          .catch((e) => this.setEvalError(e));
      } else {
        this.setEvalValue(value)
      }
    } catch (e) {
      this.setEvalError(e);
    }
  }

  handleUpdateVariable (name, value) {
    if (name === '☁ eval') {
      this.evaluateAsync(value);
    }
  }
}

export default function ({ scaffolding }) {
  const provider = new UnsafeCloudBehaviorsProvider();
  scaffolding.addCloudProvider(provider);
  scaffolding.addCloudProviderOverride('☁ eval', provider);
  scaffolding.addCloudProviderOverride('☁ eval output', provider);
  scaffolding.addCloudProviderOverride('☁ eval error', provider);
}
