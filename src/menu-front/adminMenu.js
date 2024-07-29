/*global adminMenu*/



// Function to inject CSS styles into the document
function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `

        body {
            padding-top: 30px;
        }
        /* Style for the banner container */
        .banner {
            background-color: black;
            color: white;
            display: flex;
            padding: 10px;
            white-space: nowrap;
            position: fixed;
            width: 100%;
            top: 0;
            left: 0;
            z-index: 1000;
        }

        /* Style for each menu item */
        .menu-item {
            margin-right: 20px;
            position: relative;
            cursor: pointer;
        }

        .menu-item a {
            color: white;
            text-decoration: none;
        }

        /* Style for submenu */
        .submenu {
            display: none;
            position: absolute;
            background-color: black;
            top: 100%;
            left: 0;
            padding: 10px;
            white-space: nowrap;
        }

        .menu-item:hover .submenu {
            display: block;
        }

        .submenu a {
            color: white;
            text-decoration: none;
            display: block;
            padding: 5px 0;
        }

        .submenu a:hover {
            background-color: #333;
        }
    `;
    document.head.appendChild(style);
}

// Function to create the banner
function createBanner(menuData) {
    const banner = document.createElement('div');
    banner.className = "banner"
    document.body.appendChild(banner) ;
    
    menuData.forEach(menu => {
        // Create menu item
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';

        // Create link for the menu item
        const link = document.createElement('a');
        link.href = '#'; // You might want to set this to '#' or the actual link
        link.textContent = menu.name;
        menuItem.appendChild(link);

        // Create submenu
        const submenu = document.createElement('div');
        submenu.className = 'submenu';

        // Add submenu entries
        menu.entries.forEach(entry => {
            const entryLink = document.createElement('a');
            entryLink.href = entry.link.replaceAll(":appName", window.OPENBAMZ_APP);
            entryLink.textContent = entry.name;
            submenu.appendChild(entryLink);
        });

        menuItem.appendChild(submenu);
        banner.appendChild(menuItem);
    });
}

// Inject CSS styles and create the banner
injectStyles();
createBanner(adminMenu);