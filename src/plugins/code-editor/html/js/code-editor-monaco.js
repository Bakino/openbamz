/*global monaco*/
let editor;
let currentFilePath = '';
let originalContent = '';
let uploadedFile = null;

require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.31.0/min/vs' } });
require(['vs/editor/editor.main'], function () {
    editor = monaco.editor.create(document.getElementById('editor'), {
        value: '',
        language: 'plaintext',
        theme: 'vs-dark'
    });

    // Track content change
    editor.onDidChangeModelContent(() => {
        const currentContent = editor.getValue();
        if (currentContent !== originalContent) {
            setModified(true);
        } else {
            setModified(false);
        }
    });

    // Save on Ctrl+S / Cmd+S
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
        saveCurrentFile();
    });
});

function setEditorLanguage(mimeType) {
    let language = 'plaintext'; // default

    if (mimeType.startsWith('text/')) {
        if (mimeType === 'text/javascript') language = 'javascript';
        else if (mimeType === 'text/html') language = 'html';
        else if (mimeType === 'text/css') language = 'css';
        else if (mimeType === 'text/markdown') language = 'markdown';
        else if (mimeType === 'text/xml') language = 'xml';
        else language = mimeType.split('/')[1]; // fallback to file extension as language
    }

    monaco.editor.setModelLanguage(editor.getModel(), language);
}

function loadFileTree() {
    window.openbamz.fetchAuth(`/code-editor/files/${window.OPENBAMZ_APP}`)
        .then(response => response.json())
        .then(files => {
            const fileList = document.getElementById('file-list');
            fileList.innerHTML = createFileTree(files);
            addFileClickHandlers();
        });
}

function createFileTree(files) {
    return files.map(file => {
        if (file.type === 'directory') {
            return `<li class="directory">${file.name}<ul>${createFileTree(file.children)}</ul></li>`;
        }
        return `<li class="file" data-path="${file.name}" data-mime="${file.mimeType}">${file.name}</li>`;
    }).join('');
}

function addFileClickHandlers() {
    document.querySelectorAll('.file').forEach(fileElement => {
        fileElement.addEventListener('click', () => {
            if (currentFilePath && setModified(false)) return; // Prevent changing files if unsaved changes

            currentFilePath = fileElement.getAttribute('data-path');
            window.openbamz.fetchAuth(`/code-editor/files/${window.OPENBAMZ_APP}/content?path=${currentFilePath}`)
                .then(response => response.text())
                .then(content => {
                    editor.setValue(content);
                    originalContent = content;
                    setModified(false);
                    setEditorLanguage(fileElement.getAttribute('data-mime'));
                });
        });
    });
}

function setModified(isModified) {
    if (isModified) {
        if (!document.querySelector(`[data-path="${currentFilePath}"]`).textContent.endsWith('*')) {
            document.querySelector(`[data-path="${currentFilePath}"]`).textContent += '*';
        }
        document.getElementById('save-button').disabled = false;
        return true;
    } else {
        const fileElement = document.querySelector(`[data-path="${currentFilePath}"]`);
        fileElement.textContent = fileElement.textContent.replace(/\*$/, '');
        document.getElementById('save-button').disabled = true;
        return false;
    }
}

async function saveCurrentFile() {
    const currentContent = editor.getValue();
    if (currentContent === originalContent) return; // No changes to save

    let response = await doSave(currentContent, currentFilePath);
    if (response.ok) {
        originalContent = currentContent;
        setModified(false);
        alert('File saved successfully.');
    } else {
        alert('Error saving file.');
    }
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

document.getElementById('save-button').addEventListener('click', saveCurrentFile);

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

document.getElementById('editor-section').addEventListener('dragover', handleDragOver);
document.getElementById('editor-section').addEventListener('dragleave', handleDragLeave);
document.getElementById('editor-section').addEventListener('drop', handleDrop);

loadFileTree();
