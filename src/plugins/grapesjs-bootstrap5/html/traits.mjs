export const typeClassSelect = {
    inputHtml: ({trait})=>{
        let opts = trait.get('options') || [];

        let allClasses = [];
        for (let opt of opts) {
            if (opt.value) {
                opt.value.split(' ').forEach(v => {
                    if(!v.endsWith("-")){
                        allClasses.push(v);
                    }
                });
            }
        }
        trait.allClasses = allClasses;

        
        const el = document.createElement('div');
        el.innerHTML = `<select class="select-type">
                        ${opts.map(opt => {
            return `<option value="${opt.value}">${opt.name}</option>`;
        }).join("")}
                    </select>`;

        return el;
    }, 
    
    onPropertyChange: ({ elInput, component, trait }) => {
        const selectType = elInput.querySelector('.select-type');

        const existingClasses = component.getClasses().filter(c => trait.allClasses.includes(c));
        let newClasses = [];
        if (selectType.value) {
            newClasses = selectType.value.split(' ');
        }
        const classesToRemove = existingClasses.filter(c => !newClasses.includes(c));
        const classesToAdd = newClasses.filter(c => !existingClasses.includes(c)).filter(c => trait.allClasses.includes(c));
        for (let c of classesToRemove) {
            component.removeClass(c);
        }
        for (let c of classesToAdd) {
            component.addClass(c);
        }
    },
    
    onComponentSelected: ({ elInput, component, trait })=> {

        const existingClasses = component.getClasses().filter(c => trait.allClasses.includes(c));
        const selectType = elInput.querySelector('.select-type');
        let found = false;
        for (let opt of selectType.options) {
            if (opt.value) {
                if (opt.value.split(" ").every(c => existingClasses.includes(c))) {
                    opt.selected = true;
                    found = true;
                    break;
                }
            }
        }
        if (!found) {
            selectType.value = "";
        }
    },
};

export const typeClassCheckbox = {
    inputHtml:  `<input type="checkbox" class="form-check-input" style="width: auto; margin-left: 2px; appearance: auto;" /> `,
    onPropertyChange: ({elInput, component, trait })=>{
        const input = elInput.querySelector('input');
        let opts = trait.get('options') || [];
        if(!Array.isArray(opts)){
            opts = [opts] ;
        }

        if (input.checked) {
            component.addClass(opts);
        } else {
            component.removeClass(opts);
        }
    },
    onComponentSelected: ({elInput, component, trait })=>{
        const input = elInput.querySelector('input');
        let opts = trait.get('options') || [];
        if(!Array.isArray(opts)){
            opts = [opts] ;
        }

        input.checked = opts.every(className=>component.getClasses().includes(className));
    },

};

export const typeAttributeCheckbox = {
    inputHtml:  `<input type="checkbox" class="form-check-input" style="width: auto; margin-left: 2px; appearance: auto;" /> `,
    onPropertyChange: ({elInput, component, trait })=>{
        const input = elInput.querySelector('input');
        let opts = trait.get('options') || [];
        if(typeof(opts) === "string"){
            let objOpt = {};
            objOpt[opts] = true;
            opts = objOpt ;
        }
        let attributes = component.getAttributes();
        if (input.checked) {
            for(let k of Object.keys(opts)){
                attributes[k] = opts[k];
            }
        } else {
            for(let k of Object.keys(opts)){
                delete attributes[k] ;
            }
        }
        component.setAttributes(attributes);
    },
    onComponentSelected: ({elInput, component, trait })=>{
        const input = elInput.querySelector('input');
        let opts = trait.get('options') || [];
        if(typeof(opts) === "string"){
            let objOpt = {};
            objOpt[opts] = true;
            opts = objOpt ;
        }

        let attributes = component.getAttributes();
        input.checked = Object.keys(opts).every(k=>attributes[k]===opts[k]);
    },

};

