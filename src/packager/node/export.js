import Packager from '../packager';
import {downloadProject} from '../download-project';
import NodeAdapter from './adapter';

Packager.adapter = new NodeAdapter();

export {
  Packager,
  downloadProject as loadProject
};
