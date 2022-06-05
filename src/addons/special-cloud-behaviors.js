const SAFE_PROTOCOLS = [
  // The only protocol that's critical to block is javascript:
  // file: is indeed unsafe in places like Electron, but it's the Electron environment's job to protect against that
  // Navigating between file: is safe on the web
  'http:',
  'https:',
  'data:',
  'file:',
  'mailto:',
];

const isSafeURL = (url) => {
  try {
    const u = new URL(url, location.href);
    return SAFE_PROTOCOLS.includes(u.protocol);
  } catch (e) {
    return false;
  }
};

const shouldAlwaysOpenInNewTab = (url) => {
  try {
    const u = new URL(url, location.href);
    // Browsers don't allow opening new tabs with data: URIs
    return u.protocol === 'data:';
  } catch (e) {
    return false;
  }
};

const shouldAlwaysOpenInCurrentTab = (url) => {
  try {
    const u = new URL(url, location.href);
    // If you open a mailto: in a new tab, the browser will convert it to about:blank and just leave an empty tab
    return u.protocol === 'mailto:';
  } catch (e) {
    return false;
  }
};

const openInNewTab = (url) => {
  window.open(url);
};

const openInCurrentTab = (url) => {
  location.href = url;
};

class SpecialCloudBehaviorsProvider {
  enable () {
    this.manager.setVariable(this, '☁ url', location.href);

    document.addEventListener('paste', (e) => {
      const text = (e.clipboardData || window.clipboardData).getData('text');
      this.manager.setVariable(this, '☁ pasted', text);
    });

    this.webSocketProvider = this.manager.providers.find(i => typeof i.setProjectId === 'function');
    this.initialProjectId = this.webSocketProvider ? this.webSocketProvider.projectId : null;
  }

  handleUpdateVariable (name, value) {
    if (name === '☁ redirect') {
      if (isSafeURL(value)) {
        if (shouldAlwaysOpenInNewTab(value)) {
          openInNewTab(value);
        } else {
          openInCurrentTab(value);
        }
      }
    } else if (name === '☁ open link') {
      if (isSafeURL(value)) {
        if (shouldAlwaysOpenInCurrentTab(value)) {
          openInCurrentTab(value);
        } else {
          openInNewTab(value);
        }
      }
    } else if (name === '☁ username') {
      this.manager.parent.setUsername(value);
    } else if (name === '☁ set clipboard') {
      navigator.clipboard.writeText(value);
    } else if (name === '☁ room id') {
      if (this.webSocketProvider) {
        const newId = this.initialProjectId + (value ? `-${value}` : '');
        this.webSocketProvider.setProjectId(newId);
      }
    }
  }
}

export default function ({ scaffolding }) {
  const provider = new SpecialCloudBehaviorsProvider();
  scaffolding.addCloudProvider(provider);
  scaffolding.addCloudProviderOverride('☁ url', provider);
  scaffolding.addCloudProviderOverride('☁ redirect', provider);
  scaffolding.addCloudProviderOverride('☁ open link', provider);
  scaffolding.addCloudProviderOverride('☁ username', provider);
  scaffolding.addCloudProviderOverride('☁ set clipboard', provider);
  scaffolding.addCloudProviderOverride('☁ pasted', provider);
  scaffolding.addCloudProviderOverride('☁ room id', provider);
}
