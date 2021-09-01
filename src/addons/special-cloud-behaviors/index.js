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
  scaffolding.addCloudProvider(new SpecialCloudBehaviorsProvider());
}
