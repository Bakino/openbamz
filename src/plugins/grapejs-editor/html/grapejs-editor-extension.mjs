//import {grapesjs} from 'https://esm.run/grapesjs';
import { grapesjs } from 'https://cdn.jsdelivr.net/npm/grapesjs@0.21.12/+esm'
import * as prettier from "https://unpkg.com/prettier@3.3.3/standalone.mjs";
import prettierPluginHTML from "https://unpkg.com/prettier@3.3.3/plugins/parser-html.mjs";

let currentDoc = null;

export default {
    editors: [
        {
            id: "grapejs-editor",
            mimeTypes: ["text/html"],
            name: "GrapeJS editor",
            init: async function({container, notifyModification}){
                window.openbamz.loadCss("https://cdn.jsdelivr.net/npm/grapesjs@0.21.12/dist/css/grapes.min.css")
                container.innerHTML = `<div id="grapejs-editor-container" style="height:100%; width: 100%"></div>`;
        
                const config = {
                    container: '#grapejs-editor-container',
                    
                    height: '100%',
                    allowScripts: 1,
                    canvas: {
                        styles: [
                        ]
                    },
                };
                window.grapejsEditor = grapesjs.init(config);
                window.grapejsEditor.on('update', () => {
                    notifyModification();
                })
            },
            loadFile: async function({filePath, getFileContent}){

                
                let fileContent = await getFileContent({filePath}) ;
                let parser = new DOMParser();

                let htmlDoc = parser.parseFromString(fileContent.currentContent,"text/html");
                console.log(htmlDoc);
                let body = htmlDoc.body;
                let head = htmlDoc.head;
                let style = head.querySelector("style") ;



                currentDoc = {
                    htmlDoc, style
                }
                window.grapejsEditor.setComponents(body.innerHTML);
                window.grapejsEditor.setStyle(style?.innerHTML??"");
                window.grapejsEditor.refresh();                
            },
            getEditedContent: function(){
                currentDoc.htmlDoc.body.innerHTML = window.grapejsEditor.getHtml({ cleanId: true });
                if(currentDoc.style){
                    currentDoc.style.innerHTML = window.grapejsEditor.getCss();
                }
                return currentDoc.htmlDoc.documentElement.innerHTML
            }
        }
    ]
}
