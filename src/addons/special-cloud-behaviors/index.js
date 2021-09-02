const isSafeURL = (url) => {
  try {
    const u = new URL(url, location.href);
    return u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'data:';
  } catch (e) {
    return false;
  }
};

class SpecialCloudBehaviorsProvider {
  enable () {
    this.manager.setVariable(this, '☁ url', location.href);
  }

  handleUpdateVariable (name, value) {
    if (name === '☁ redirect') {
      if (isSafeURL(value)) {
        location.href = value;
      }
    } else if (name === '☁ open link') {
      if (isSafeURL(value)) {
        // Unreliable
        window.open(value);
      }
    } else if (name === '☁ username') {
      this.manager.parent.setUsername(value);
    }
  }
}

export default function (scaffolding) {
  const provider = new SpecialCloudBehaviorsProvider();
  scaffolding.addCloudProvider(provider);
  scaffolding.addCloudProviderOverride('☁ url', provider);
  scaffolding.addCloudProviderOverride('☁ redirect', provider);
  scaffolding.addCloudProviderOverride('☁ open link', provider);
  scaffolding.addCloudProviderOverride('☁ username', provider);
}
