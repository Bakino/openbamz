export function panelDevices(editor){
    const deviceManager = editor.DeviceManager;
    deviceManager.add({
        id: 'xs',
        name: 'XS',
        width: '425px'
    });
    deviceManager.add({
        id: 'sm',
        name: 'SM',
        width: '576px'
    });
    deviceManager.add({
        id: 'md',
        name: 'MD',
        width: '768px'
    });
    deviceManager.add({
        id: 'lg',
        name: 'LG',
        width: '992px'
    });
    deviceManager.add({
        id: 'xl',
        name: 'XL',
        width: '1200px'
    });
    deviceManager.add({
        id: 'xxl',
        name: 'XXL',
        width: '1400px'
    });


    editor.getConfig().showDevices = 0;
    const panels = editor.Panels;
    const commands = editor.Commands;
    var panelDevices = panels.addPanel({id: 'devices-buttons'});
    var deviceBtns = panelDevices.get('buttons');
    deviceBtns.add([
        {
            id: 'deviceXs',
            command: 'set-device-xs',
            label: `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" class="bi bi-phone" viewBox="0 0 16 16">
  <path d="M11 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM5 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/>
  <path d="M8 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
</svg>`,
            className: '',
            active: false,
            attributes: {'title': "XS"},
        },
        {
            id: 'deviceSm',
            command: 'set-device-sm',
            label: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-phone" viewBox="0 0 16 16">
  <path d="M11 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM5 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/>
  <path d="M8 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
</svg>`,
            active: false,
            attributes: {'title': "SM"},
        },
        {
            id: 'deviceMd',
            command: 'set-device-md',
            label: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-tablet" viewBox="0 0 16 16">
  <path d="M12 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/>
  <path d="M8 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
</svg>`,
            active: false,
            attributes: {'title': "MD"},
        },
        {
            id: 'deviceLg',
            command: 'set-device-lg',
            label: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-laptop" viewBox="0 0 16 16">
  <path d="M13.5 3a.5.5 0 0 1 .5.5V11H2V3.5a.5.5 0 0 1 .5-.5zm-11-1A1.5 1.5 0 0 0 1 3.5V12h14V3.5A1.5 1.5 0 0 0 13.5 2zM0 12.5h16a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 12.5"/>
</svg>`,
            active: false,
            attributes: {'title': "LG"},
        },
        {
            id: 'deviceXl',
            command: 'set-device-xl',
            label: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-display" viewBox="0 0 16 16">
  <path d="M0 4s0-2 2-2h12s2 0 2 2v6s0 2-2 2h-4q0 1 .25 1.5H11a.5.5 0 0 1 0 1H5a.5.5 0 0 1 0-1h.75Q6 13 6 12H2s-2 0-2-2zm1.398-.855a.76.76 0 0 0-.254.302A1.5 1.5 0 0 0 1 4.01V10c0 .325.078.502.145.602q.105.156.302.254a1.5 1.5 0 0 0 .538.143L2.01 11H14c.325 0 .502-.078.602-.145a.76.76 0 0 0 .254-.302 1.5 1.5 0 0 0 .143-.538L15 9.99V4c0-.325-.078-.502-.145-.602a.76.76 0 0 0-.302-.254A1.5 1.5 0 0 0 13.99 3H2c-.325 0-.502.078-.602.145"/>
</svg>`,
            text: 'XL',
            attributes: {'title': "XL"},
            active: 1
        },
        {
            id: 'deviceXXl',
            command: 'set-device-xxl',
            label: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-tv" viewBox="0 0 16 16">
  <path d="M2.5 13.5A.5.5 0 0 1 3 13h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5M13.991 3l.024.001a1.5 1.5 0 0 1 .538.143.76.76 0 0 1 .302.254c.067.1.145.277.145.602v5.991l-.001.024a1.5 1.5 0 0 1-.143.538.76.76 0 0 1-.254.302c-.1.067-.277.145-.602.145H2.009l-.024-.001a1.5 1.5 0 0 1-.538-.143.76.76 0 0 1-.302-.254C1.078 10.502 1 10.325 1 10V4.009l.001-.024a1.5 1.5 0 0 1 .143-.538.76.76 0 0 1 .254-.302C1.498 3.078 1.675 3 2 3zM14 2H2C0 2 0 4 0 4v6c0 2 2 2 2 2h12c2 0 2-2 2-2V4c0-2-2-2-2-2"/>
</svg>`,
            text: 'XXL',
            attributes: {'title': "XXL"},
            active: 1
        },
    ]);

    

    commands.add('set-device-xs', {
        stop: function(){} ,
        run: function(editor) {
            editor.setDevice('xs');
        }
    });
    commands.add('set-device-sm', {
        stop: function(){} ,
        run: function(editor) {
            editor.setDevice('sm');
        }
    });
    commands.add('set-device-md', {
        stop: function(){} ,
        run: function(editor) {
            editor.setDevice('md');
        }
    });
    commands.add('set-device-lg', {
        stop: function(){} ,
        run: function(editor) {
            editor.setDevice('lg');
        }
    });
    commands.add('set-device-xl', {
        stop: function(){} ,
        run: function(editor) {
            editor.setDevice('xl');
        }
    });
    commands.add('set-device-xxl', {
        stop: function(){} ,
        run: function(editor) {
            //check the editor width, if higher that XXL, display 100%, if smaller, force 1400px
            let editorWidth = editor.config.el.offsetWidth ;
            if(editorWidth){
                let deviceXXL = editor.DeviceManager.getDevices().find(d=>d.id === "xxl") ;
                if(deviceXXL.attributes.width !== "100%"){
                    let deviceWidth = Number(deviceXXL.attributes.width.replace("px", ""));
                    if(editorWidth>deviceWidth){
                        //the editor is larger, set the width to be 100%
                        deviceXXL.attributes.widthMedia = deviceXXL.attributes.width;
                        deviceXXL.attributes.width = "100%"
                    }
                }
            }
            editor.setDevice('xxl');
        }
    });
}