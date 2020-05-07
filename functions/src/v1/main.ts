import * as express from 'express'
import { fileDataModule } from './file_data'
import * as functions from 'firebase-functions'
import * as utils from './utils'

const apiInternal = express()
const version = '/api/v1'

const fileDataApi = utils.registerModule('/file', fileDataModule)

const apiKey = functions.config().tab_api.client_key;
const authMiddleware = function (req: any, res: any, next: any) {
  if (req.headers.authorization !== apiKey) {
    return res.status(403).json({ error: 'Unauthorized request!' });
  }
  if (req.get('content-type') !== 'application/json') {
    return res.status(403).json({ error: 'Content must be json!' });
  }
  next();
  return null;
}

apiInternal.use(authMiddleware)
apiInternal.use(version, fileDataApi)

export { apiInternal,apiKey }