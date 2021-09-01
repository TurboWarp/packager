class SpecialCloudBehaviorsProvider {
  enable () {
    this.manager.setVariable(this, '☁ url', location.href);
  }

  handleUpdateVariable (name, value) {
    if (name === '☁ redirect') {
      location.href = value;
    } else if (name === '☁ open link') {
      // Unreliable
      window.open(value);
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
