import util from 'util';
import { db } from './db';

export const query = util.promisify(db.query).bind(db);