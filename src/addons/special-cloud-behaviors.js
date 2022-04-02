const SAFE_PROTOCOLS = [
  // The only protocol that's critical to block is javascript:
  // file: is indeed unsafe in places like Electron, but it's the Electron environment's job to protect against that
  // Navigating between file: is safe on the web
  'http:',
  'https:',
  'data:',
  'file:',
];

const isSafeURL = (url) => {
  try {
    const u = new URL(url, location.href);
    return SAFE_PROTOCOLS.includes(u.protocol);
  } catch (e) {
    return false;
  }
};

const isDataURL = (url) => {
  try {
    const u = new URL(url, location.href);
    return u.protocol === 'data:';
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
      if (isDataURL(value)) {
        // Browsers don't allow navigating to data: URIs, so we'll always convert a redirect to opening a new page
        window.open(value);
      } else if (isSafeURL(value)) {
        location.href = value;
      }
    } else if (name === '☁ open link') {
      if (isSafeURL(value)) {
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
