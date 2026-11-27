import {setAdapter} from '../adapter.js';
import Packager from '../packager.js';
import WebAdapter from './adapter.js';

setAdapter(new WebAdapter());

export default Packager;
