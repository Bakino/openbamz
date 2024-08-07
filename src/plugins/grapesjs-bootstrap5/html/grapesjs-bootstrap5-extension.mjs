import { typeAttributeCheckbox, typeClassCheckbox, typeClassSelect, typeAttributeMargin, typeAttributeMarginXY } from "./traits.mjs";

function createCustomTrait({ inputHtml, onPropertyChange, onComponentSelected }){
    return {
        templateLabel() {
            const { ppfx } = this;
            return `<div class="${ppfx}label d-flex" title="${this.model.get("title")}">${this.model.get("label")}</div>`;
        },

        //noLabel: true,
        createInput({ trait }) {
            let compHtml;
            if(typeof(inputHtml) === "function"){
                var md = this.model;
                var options = md.get('options') || [];
                compHtml = inputHtml({options, trait}) ;
            }else{
                compHtml = inputHtml ;
            }
            if(typeof(compHtml) === "string"){
                const el = document.createElement('div');
                el.innerHTML = compHtml ;
                return el;
            }else{
                return compHtml;
            }
        },
    
        onEvent({ elInput, component, event, trait }) {
            if(onPropertyChange){
                onPropertyChange({ elInput, component, event, trait })
            }
        },
        onUpdate({ elInput, component, trait }) {
            if(onComponentSelected){
                onComponentSelected({ elInput, component, trait })
            }
        }
    };
}

const BOOTSTRAP_LAYOUT = [    
    {
        id: "bs-grid",
        classId: "row",
        url: "https://getbootstrap.com/docs/5.3/layout/grid/",
        icon: `<div class="row ms-1 me-1">
    <div class="col-4 p-0 bg-info border rounded-1">... </div>
    <div class="col-4 p-0 bg-info border rounded-1">... </div>
    <div class="col-4 p-0 bg-info border rounded-1">... </div>
  </div>`,
        label: "Grid",
        content: `<div class="row">
    <div class="col">
      Column
    </div>
    <div class="col">
      Column
    </div>
    <div class="col">
      Column
    </div>
  </div>`,
        properties: [
            { 
                label: "Vertical Alignment",
                classPrefix: "align-items",
                classes: [ "", "start",  "center", "end"],
                url: "https://getbootstrap.com/docs/5.3/layout/columns/#vertical-alignment"
            },
            { 
                label: "Horizontal Alignment",
                classPrefix: "justify-content",
                classes: [ "", "start",  "center", "end", "around", "between", "evenly"],
                url: "https://getbootstrap.com/docs/5.3/layout/columns/#horizontal-alignment"
            },
            { 
                label: "Number of columns",
                classPrefix: "row-cols",
                classes: [ "", "1",  "2", "3", "4", "5", "6", "auto"],
                url: "https://getbootstrap.com/docs/5.3/layout/grid/#row-columns"
            },
            { 
                label: "Gutters",
                marginClassXY: "g",
                url: "https://getbootstrap.com/docs/5.3/layout/gutters/"
            },
        ]
    },
]

