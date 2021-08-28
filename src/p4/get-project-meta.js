import xhr from '../packager/xhr';

const getProjectTitle = async (id) => {
  try {
    const meta = await xhr({
      url: `https://trampoline.turbowarp.org/proxy/projects/${id}`,
      timeout: 10000,
      type: 'json'
    });
    return meta.title;
  } catch (e) {
    // Happens commonly when loading unshared projects, not something to worry about
    return '';
  }
};

export default getProjectTitle;
