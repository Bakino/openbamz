const typeClassSelect = {
    //noLabel: true,
    createInput(/*{ trait }*/) {
        var md = this.model;
        var opts = md.get('options') || [];


        const el = document.createElement('div');
        el.innerHTML = `<select class="select-type">
                        ${opts.map(opt => {
            return `<option value="${opt.value}">${opt.name}</option>`;
        }).join("")}
                    </select>`;

        return el;
    },

    getAllClasses() {
        var opts = this.model.get('options') || [];

        if (this.allClasses) {
            return this.allClasses;
        }
        this.allClasses = [];
        for (let opt of opts) {
            if (opt.value) {
                opt.value.split(' ').forEach(v => {
                    this.allClasses.push(v);
                });
            }
        }
        return this.allClasses;
    },

    onEvent({ elInput, component/*, event*/ }) {
        const selectType = elInput.querySelector('.select-type');

        const existingClasses = component.getClasses().filter(c => this.getAllClasses().includes(c));
        let newClasses = [];
        if (selectType.value) {
            newClasses = selectType.value.split(' ');
        }
        const classesToRemove = existingClasses.filter(c => !newClasses.includes(c));
        const classesToAdd = newClasses.filter(c => !existingClasses.includes(c));
        for (let c of classesToRemove) {
            component.removeClass(c);
        }
        for (let c of classesToAdd) {
            component.addClass(c);
        }
    },
    onUpdate({ elInput, component }) {

        const existingClasses = component.getClasses().filter(c => this.getAllClasses().includes(c));
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

function bootstrapPublic(editor) {
    editor.Traits.addType('class_select', typeClassSelect);
    const defaultType = editor.DomComponents.getType('default');
    const defaultModel = defaultType.model;


    let categoryName = "Bootstrap";

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


    editor.Blocks.add('b-alert', {
        label: `<svg
           xmlns:dc="http://purl.org/dc/elements/1.1/"
           xmlns:cc="http://creativecommons.org/ns#"
           xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
           xmlns:svg="http://www.w3.org/2000/svg"
           xmlns="http://www.w3.org/2000/svg"
           xmlns:xlink="http://www.w3.org/1999/xlink"
           class="gjs-block-svg"
           viewBox="0 0 24 24"
           version="1.1"
           id="svg837">
          <metadata
             id="metadata843">
            <rdf:RDF>
              <cc:Work
                 rdf:about="">
                <dc:format>image/svg+xml</dc:format>
                <dc:type
                   rdf:resource="http://purl.org/dc/dcmitype/StillImage" />
                <dc:title></dc:title>
              </cc:Work>
            </rdf:RDF>
          </metadata>
          <defs
             id="defs841">
            <linearGradient
               id="linearGradient947">
              <stop
                 style="stop-color:#808080;stop-opacity:1;"
                 offset="0"
                 id="stop943" />
              <stop
                 style="stop-color:#808080;stop-opacity:0;"
                 offset="1"
                 id="stop945" />
            </linearGradient>
            <linearGradient
               xlink:href="#linearGradient947"
               id="linearGradient949"
               x1="6.5761589"
               y1="9.611"
               x2="17.423841"
               y2="9.611"
               gradientUnits="userSpaceOnUse" />
          </defs>
          <rect
             style="fill:#808080;fill-opacity:1;stroke:#000000;stroke-width:0.5;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
             id="rect857"
             height="8.7423477"
             width="18.478888"
             y="7.5801926"
             x="2.6420689" />
          <circle
             style="fill:#ffffff;fill-opacity:1;stroke:none;stroke-width:1.88976002;stroke-dasharray:3.77952992, 1.88975997"
             id="path863"
             cx="6.9933777"
             cy="12"
             r="3.1788077" />
          <g
             style="fill:#ffffff;fill-opacity:1;stroke:#ffffff;stroke-width:1.1986835;stroke-opacity:1"
             id="g970"
             transform="matrix(0.69597069,0,0,1,6.7519831,0.8598373)">
            <path
               style="fill:#ffffff;fill-opacity:1;stroke:#ffffff;stroke-width:0.67956841;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
               d="M 6.6556292,10.609272 H 17.503311"
               id="path861-7" />
            <path
               id="path966"
               d="M 6.6556292,11.909464 H 17.503311"
               style="fill:#ffffff;fill-opacity:1;stroke:#ffffff;stroke-width:0.67956841;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" />
          </g>
          <text
             id="text886"
             y="13.668874"
             x="6.1986756"
             style="font-style:normal;font-weight:normal;font-size:26.66666603px;line-height:125%;font-family:sans-serif;letter-spacing:0px;word-spacing:0px;fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
             xml:space="preserve"><tspan
               style="font-style:normal;font-variant:normal;font-weight:bold;font-stretch:normal;font-size:5.33333349px;font-family:'Times New Roman';-inkscape-font-specification:'Times New Roman,  Bold'"
               y="13.668874"
               x="6.1986756"
               id="tspan884">i</tspan></text>
        </svg>
        
     
        <div class="gjs-block-label">Alert</div>`
        ,
        category: categoryName,
        content: `<div class="alert alert-primary p-2" role="alert">
        <i class="fas fa-info-circle mr-2"></i>
        <span>....</span>
      </div>`
    });


    
    editor.Components.addType('alert', {
        isComponent: (el) => {
            if(el && el.classList && el.classList.contains('alert')) {
                return {type: 'alert'};
            }
        },
        model: {
            defaults: {
                "custom-name": "Alert",
                tagName: 'card',
                draggable: true,
                droppable: true,
                traits: defaultModel.prototype.defaults.traits.concat([
                    {
                        type: 'class_select',
                        options: [
                            ... contexts.map((v) => { return {value: `alert-${v}`, name: v} ; }),
                        ],
                        label: "Color"
                    },
                    /*{ name: 'display-responsive', type: 'z-display-responsive' },
                    { name: 'z-typo', type: 'z-typo' },
                    { name: 'z-background-image', type: 'z-background-image' },
                    { name: 'z-size', type: 'z-size' },
                    { name: 'z-borders', type: 'z-borders' },
                    { name: 'z-margins', type: 'z-margins' },
                    { name: 'z-paddings', type: 'z-margins', marginType: "padding" }*/
                ])
            }
        },
    });
  }

export default {
    configure: async function({config}){
        config.plugins.push(bootstrapPublic) ;
        config.canvas.styles.push("https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css")
    },       
}
