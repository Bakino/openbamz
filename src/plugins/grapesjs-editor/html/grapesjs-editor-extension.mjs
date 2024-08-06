//import {grapesjs} from 'https://esm.run/grapesjs';
import { grapesjs } from 'https://cdn.jsdelivr.net/npm/grapesjs@0.21.12/+esm'
import * as prettier from "https://cdn.jsdelivr.net/npm/prettier@3.3.3/standalone.mjs";
import prettierPluginHTML from "https://cdn.jsdelivr.net/npm/prettier@3.3.3/plugins/html.mjs";
import prettierPluginCSS from "https://cdn.jsdelivr.net/npm/prettier@3.3.3/plugins/postcss.mjs";

//load extensions
import extensions from "/grapesjs-editor/grapesjs-extensions" ;

let allowedExtensions;
async function prepareExtensions(){
    if(allowedExtensions){ return ; }
    let response = await window.openbamz.fetchAuth(`/grapesjs-editor/grapesjs-extensions-allowed/${window.OPENBAMZ_APP}`)
    let allowed = await response.json();
    allowedExtensions = extensions.filter(extension=>allowed.some(e=>e.plugin === extension.plugin));
}

let currentDoc = null;

export default {
    editors: [
        {
            id: "grapesjs-editor",
            mimeTypes: ["text/html"],
            name: "GrapesJS editor",
            init: async function({container, notifyModification}){
                await prepareExtensions();
                window.openbamz.loadCss("https://cdn.jsdelivr.net/npm/grapesjs@0.21.12/dist/css/grapes.min.css")
                container.innerHTML = `
                <style>
                    /* make the label of properties full width */
                    .gjs-trt-trait { flex-wrap: wrap; }
                    .gjs-label-wrp { width: 100%; }
                </style>
                <div id="grapesjs-editor-container" style="height:100%; width: 100%">
                
                </div>`;
        
                const config = {
                    container: '#grapesjs-editor-container',
                    protectedCss: '',
                    height: '100%',
                    allowScripts: 1,
                    canvas: {
                        styles: [
                        ]
                    },
                    plugins: [],
                    pluginsOpts: {}
                };

                for(let extension of allowedExtensions){
                    if(extension.configure){
                        extension.configure({config});
                    }
                }

                window.grapesjsEditor = grapesjs.init(config);
                window.grapesjsEditor.on('update', () => {
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
                window.grapesjsEditor.setComponents(body.innerHTML);
                window.grapesjsEditor.setStyle(style?.innerHTML??"");
                window.grapesjsEditor.refresh();                
            },
            getEditedContent: async function(){
                currentDoc.htmlDoc.body.innerHTML = window.grapesjsEditor.getHtml({ cleanId: true });
                if(currentDoc.style){
                    currentDoc.style.innerHTML = await prettier.format( window.grapesjsEditor.getCss().trim(), {
                        parser: 'css',
                        plugins: [prettierPluginCSS]
                    });
                }
                return await prettier.format(currentDoc.htmlDoc.documentElement.innerHTML.trim(), {
                    parser: 'html',
                    htmlWhitespaceSensitivity: "ignore",
                    plugins: [prettierPluginHTML]
                });
            }
        }
    ]
}
