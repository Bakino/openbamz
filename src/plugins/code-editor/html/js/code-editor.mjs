
function loadFileTree() {
    window.openbamz.fetchAuth(`/code-editor/files/${window.OPENBAMZ_APP}`)
        .then(response => response.json())
        .then(files => {
            const fileList = document.getElementById('file-list');
            fileList.innerHTML = createFileTree(files);
            addFileClickHandlers();
        });
}

function createFileTree(files, parentPath=[]) {
    return files.map(file => {
        if (file.type === 'directory') {
            return `<li class="directory">${file.name}<ul>${createFileTree(file.children, parentPath.concat(file.name))}</ul></li>`;
        }
        return `<li class="file" data-path="${parentPath.concat(file.name).join("/")}" data-mime="${file.mimeType}">${file.name}</li>`;
    }).join('');
}

let currentFileElement;
function addFileClickHandlers() {
    document.querySelectorAll('.file').forEach(fileElement => {
        fileElement.addEventListener('click', () => {
            currentFileElement = fileElement;
            loadEditor(currentFileElement.getAttribute("data-mime")) ;
        });
    });
}

const EDITORS = [];


//load extensions
import extensions from "/code-editor/editor-extensions" ;

async function loadExtensions(){
    let response = await window.openbamz.fetchAuth(`/code-editor/editor-extensions-allowed/${window.OPENBAMZ_APP}`)
    let allowedExtensions = await response.json();
    for(let extension of extensions){
        if(allowedExtensions.some(e=>e.plugin === extension.plugin)) {
            console.log("load extension "+extension.plugin) ;
            if(extension.editors){
                for(let editor of extension.editors){
                    EDITORS.push(editor) ;
                }
            }
        }
    }
}

//keep file contents of all files
const fileContents = {
    /*
    path: {
        lastSaveContent: "...",
        currentContent: "..."
    }
    */
}

async function getFileContent({filePath}){
    if(fileContents[filePath]){
        return fileContents[filePath];
    }
    let response = await window.openbamz.fetchAuth(`/code-editor/files/${window.OPENBAMZ_APP}/content?path=${filePath}`);
    let content = await response.text() ;
    fileContents[filePath] = {
        lastSaveContent:content,
        currentContent:content,
    }
    return fileContents[filePath];
}

let notifyTimeoutId = null;
function notifyModification(fileEditor){
    
    if(notifyTimeoutId){ clearTimeout(notifyTimeoutId) ;}
    setTimeout(()=>{
        updateContentFromEditor(fileEditor)
    }, 500) ;
}

async function updateContentFromEditor(fileEditor){
    if(notifyTimeoutId){ clearTimeout(notifyTimeoutId) ;}

    if(fileEditor.getEditedContent){
        let filePath = currentFileElement.getAttribute('data-path') ;
        let newContent = await fileEditor.getEditedContent();
        if(fileContents[filePath]){
            fileContents[filePath].currentContent = newContent;
        }
        refreshModifiedIndicator();
    }
}

let currentFileEditor = null;

async function loadEditorTabs(){
    await loadExtensions();

    const editorsTab = document.getElementById("editors-tab") ;
    const editorsTabContent = document.getElementById("editors-tab-content") ;
    for(let fileEditor of EDITORS){
        const li = document.createElement("LI") ;
        li.className = "nav-item d-none";
        li.id = `nav-${fileEditor.id}` ;
        let tabEl = document.createElement("BUTTON");
        tabEl.className = "nav-link";
        tabEl.id = `${fileEditor.id}-tab` ;
        tabEl.setAttribute("data-bs-toggle", "tab");
        tabEl.setAttribute("data-bs-target", `#editor-${fileEditor.id}`);
        tabEl.setAttribute("type", "button");
        tabEl.setAttribute("role", "tab");
        tabEl.setAttribute("aria-controls", "home");
        tabEl.setAttribute("aria-selected", "true");
        tabEl.innerHTML = fileEditor.name;
        li.appendChild(tabEl) ;
        editorsTab.appendChild(li) ;
        tabEl.addEventListener('shown.bs.tab', function () {
            fileEditor.loadFile({
                filePath: currentFileElement.getAttribute('data-path'),
                mimeType: currentFileElement.getAttribute('data-mime'),
                getFileContent
            })
            currentFileEditor = fileEditor;
        })
        tabEl.addEventListener('hide.bs.tab', async function () {
            await updateContentFromEditor(fileEditor) ;
            currentFileEditor = false;
        })

        const divContent = document.createElement("DIV") ;
        divContent.className= "tab-pane h-100 fade";
        divContent.id = `editor-${fileEditor.id}` ;
        divContent.setAttribute("aria-labelledby", `${fileEditor.id}-tab`) ;
        editorsTabContent.appendChild(divContent);
        await fileEditor.init({ container: divContent, notifyModification: ()=>{
            notifyModification(fileEditor) ;
        } }) ;
    }
}

loadEditorTabs();

async function loadEditor(mimeType){
    let possibleEditors = [];
    let otherEditors = [];
    for(let fileEditor of EDITORS){
        if(fileEditor.mimeTypes.includes(mimeType)){
            possibleEditors.push(fileEditor);
        }else{
            otherEditors.push(fileEditor);
        }
    }
    for(let fileEditor of otherEditors){
        document.getElementById(`nav-${fileEditor.id}`).classList.add("d-none");
    }
    for(let fileEditor of possibleEditors){
        document.getElementById(`nav-${fileEditor.id}`).classList.remove("d-none");
    }
    if(possibleEditors[0]){
        const tabEl = document.getElementById(`${possibleEditors[0].id}-tab`);
        const bsTab = new window.bootstrap.Tab(tabEl)
        bsTab.show()
    }
}

