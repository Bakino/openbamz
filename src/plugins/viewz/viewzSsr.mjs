import path from "path";
import { JSDOM } from "jsdom";
import fs from "fs-extra"
import { readFile } from "fs/promises";
import { pathToRegexp } from "path-to-regexp";


export async function createMiddleware({sourcePath, base, containerId}){
    if(!containerId){
        containerId = "container";
    }
    let html = await readFile(path.join(sourcePath, "index.html"), {encoding: "utf8"});
    let dom = new JSDOM(html);
    let routes = await fs.readJson(path.join(sourcePath, "routes.json"));
    let baseEl = dom.window.document.head.querySelector("base");
    if(!base && baseEl){
        base = baseEl.getAttribute("href").replace(/\/$/, "") ;
    }
    for(let route of routes){
        route.regexp = pathToRegexp((base??"")+route.route)
    }
    return async (req, res, next)=>{
        try{
            //search for corresponding route
            let route = routes.find(r=>r.regexp.exec(req.originalUrl)) ;
            if(route){
                //found a route

                let viewName = route.name;
                if(!viewName){
                    viewName = route.path.replace(/\/$/, "").substring(route.path.lastIndexOf("/")+1);
                }
                
                //get HTML/CSS sources
                let html = await readFile(path.join(sourcePath, `${route.path}/${viewName}.html`), {encoding: "utf8"});
                let css = await readFile(path.join(sourcePath, `${route.path}/${viewName}.css`), {encoding: "utf8"});

                if(css){
                    //TODO : when @scope is supported on FF and Safari, add it directly from here
                    css = `<style scoped>${css}</style>`;
                    //target code when FF and Safari will be compliant (and JSDOM too, currently it throw a parsing exception)
                    //css = `<style>@scope {${css}}</style>`;
                }
                
                // push code in the container
                let container = dom.window.document.getElementById(containerId);
                container.setAttribute("zz-ssr", viewName);
                container.innerHTML = `${css}${html}` ;
                
                //send the HTML
                res.end(dom.serialize()) ;
            }else{
                next();
            }
        }catch(err){
            console.error("Error while get SSR page %o", err);
            res.status(err.statusCode||500).json(err);
        }
        
    };
}

export async function generateSsrContent({sourcePath, base, containerId}){
    if(!containerId){
        containerId = "container";
    }
    let html = await readFile(path.join(sourcePath, "index.html"), {encoding: "utf8"});
    let dom = new JSDOM(html);
    let routes = await fs.readJson(path.join(sourcePath, "routes.json"));
    let baseEl = dom.window.document.head.querySelector("base");
    if(!base && baseEl){
        base = baseEl.getAttribute("href").replace(/\/$/, "") ;
    }
    for(let route of routes){
        route.regexp = pathToRegexp((base??"")+route.route)
    }
    return async (req)=>{
        try{
            //search for corresponding route
            let route = routes.find(r=>r.regexp.exec(req.originalUrl)) ;
            if(route){
                //found a route

                let viewName = route.name;
                if(!viewName){
                    viewName = route.path.replace(/\/$/, "").substring(route.path.lastIndexOf("/")+1);
                }
                
                //get HTML/CSS sources
                let html = await readFile(path.join(sourcePath, `${route.path}/${viewName}.html`), {encoding: "utf8"});
                let css = await readFile(path.join(sourcePath, `${route.path}/${viewName}.css`), {encoding: "utf8"});

                if(css){
                    //TODO : when @scope is supported on FF and Safari, add it directly from here
                    css = `<style scoped>${css}</style>`;
                    //target code when FF and Safari will be compliant (and JSDOM too, currently it throw a parsing exception)
                    //css = `<style>@scope {${css}}</style>`;
                }
                
                // push code in the container
                let container = dom.window.document.getElementById(containerId);
                container.setAttribute("zz-ssr", viewName);
                container.innerHTML = `${css}${html}` ;

                if(base){
                    //prevent click on link before JS applied navigation
                    let allLinks = Array.prototype.slice.apply(container.querySelectorAll("a"));
                    for(let a of allLinks){
                        if(a.hasAttribute("href") && a.getAttribute("href").startsWith("/")){
                            a.setAttribute("onclick", "return false");
                        }
                    }
                }
                
                //send the HTML
                return dom.serialize() ;
            }else{
                return "";
            }
        }catch(err){
            console.error("Error while get SSR page %o", err);
            throw err
        }
        
    };
}