export const typeAttributeMargin = {
    inputHtml({ trait }) {
        let opts = trait.get('options') || "m";

        let positions = ["s", "e", "t", "b", "x", "y"] ;
        let values = ["0", "1", "2", "3", "4", "5", "auto"] ;

        let allClasses = [];
        let prefix = opts;
        for(let v of values){
            allClasses.push(prefix+"-"+v);
        }
        for(let p of positions){
            for(let v of values){
                allClasses.push(prefix+p+"-"+v);
            }
        }
        trait.allClasses = allClasses;


        const el = document.createElement('div');
        let styleSelect = "border: 1px #dddddd solid; appearance: auto; border-radius: 2px;"
        el.innerHTML = `
        <div>
            <div style="text-align: center">
                <select class="margin-top" style="${styleSelect} width: auto;" >
                    <option value=""></option>
                    ${values.map(v=>`<option value="${v}">${v}</option>`).join("")}
                </select>
            </div>
            <div style="display: flex">
                <select class="margin-left" style="${styleSelect} width: auto;">
                    <option value=""></option>
                    ${values.map(v=>`<option value="${v}">${v}</option>`).join("")}
                </select>
                <div style="flex-grow: 1; text-align: center">
                    <select class="margin-all" style="${styleSelect} width: auto;">
                        <option value=""></option>
                        ${values.map(v=>`<option value="${v}">${v}</option>`).join("")}
                    </select>
                </div>
                <select class="margin-right" style="${styleSelect} width: auto;">
                    <option value=""></option>
                    ${values.map(v=>`<option value="${v}">${v}</option>`).join("")}
                </select>
            </div>
            <div style="text-align: center">
                <select class="margin-bottom" style="${styleSelect} width: auto;">
                    <option value=""></option>
                    ${values.map(v=>`<option value="${v}">${v}</option>`).join("")}
                </select>
            </div>

        </div>
        `;

        const marginTop = el.querySelector(".margin-top");
        const marginLeft = el.querySelector(".margin-left");
        const marginRight = el.querySelector(".margin-right");
        const marginBottom = el.querySelector(".margin-bottom");
        const marginAll = el.querySelector(".margin-all");

        marginAll.addEventListener("change", ()=>{
            if(marginAll.value){
                marginTop.value = null;
                marginLeft.value = null;
                marginRight.value = null;
                marginBottom.value = null;
            }
        }) ;


        return el;
    },

    onPropertyChange: ({ elInput, component, trait }) => {
        let prefix = trait.get('options') || "m";

        const marginTop = elInput.querySelector(".margin-top");
        const marginLeft = elInput.querySelector(".margin-left");
        const marginRight = elInput.querySelector(".margin-right");
        const marginBottom = elInput.querySelector(".margin-bottom");
        const marginAll = elInput.querySelector(".margin-all");

        const existingClasses = component.getClasses().filter(c => trait.allClasses.includes(c));
        let newClasses = [];
        if (marginTop.value) { newClasses.push(prefix+"t-"+marginTop.value) }
        if (marginLeft.value) { newClasses.push(prefix+"s-"+marginLeft.value) }
        if (marginRight.value) { newClasses.push(prefix+"e-"+marginRight.value) }
        if (marginBottom.value) { newClasses.push(prefix+"b-"+marginBottom.value) }
        if (marginAll.value) { newClasses.push(prefix+"-"+marginAll.value) }

        const classesToRemove = existingClasses.filter(c => !newClasses.includes(c));
        const classesToAdd = newClasses.filter(c => !existingClasses.includes(c));
        for (let c of classesToRemove) {
            component.removeClass(c);
        }
        for (let c of classesToAdd) {
            component.addClass(c);
        }
    },
    
    onComponentSelected: ({ elInput, component, trait })=>{
        let prefix = trait.get('options') || "m";

        const marginTop = elInput.querySelector(".margin-top");
        const marginLeft = elInput.querySelector(".margin-left");
        const marginRight = elInput.querySelector(".margin-right");
        const marginBottom = elInput.querySelector(".margin-bottom");
        const marginAll = elInput.querySelector(".margin-all");

        let classTop = component.getClasses().find(c => c.startsWith(prefix+"t-"));
        if(classTop){ marginTop.value = classTop.substring(classTop.indexOf("-")+1) ; }
        let classLeft = component.getClasses().find(c => c.startsWith(prefix+"s-"));
        if(classLeft){ marginLeft.value = classLeft.substring(classLeft.indexOf("-")+1) ; }
        let classRight = component.getClasses().find(c => c.startsWith(prefix+"e-"));
        if(classRight){ marginRight.value = classRight.substring(classRight.indexOf("-")+1) ; }
        let classBottom = component.getClasses().find(c => c.startsWith(prefix+"b-"));
        if(classBottom){ marginBottom.value = classBottom.substring(classBottom.indexOf("-")+1) ; }
        let classAll = component.getClasses().find(c => c.startsWith(prefix+"-"));
        if(classAll){ marginAll.value = classAll.substring(classAll.indexOf("-")+1) ; }
    },
}

