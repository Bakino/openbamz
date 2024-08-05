

export const prepareDatabase = async () => {

}

export const cleanDatabase = async () => {
}


export const initPlugin = async ({context}) => {
    
    context.plugins.codeEditor.registerExtension({
        plugin: "grapejs-editor",
        extensionPath: "/plugin/:appName/grapejs-editor/grapejs-editor-extension.mjs"
    });

    return {
        // path in which the plugin provide its front end files
        frontEndPath: "html",
        //router: router,
        //menu entries
        menu: [
            {
                name: "admin", entries: [
                    { name: "Grapjs editor", link: "/plugin/:appName/grapejs-editor/" }
                ]
            }
        ]
    }
}