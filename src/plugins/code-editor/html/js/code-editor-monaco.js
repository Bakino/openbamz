/*global monaco*/
let editor;
let currentFilePath = '';

require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.31.0/min/vs' } });
require(['vs/editor/editor.main'], function () {
    editor = monaco.editor.create(document.getElementById('editor'), {
        value: '',
        language: 'plaintext',
        theme: 'vs-dark'
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
    fetch('/files')
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
            currentFilePath = fileElement.getAttribute('data-path');
            fetch(`/files/content?path=${currentFilePath}`)
                .then(response => response.text())
                .then(content => {
                    editor.setValue(content);
                    setEditorLanguage(fileElement.getAttribute('data-mime'));
                });
        });
    });
}

document.getElementById('filter').addEventListener('input', (e) => {
    const filterText = e.target.value.toLowerCase();
    document.querySelectorAll('#file-list li').forEach(item => {
        const itemName = item.textContent.toLowerCase();
        item.style.display = itemName.includes(filterText) ? '' : 'none';
    });
});

loadFileTree();
