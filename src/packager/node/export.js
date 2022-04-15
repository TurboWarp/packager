import Packager from '../packager';
import {downloadProject} from '../download-project';
import NodeAdapter from './adapter';
import Image from './image';
import {setAdapter} from '../adapter';

setAdapter(new NodeAdapter());

export {
  Packager,
  Image,
  downloadProject as loadProject
};
