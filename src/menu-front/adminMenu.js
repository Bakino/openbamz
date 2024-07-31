/*global adminMenu*/


async function isAdmin(){
    let jwt = localStorage.getItem("openbamz-jwt") ;
    if(!jwt){ return false ; }
       
    let result = await fetch("/graphql/_openbamz", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer "+jwt
        },
        body: JSON.stringify({ query: `query getapp {
  appByCode(code: "${window.OPENBAMZ_APP}") {
    code
  }
}`     }),
    }) ;
    let response = await result.json();
    return response?.data?.appByCode?.code === window.OPENBAMZ_APP ;
}

async function loadMenu(){
    if(await  isAdmin()){
        // Inject CSS styles and create the banner
        injectStyles();
        createBanner(adminMenu);
    }
}

// Function to inject CSS styles into the document
function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `

        body {
            padding-top: 31px;
        }
        /* Style for the banner container */
        .openbamz-banner {
            background-color: black;
            color: white;
            display: flex;
            padding: 5px;
            white-space: nowrap;
            position: fixed;
            width: 100%;
            top: 0;
            left: 0;
            z-index: 1000;
        }

        /* Style for each menu item */
        .openbamz-menu-item {
            margin-right: 20px;
            position: relative;
            cursor: pointer;
        }

        .openbamz-menu-item a {
            color: white;
            text-decoration: none;
        }

        /* Style for submenu */
        .openbamz-submenu {
            display: none;
            position: absolute;
            background-color: black;
            top: 100%;
            left: 0;
            padding: 10px;
            white-space: nowrap;
        }

        .openbamz-menu-item:hover .openbamz-submenu {
            display: block;
        }

        .openbamz-submenu a {
            color: white;
            text-decoration: none;
            display: block;
            padding: 5px 0;
        }

        .openbamz-submenu a:hover {
            background-color: #333;
        }
    `;
    document.head.appendChild(style);
}

function renderLink(link){
   return link.replaceAll(":appName", window.OPENBAMZ_APP);
}

// Function to create the banner
function createBanner(menuData) {
    const banner = document.createElement('div');
    banner.className = "openbamz-banner"
    document.body.appendChild(banner) ;
    
    menuData.forEach(menu => {
        // Create menu item
        const menuItem = document.createElement('div');
        menuItem.className = 'openbamz-menu-item';

        // Create link for the menu item
        const link = document.createElement('a');
        link.href = renderLink(menu.link??'#'); // You might want to set this to '#' or the actual link
        link.innerHTML = menu.name;
        menuItem.appendChild(link);

        if(menu.entries){
            // Create submenu
            const submenu = document.createElement('div');
            submenu.className = 'openbamz-submenu';
    
            // Add submenu entries
            menu.entries.forEach(entry => {
                const entryLink = document.createElement('a');
                entryLink.href = renderLink(entry.link);
                entryLink.textContent = entry.name;
                submenu.appendChild(entryLink);
            });
    
            menuItem.appendChild(submenu);
        }
        banner.appendChild(menuItem);
    });
}

loadMenu();