export const typeAttributeMarginXY = {
    inputHtml({ trait }) {
        let opts = trait.get('options') || "m";

        let positions = ["x", "y"] ;
        let values = ["0", "1", "2", "3", "4", "5"] ;

        let allClasses = [];
        let prefix = opts;
        for(let v of values){
            allClasses.push(prefix+"-"+v);
        }
        for(let p of positions){
            for(let v of values){
                allClasses.push(prefix+p+"-"+v);
            }
        }
        trait.allClasses = allClasses;


        const el = document.createElement('div');
        let styleSelect = "border: 1px #dddddd solid; appearance: auto; border-radius: 2px;"
        el.innerHTML = `
        <div>
            <div style="display: flex; align-items: center">
                <svg xmlns="http://www.w3.org/2000/svg" style="fill: white; width:14px;height:14px; margin-right: 2px" viewBox="0 0 512 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M406.6 374.6l96-96c12.5-12.5 12.5-32.8 0-45.3l-96-96c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L402.7 224l-293.5 0 41.4-41.4c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-96 96c-12.5 12.5-12.5 32.8 0 45.3l96 96c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 288l293.5 0-41.4 41.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0z"/></svg>
                <select class="margin-x" style="${styleSelect} width: auto;">
                    <option value=""></option>
                    ${values.map(v=>`<option value="${v}">${v}</option>`).join("")}
                </select>
                <svg xmlns="http://www.w3.org/2000/svg" style="fill: white; width:14px;height:14px;" viewBox="0 0 320 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M182.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-96 96c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L128 109.3l0 293.5L86.6 361.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l96 96c12.5 12.5 32.8 12.5 45.3 0l96-96c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 402.7l0-293.5 41.4 41.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-96-96z"/></svg>
                <select class="margin-y" style="${styleSelect} width: auto;">
                    <option value=""></option>
                    ${values.map(v=>`<option value="${v}">${v}</option>`).join("")}
                </select>
                <svg xmlns="http://www.w3.org/2000/svg" style="fill: white; width:14px;height:14px; margin-left: 2px" viewBox="0 0 512 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M278.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-64 64c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l9.4-9.4L224 224l-114.7 0 9.4-9.4c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-64 64c-12.5 12.5-12.5 32.8 0 45.3l64 64c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-9.4-9.4L224 288l0 114.7-9.4-9.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l64 64c12.5 12.5 32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-9.4 9.4L288 288l114.7 0-9.4 9.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3l-64-64c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l9.4 9.4L288 224l0-114.7 9.4 9.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-64-64z"/></svg>
                <div style="flex-grow: 1; text-align: center">
                    <select class="margin-all" style="${styleSelect} width: auto;">
                        <option value=""></option>
                        ${values.map(v=>`<option value="${v}">${v}</option>`).join("")}
                    </select>
                </div>
            </div>


        </div>
        `;

        const marginX = el.querySelector(".margin-x");
        const marginY = el.querySelector(".margin-y");
        const marginAll = el.querySelector(".margin-all");

        marginAll.addEventListener("change", ()=>{
            if(marginAll.value){
                marginX.value = null;
                marginY.value = null;
            }
        }) ;


        return el;
    },

    onPropertyChange: ({ elInput, component, trait }) => {
        let prefix = trait.get('options') || "m";

        const marginX = elInput.querySelector(".margin-x");
        const marginY = elInput.querySelector(".margin-y");
        const marginAll = elInput.querySelector(".margin-all");

        const existingClasses = component.getClasses().filter(c => trait.allClasses.includes(c));
        let newClasses = [];
        if (marginX.value) { newClasses.push(prefix+"x-"+marginX.value) }
        if (marginY.value) { newClasses.push(prefix+"y-"+marginY.value) }
        if (marginAll.value) { newClasses.push(prefix+"-"+marginAll.value) }

        const classesToRemove = existingClasses.filter(c => !newClasses.includes(c));
        const classesToAdd = newClasses.filter(c => !existingClasses.includes(c));
        for (let c of classesToRemove) {
            component.removeClass(c);
        }
        for (let c of classesToAdd) {
            component.addClass(c);
        }
    },
    
    onComponentSelected: ({ elInput, component, trait })=>{
        let prefix = trait.get('options') || "m";

        const marginX = elInput.querySelector(".margin-x");
        const marginY = elInput.querySelector(".margin-y");
        const marginAll = elInput.querySelector(".margin-all");

        let classX = component.getClasses().find(c => c.startsWith(prefix+"x-"));
        if(classX){ marginX.value = classX.substring(classX.indexOf("-")+1) ; }
        let classY = component.getClasses().find(c => c.startsWith(prefix+"y-"));
        if(classY){ marginY.value = classY.substring(classY.indexOf("-")+1) ; }
        let classAll = component.getClasses().find(c => c.startsWith(prefix+"-"));
        if(classAll){ marginAll.value = classAll.substring(classAll.indexOf("-")+1) ; }
    },
}