function refreshModifiedIndicator() {
    for(let path of Object.keys(fileContents)){
        let entry = document.querySelector(`[data-path="${path}"]`) ;
        let isModified = fileContents[path].lastSaveContent !== fileContents[path].currentContent;
        if (isModified) {
            entry.classList.add("modified-file");
        }else{
            entry.classList.remove("modified-file");
        }
    }
}

async function saveModifications() {
    if(currentFileEditor){
        await updateContentFromEditor(currentFileEditor) ;
    }
    for(let path of Object.keys(fileContents)){
        let isModified = fileContents[path].lastSaveContent !== fileContents[path].currentContent;
        if (isModified) {
            let response = await doSave(fileContents[path].currentContent, path);
            if (!response.ok) {
                throw await response.text() ;
            }
            fileContents[path].lastSaveContent = fileContents[path].currentContent;
        }
    }
    refreshModifiedIndicator() 
    alert('File saved successfully.');
}

async function doSave(content, filePath){
    const formData = new FormData();
    formData.append('path', filePath);
    formData.append('file', new Blob([content], { type: 'application/octet-stream' }), 'filename');

    return await window.openbamz.fetchAuth(`/code-editor/files/${window.OPENBAMZ_APP}/save`, {
        method: 'POST',
        body: formData
    });
    
}

document.getElementById('save-button').addEventListener('click', saveModifications);


document.getElementById('filter').addEventListener('input', (e) => {
    const filterText = e.target.value.toLowerCase();
    document.querySelectorAll('#file-list li').forEach(item => {
        const itemName = item.textContent.toLowerCase();
        item.style.display = itemName.includes(filterText) ? '' : 'none';
    });
});


document.getElementById('upload-button').addEventListener('click', () => {
    document.getElementById('file-input').click();
});

let uploadedFile = null;

document.getElementById('file-input').addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        uploadedFile = e.target.files[0];
        document.getElementById('file-path').value = uploadedFile.name;
        document.getElementById('upload-section').style.display = 'block';
    }
});

document.getElementById('submit-upload').addEventListener('click', () => {
    if (!uploadedFile) return;

    const path = document.getElementById('file-path').value;
    const reader = new FileReader();

    reader.onload = async function () {

        let response = await doSave(reader.result, path)
        
        if (response.ok) {
            alert('File uploaded successfully.');
            loadFileTree();
            document.getElementById('upload-section').style.display = 'none';
        } else {
            alert('Error uploading file.');
        }
    };

    reader.readAsArrayBuffer(uploadedFile);
});
/*
function handleDragOver(e) {
    e.preventDefault();
    document.getElementById('editor-section').classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    document.getElementById('editor-section').classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    document.getElementById('editor-section').classList.remove('drag-over');

    if (e.dataTransfer.files.length > 0) {
        uploadedFile = e.dataTransfer.files[0];
        document.getElementById('file-path').value = uploadedFile.name;
        document.getElementById('upload-section').style.display = 'block';
    }
}
*/
// document.getElementById('editor-section').addEventListener('dragover', handleDragOver);
// document.getElementById('editor-section').addEventListener('dragleave', handleDragLeave);
// document.getElementById('editor-section').addEventListener('drop', handleDrop);


document.getElementById('download-button').addEventListener('click', async () => {
    try {
        // Fetch the file from the URL
        const response = await window.openbamz.fetchAuth(`/code-editor/zip/${window.OPENBAMZ_APP}`);
        
        // Check if the response is OK (status code in the range 200-299)
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        
        // Convert the response to a Blob
        const blob = await response.blob();
        
        // Create a link element
        const link = document.createElement('a');
        
        // Create a URL for the Blob and set it as the href attribute of the link
        const url = URL.createObjectURL(blob);
        link.href = url;
        
        // Set the file name (optional)
        link.download = `${window.OPENBAMZ_APP}.zip`;
        
        // Append the link to the document (required for Firefox)
        document.body.appendChild(link);
        
        // Programmatically click the link to trigger the download
        link.click();
        
        // Clean up by removing the link from the document and revoking the Object URL
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading file:', error);
      }
});



document.getElementById('select-dir').addEventListener('click', async () => {
    try {
      // Request permission to access the directory
      const dirHandle = await window.showDirectoryPicker();
      // Recursively read files and upload them
      await processDirectory(dirHandle);
    } catch (err) {
      console.error('Error accessing directory:', err);
    }
  });

  async function processDirectory(dirHandle, basePath = []) {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        await uploadFile(file, basePath.concat(file.name).join("/"));
      } else if (entry.kind === 'directory') {
        await processDirectory(entry,  basePath.concat(entry.name));
      }
    }
    loadFileTree();
  }

  async function uploadFile(file, filePath) {
    try {

        const formData = new FormData();
        formData.append('path', filePath);
        formData.append('file', file);
    
        let response = await window.openbamz.fetchAuth(`/code-editor/files/${window.OPENBAMZ_APP}/save`, {
            method: 'POST',
            body: formData
        });

      if (response.ok) {
        console.log(`${file.name} uploaded successfully`);
      } else {
        console.error(`Error uploading ${file.name}`);
      }
    } catch (err) {
      console.error('Error uploading file:', err);
    }
  }

loadFileTree();