const BOOTSTRAP_COMPONENTS = [    
    {
        id: "bs-alerts",
        classId: "alert",
        url: "https://getbootstrap.com/docs/5.1/components/alerts/",
        icon: `<div class="alert alert-primary p-1 mb-0" role="alert">
        <div class="d-flex align-items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" class="bi bi-exclamation-triangle-fill flex-shrink-0 me-2" viewBox="0 0 16 16" role="img" aria-label="Warning:">
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
        </svg>
        <div>...</div>
        </div>
        </div>`,
        label: "Alert",
        content: `<div class="alert alert-primary" role="alert">
        <div class="d-flex align-items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" class="bi bi-exclamation-triangle-fill flex-shrink-0 me-2" viewBox="0 0 16 16" role="img" aria-label="Warning:">
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
        </svg>
        <div>
            Your alert message
        </div>
        </div>
      </div>`,
        properties: [
            { 
                label: "Color",
                classPrefix: "alert",
                url: "https://getbootstrap.com/docs/5.3/components/alerts/#examples"
            },
            { 
                label: "Dismissible",
                url: "https://getbootstrap.com/docs/5.3/components/alerts/#dismissing",
                customType: {
                    inputHtml:  `<input type="checkbox" class="form-check-input" style="width: auto; margin-left: 2px; appearance: auto;" /> `,
                    onPropertyChange: ({elInput, component })=>{
                        const input = elInput.querySelector('input');

                        if (input.checked) {
                            component.addClass(["alert-dismissible","fade","show"]);
                            component.append('<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>');
                        } else {
                            let buttonClose = component.find('.btn-close');
                            for(let bt of buttonClose){
                                bt.remove() ;
                            }
                            component.removeClass(["alert-dismissible","fade","show"]);
                        }
                    },
                    onComponentSelected: ({elInput, component })=>{
                        const input = elInput.querySelector('input');

                        input.checked = component.getClasses().includes("alert-dismissible");
                    },
                }
            }
        ]
    },
    {
        id: "bs-accordion",
        classId: "accordion",
        url: "https://getbootstrap.com/docs/5.1/components/accordion/",
        icon: `<style>
        .gjs-block__media .accordion-button::after {width: 10px;height: 10px; background-size: 10px;}
        .gjs-block__media .accordion-button {font-size: 10px;}
        </style><div class="accordion mb-0">
  <div class="accordion-item">
    <div class="accordion-header">
      <button class="accordion-button collapsed ps-2 pe-1 py-0" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseOne" aria-expanded="false" aria-controls="flush-collapseOne">
        ...
      </button>
    </div>
  </div>
  <div class="accordion-item">
    <div class="accordion-header">
      <button class="accordion-button bg-info collapsed ps-2 pe-1 py-0" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseTwo" aria-expanded="false" aria-controls="flush-collapseTwo">
        ...
      </button>
    </div>

  </div></div>`,
        label: "Accordion",
        content: `<div class="accordion" id="accordionExample">
  <div class="accordion-item">
    <h2 class="accordion-header">
      <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
        Accordion Item #1
      </button>
    </h2>
    <div id="collapseOne" class="accordion-collapse collapse show" data-bs-parent="#accordionExample">
      <div class="accordion-body">
        <strong>This is the first item's accordion body.</strong> It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the <code>.accordion-body</code>, though the transition does limit overflow.
      </div>
    </div>
  </div>
  <div class="accordion-item">
    <h2 class="accordion-header">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
        Accordion Item #2
      </button>
    </h2>
    <div id="collapseTwo" class="accordion-collapse collapse" data-bs-parent="#accordionExample">
      <div class="accordion-body">
        <strong>This is the second item's accordion body.</strong> It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the <code>.accordion-body</code>, though the transition does limit overflow.
      </div>
    </div>
  </div>
  <div class="accordion-item">
    <h2 class="accordion-header">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
        Accordion Item #3
      </button>
    </h2>
    <div id="collapseThree" class="accordion-collapse collapse" data-bs-parent="#accordionExample">
      <div class="accordion-body">
        <strong>This is the third item's accordion body.</strong> It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the <code>.accordion-body</code>, though the transition does limit overflow.
      </div>
    </div>
  </div>
</div>`,
        properties: [
            { 
                label: "Flush",
                classToggle: "accordion-flush",
                url: "https://getbootstrap.com/docs/5.3/components/accordion/#flush"
            },
        ]
    },
    {
        id: "bs-badge",
        classId: "badge",
        url: "https://getbootstrap.com/docs/5.1/components/badge/",
        icon: `<span class="badge text-bg-info">badge</span>`,
        label: "Badge",
        content: `<span class="badge text-bg-secondary">badge</span>`,
        properties: [
            { 
                label: "Color",
                classPrefix: "text-bg",
                url: "https://getbootstrap.com/docs/5.3/components/badge/#background-colors"
            },
            { 
                label: "Pill",
                classToggle: "rounded-pill",
                url: "https://getbootstrap.com/docs/5.3/components/badge/#pill-badges"
            },
        ]
    },
    {
        id: "bs-breadcrumb",
        classId: "breadcrumb",
        url: "https://getbootstrap.com/docs/5.1/components/breadcrumb/",
        icon: `<nav aria-label="breadcrumb">
  <ol class="breadcrumb pt-1" style="font-size: 0.8em;">
    <li class="breadcrumb-item font-weight-bold">Bread</li>
    <li class="breadcrumb-item active text-white" style="--bs-breadcrumb-item-padding-x:2px; --bs-breadcrumb-divider-color: white" aria-current="page">Crumb</li>
  </ol>
</nav>`,
        label: "Breadcrumb",
        content: `<nav aria-label="breadcrumb">
  <ol class="breadcrumb">
    <li class="breadcrumb-item"><a href="#">Home</a></li>
    <li class="breadcrumb-item active" aria-current="page">Library</li>
  </ol>
</nav>`,
        properties: [
            
        ]
    },
    {
        id: "bs-button",
        classId: "btn",
        url: "https://getbootstrap.com/docs/5.1/components/buttons/",
        icon: `<button type="button" class="btn btn-info btn-sm">Btn</button>`,
        label: "Button",
        content: `<button type="button" class="btn btn-primary">Primary</button>`,
        properties: [
            { 
                label: "Color",
                classPrefix: "btn",
                classes: [
                    "primary", "secondary", "success", "danger", 
                    "warning", "info", "light", "dark", 
                    "outline-primary", "outline-secondary", "outline-success", "outline-danger", 
                    "outline-warning", "outline-info", "outline-light", "outline-dark", 
                    "link"],
                url: "https://getbootstrap.com/docs/5.3/components/buttons/#variants"
            },
            { 
                label: "Size",
                classPrefix: "btn",
                classes: [ "", "sm",  "lg"],
                url: "https://getbootstrap.com/docs/5.3/components/buttons/#sizes"
            },
            { 
                label: "Disabled",
                attributeToggle: "disabled",
                url: "https://getbootstrap.com/docs/5.3/components/buttons/#disabled-state"
            },
            { 
                label: "Toggle button",
                attributeToggle: {"data-bs-toggle": "button"},
                url: "https://getbootstrap.com/docs/5.3/components/buttons/#toggle-states"
            },
        ]
    },
    {
        id: "bs-button-group",
        classId: "btn-group",
        url: "https://getbootstrap.com/docs/5.3/components/button-group/",
        icon: `<div class="btn-group btn-group-sm" role="group" aria-label="Basic example">
  <button type="button" class="btn btn-info ps-1 pe-0">Btn</button>
  <button type="button" class="btn btn-primary ps-0 pe-1">Grp</button>
</div>`,
        label: "Button group",
        content: `<div class="btn-group" role="group" aria-label="Basic example">
  <button type="button" class="btn btn-primary">Left</button>
  <button type="button" class="btn btn-primary">Middle</button>
  <button type="button" class="btn btn-primary">Right</button>
</div>`,
        properties: [
            { 
                label: "Size",
                classPrefix: "btn-group",
                classes: [ "", "sm",  "lg"],
                url: "https://getbootstrap.com/docs/5.3/components/button-group/#sizing"
            },
            { 
                label: "Vertical",
                classToggle: "btn-group-vertical",
                url: "https://getbootstrap.com/docs/5.3/components/button-group/#vertical-variation"
            }
        ]
    },
    {
        id: "bs-button-toolbar",
        classId: "btn-toolbar",
        url: "https://getbootstrap.com/docs/5.3/components/button-group/#button-toolbar",
        icon: `<div class="btn-group btn-group-sm" role="group" aria-label="Basic example">
  <button type="button" class="btn btn-info ps-1 pe-0">Tool</button>
  <button type="button" class="btn btn-primary ps-0 pe-1">Bar</button>
</div>`,
        label: "Button toolbar",
        content: `<div class="btn-toolbar" role="toolbar" aria-label="Toolbar with button groups">
  <div class="btn-group me-2" role="group" aria-label="First group">
    <button type="button" class="btn btn-primary">1</button>
    <button type="button" class="btn btn-primary">2</button>
    <button type="button" class="btn btn-primary">3</button>
    <button type="button" class="btn btn-primary">4</button>
  </div>
  <div class="btn-group me-2" role="group" aria-label="Second group">
    <button type="button" class="btn btn-secondary">5</button>
    <button type="button" class="btn btn-secondary">6</button>
    <button type="button" class="btn btn-secondary">7</button>
  </div>
  <div class="btn-group" role="group" aria-label="Third group">
    <button type="button" class="btn btn-info">8</button>
  </div>
</div>`,
        properties: [
        ]
    }
]

