import Packager from '../packager.js';
import {downloadProject} from '../download-project.js';
import NodeAdapter from './adapter.js';
import Image from './image.js';
import {setAdapter} from '../adapter.js';

setAdapter(new NodeAdapter());

export {
  Packager,
  Image,
  downloadProject as loadProject
};
