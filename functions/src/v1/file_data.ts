import * as firebaseHelper from 'firebase-functions-helper'
import * as express from 'express'
import { db } from '../index'

class fileData {
    constructor(
        public name: string = '',
        public id: string = '',
        public date: number = -1,
        public mirrors: string[] = [],
    ) { }
}

const fileDataReqValidator = (arr: any[], target: any[]) => arr.every(v => target.includes(v)) && !arr.includes('id') && !arr.includes('date')
const fileDataCollection = 'Files'
const fileDataKeys = Object.keys(new fileData())
const fileDataModule = express()

// Add new fileData
fileDataModule.post('/', async (req, res) => {
    if (!('id' in req.body)) {
        res.status(400).send('Invalid body: id data missing!')
        return
    }
    
    const exist = await firebaseHelper.firestore.checkDocumentExists(db,fileDataCollection,req.body['id'])
    if (exist == true) {
        res.status(403).send(`fileData entry already exists! ref: ${req.body['id']}`)
        return
    }
    try {
        const newFile: fileData = {
            name: req.body['name'],
            id: req.body['id'],
            date: new Date().getTime(),
            mirrors: req.body['mirrors'],
        }
        await firebaseHelper.firestore
            .createDocumentWithID(db, fileDataCollection, newFile.id, newFile)
        res.status(201).send(`Created a new fileData with id: ${newFile.id}`)
    } catch (error) {
        res.status(400).send(`Invalid body! Parse failed`)
    }
})

// Add mirrors
fileDataModule.post('/mirror/:fileDataId', async (req, res) => {
    const exist = await firebaseHelper.firestore.checkDocumentExists(db,fileDataCollection, req.params.fileDataId)
    if (!exist) {
        res.status(403).send(`fileData does not exist! ref: ${req.params.fileDataId}`)
        return
    }
    if (!('mirrors' in req.body)) {
        res.status(400).send(`Inavlid body: mirrors data missing!`)
        return
    }
    const currentDoc:fileData = await firebaseHelper.firestore.getDocument(db, fileDataCollection, req.params.fileDataId)
    const newMirrors = new Set<string>()
    Array.from(currentDoc.mirrors).forEach((element: any) => newMirrors.add(element))
    Array.from(req.body['mirrors']).forEach((element: any) => newMirrors.add(element))
    currentDoc.mirrors = Array.from(newMirrors)
    const updatedDoc = await firebaseHelper.firestore
        .updateDocument(db, fileDataCollection, req.params.fileDataId, currentDoc)
    res.status(204).send(`Update a new fileData: ${updatedDoc}`)
})

// Delete mirrors
fileDataModule.delete('/mirror/:fileDataId', async (req, res) => {
    const exist = await firebaseHelper.firestore.checkDocumentExists(db,fileDataCollection, req.params.fileDataId)
    if (!exist) {
        res.status(403).send(`fileData does not exist! ref: ${req.params.fileDataId}`)
        return
    }
    if (!('mirrors' in req.body)) {
        res.status(400).send(`Inavlid body: mirrors data missing!`)
        return
    }
    const currentDoc:fileData = await firebaseHelper.firestore.getDocument(db, fileDataCollection, req.params.fileDataId)
    const newMirrors = new Set<string>()
    Array.from(currentDoc.mirrors).forEach((element: any) => newMirrors.add(element))
    Array.from(req.body['mirrors']).forEach((element: any) => newMirrors.delete(element))
    currentDoc.mirrors = Array.from(newMirrors)
    const updatedDoc = await firebaseHelper.firestore
        .updateDocument(db, fileDataCollection, req.params.fileDataId, currentDoc)
    res.status(204).send(`Update a new fileData: ${updatedDoc}`)
})

// Update new fileData
fileDataModule.patch('/:fileDataId', async (req, res) => {
    const reqKeys = Object.keys(req.body)
    if (!fileDataReqValidator(reqKeys, fileDataKeys)) {
        res.status(400).send('Invalid request body!')
        return
    }

    const updatedDoc = await firebaseHelper.firestore
        .updateDocument(db, fileDataCollection, req.params.fileDataId, req.body)
    res.status(204).send(`Update a new fileData: ${updatedDoc}`)
})

// View a fileData
fileDataModule.get('/:fileDataId', async (req, res) => {
    firebaseHelper.firestore
        .getDocument(db, fileDataCollection, req.params.fileDataId)
        .then(doc => res.status(200).send(doc))
        .catch(error => res.status(400).send(`Cannot get fileData: ${error}`))
})

// View all fileDatas
fileDataModule.get('/', (req, res) => {
    firebaseHelper.firestore
        .backup(db, fileDataCollection)
        .then(data => {
            const _data = Object(data)[fileDataCollection]
            return res.status(200).send(Object.keys(_data).map(key => _data[key]))
        })
        .catch(error => res.status(400).send(`Cannot get fileDatas: ${error}`))
})

// Delete a fileData
fileDataModule.delete('/:fileDataId', async (req, res) => {
    const exist = await firebaseHelper.firestore.checkDocumentExists(db,fileDataCollection,req.params.fileDataId)
    if (exist) {
        const deletedfileData = await firebaseHelper.firestore
            .deleteDocument(db, fileDataCollection, req.params.fileDataId)
        res.status(204).send(`fileData is deleted: ${deletedfileData}`)
    } else {
        res.status(400).send('Event does not exist')
    }
})

export { fileDataModule }
