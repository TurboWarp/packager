import {setAdapter} from '../adapter';
import Packager from '../packager';
import WebAdapter from './adapter';

setAdapter(new WebAdapter());

export default Packager;