const BOOTSTRAP_BLOCKS = [
    {
        name: "Layout",
        blocks: BOOTSTRAP_LAYOUT
    },
    {
        name: "Components",
        blocks: BOOTSTRAP_COMPONENTS
    }
]

const IMG_HELP = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-question-circle" viewBox="0 0 16 16">
<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"></path>
<path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286m1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94"></path></svg>`;

function bootstrapPlugin(editor) {
    editor.Traits.addType('class_select', createCustomTrait(typeClassSelect));
    editor.Traits.addType('class_checkbox', createCustomTrait(typeClassCheckbox));
    editor.Traits.addType('attribute_checkbox', createCustomTrait(typeAttributeCheckbox));
    editor.Traits.addType('attribute_margin', createCustomTrait(typeAttributeMargin));
    editor.Traits.addType('attribute_margin_xy', createCustomTrait(typeAttributeMarginXY));
    const defaultType = editor.Components.getType('default');
    const defaultModel = defaultType.model;

    const contexts = [
        'primary',
        'secondary',
        'success',
        'info',
        'warning',
        'danger',
        'light',
        'dark',
    ]; 

    
    for(let category of BOOTSTRAP_BLOCKS){
        for(let block of category.blocks){
            editor.Blocks.add(block.id, {
                media: `<div class="position-relative">${block.icon}${block.url?`
                    <div style="position: absolute; top: -13px; right:-9px; z-index: 999">
                    ${IMG_HELP}
                    </div>`:""}</div>`,
                label: block.label,
                attributes: {
                    title: block.label,
                    onclick: block.url?`(event.offsetX>70 && event.offsetY<10)?window.open('${block.url}'):''`:""
                },
                category: category.name,
                content:  block.content
            });
            let traits = [];
            for(let trait of defaultModel.prototype.defaults.traits){
                traits.push(trait) ;
            }
            for(let prop of block.properties){
                let trait = {
                    name: prop.name??(block.id+"_"+prop.label),
                    title: prop.label,
                    label: prop.label+`${prop.url?` <a href="${prop.url}" target="_blank" class="ms-auto text-decoration-none text-white">${IMG_HELP}</a>`:""}`
                }
                if(prop.classPrefix){
                    trait.type = 'class_select' ;
                    let classes = prop.classes;
                    if(!classes){
                        classes = contexts;
                    }
                    trait.options = [
                        ... classes.map((v) => { return {value: `${prop.classPrefix}-${v}`, name: v} ; }),
                    ] ;
                }else if(prop.classToggle){
                    trait.type = 'class_checkbox' ;
                    trait.options = prop.classToggle ;
                }else if(prop.attributeToggle){
                    trait.type = 'attribute_checkbox' ;
                    trait.options = prop.attributeToggle ;
                }else if(prop.marginClass){
                    trait.type = 'attribute_margin' ;
                    trait.options = prop.marginClass ;
                }else if(prop.marginClassXY){
                    trait.type = 'attribute_margin_xy' ;
                    trait.options = prop.marginClassXY ;
                }else if(prop.customType){
                    editor.Traits.addType(block.id+"_"+prop.label, createCustomTrait(prop.customType));
                    trait.type = block.id+"_"+prop.label ;
                }
                traits.push(trait) ;
            }
            //traits.push(traitMargin) ;
            editor.Components.addType(block.id, {
                isComponent: (el) => {
                    if(block.classId){
                        if(el && el.classList && el.classList.contains(block.classId)) {
                            return {type: block.id};
                        }
                    }
                },
                model: {
                    defaults: {
                        "custom-name": block.label,
                        //tagName: 'card',
                        draggable: true,
                        droppable: true,
                        traits: traits
                    }
                },
            });
        }
    }

    //add default trait for all types
    let types = editor.Components.getTypes();
    for(let type of types){
        if(type.id !== "default"){
            editor.Components.addType(type.id, {
                isComponent: type.isComponent,
                extend: type.id,
                model: { 
                    defaults: {
                        traits: type.model.prototype.defaults.traits.concat([
                            {
                                name: "bs-margin",
                                title: "Margin",
                                label: `Margin <a href="https://getbootstrap.com/docs/5.3/utilities/spacing/#margin-and-padding" target="_blank" class="ms-auto text-decoration-none text-white">${IMG_HELP}</a>`,
                                type: 'attribute_margin',
                                options:'m'
                            },
                            {
                                name: "bs-padding",
                                title: "Padding",
                                label: `Padding <a href="https://getbootstrap.com/docs/5.3/utilities/spacing/#margin-and-padding" target="_blank" class="ms-auto text-decoration-none text-white">${IMG_HELP}</a>`,
                                type: 'attribute_margin',
                                options:'p'
                            },
                        ])
                    }
                }, 
            });
        }
    }

}

export default {
    configure: async function({config}){
        config.plugins.push(bootstrapPlugin) ;
        config.canvas.styles.push("https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css")

        
        window.openbamz.loadCss("https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css")
    },       
}
