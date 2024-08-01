const { readdir, stat, readFile, writeFile, mkdir } = require("fs/promises");
const path = require("path");
const mime = require('mime-types');
const multer = require('multer');
const express = require('express');


module.exports.prepareDatabase = async () => {

}

module.exports.cleanDatabase = async () => {
}


module.exports.initPlugin = async ({ logger, graphql }) => {

    //const filesDirectory = path.join(process.env.DATA_DIR, "apps" ,"plug");// path.join(__dirname, '..', 'public', 'files');
    const router = express.Router();

    // Get File Tree
    router.get('/files/:appName', (req, res) => {
        
        const filesDirectory = path.join(process.env.DATA_DIR, "apps", req.params.appName);
        const getFiles = async (dir) => {
            let results = [];
            const list = await readdir(dir);
            for (let file of list) {
                file = path.resolve(dir, file);
                const statFile = await stat(file);
                if (statFile && statFile.isDirectory()) {
                    results.push({ name: path.basename(file), type: 'directory', children: getFiles(file) });
                } else {
                    results.push({ name: path.basename(file), type: 'file', mimeType: mime.lookup(file) });
                }
            }
            return results;
        };
        (async () => {
            try{
                // Check user has proper authorization
                if(!await graphql.checkAppAccessMiddleware(req, res)){ return ;}
                res.json(await getFiles(filesDirectory));
            }catch(err){
                res.status(err.statusCode??500).json(err);
            }
        })();
    });

    // Get File Content
    router.get('/files/:appName/content', (req, res) => {
        (async () => {
            const filesDirectory = path.join(process.env.DATA_DIR, "apps", req.params.appName);
            const filePath = path.join(filesDirectory, req.query.path);
            try {
                if(!await graphql.checkAppAccessMiddleware(req, res)){ return ;}
                res.send(await readFile(filePath));
            } catch (err) {
                logger.warn(`Error reading file ${filePath} %o`, err)
                res.status(500).send('Error reading file ' + filePath);
            }
        })();
    });

    // Save File Content
    // Configure multer to use memory storage
    const storage = multer.memoryStorage();
    const upload = multer({ storage: storage });
    router.post('/files/:appName/save', upload.single('file'), (req, res) => {
        if (req.body.path.includes("..")) {
            return res.status(500).end("Forbidden path " + req.body.path)
        }
        (async () => {
            if(!await graphql.checkAppAccessMiddleware(req, res)){ return ;}

            const filesDirectory = path.join(process.env.DATA_DIR, "apps", req.params.appName);

            const filePath = path.join(filesDirectory, req.body.path);

            try {
                // Ensure the target directory exists
                await mkdir(path.dirname(filePath), { recursive: true });

                // Write the file from memory buffer to the final destination
                await writeFile(filePath, req.file.buffer);

                res.send('File saved successfully');
            } catch (err) {
                console.warn(`Error writing file ${filePath} %o`, err);
                res.status(500).send('Error writing file ' + filePath);
            }
        })();

    });

    return {
        // path in which the plugin provide its front end files
        frontEndPath: "html",
        router: router,
        //menu entries
        menu: [
            {
                name: "admin", entries: [
                    { name: "Code editor", link: "/plugin/:appName/code-editor/" }
                ]
            }
        ]
    }
}