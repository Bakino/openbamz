/*global monaco*/

let editor;

/*
EDITORS.push({
    id: "display-image",
    mimeTypes: ["image/jpeg", "image/png"],
    name: "Image",
    init: function({container}){
        container.innerHTML = `<div>
        <img id="display-image" />
        </div>`;
    },
    loadFile: function({filePath}){
        document.getElementById("display-image").src = `/app/${window.OPENBAMZ_APP}/${filePath}` ;
    }
})*/


export default {
    editors: [
        {
            id: "monaco-code-editor",
            mimeTypes: ["text/html", "text/javascript", "text/css"],
            name: "Code editor",
            init: async function({container, notifyModification}){
                new Promise((resolve)=>{

                    require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs' }});
                    require(['vs/editor/editor.main'], function () {
                        container.innerHTML = `<div id="monaco-editor-container" style="height:100%; width: 100%; display: flex"></div>`;
            
                        editor = monaco.editor.create(document.getElementById('monaco-editor-container'), {
                            value: '',
                            language: 'plaintext',
                            theme: 'vs-dark',
                            //automaticLayout: true
                        });
            
                        // Track content change
                        editor.onDidChangeModelContent(() => {
                            notifyModification();
                        });
                        
                        resolve();
                    });
                })
            },
            loadFile: async function({filePath, mimeType, getFileContent}){
                let fileContent = await getFileContent({filePath}) ;
                editor.setValue(fileContent.currentContent);
                            
                setEditorLanguage(mimeType);
                editor.layout() ;
            },
            getEditedContent: function(){
                return editor.getValue();
            }
        }
    ]
};

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