
export const prepareDatabase = async () => {

}

export const cleanDatabase = async () => {
}


export const initPlugin = async ({ context }) => {
    
    // Register GrapesJS to the standard code editor plugin
    context.plugins.grapesJsEditor.registerExtension({
        plugin: "grapesjs-bootstrap5",
        extensionPath: "/plugin/:appName/grapesjs-bootstrap5/grapesjs-bootstrap5-extension.mjs"
    });

    return {
        // path in which the plugin provide its front end files
        frontEndPath: "html",
        // router: router,
        //menu entries
        // menu: [
        //     {
        //         name: "admin", entries: [
        //             { name: "Grapjs editor", link: "/plugin/:appName/grapesjs-editor/" }
        //         ]
        //     }
        // ]
    }
}