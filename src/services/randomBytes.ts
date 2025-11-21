import { randomBytes } from 'common-services';
import { constant, location } from 'knifecycle';

export type RandomBytesService = typeof randomBytes;

export default location(constant('randomBytes', randomBytes), import.meta.url);
