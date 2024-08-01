window.openbamz = {
    queryGraphql : async function (query, appName){
        if(!appName){
            appName = window.OPENBAMZ_APP ;
        }
        let headers = {
            "Content-Type": "application/json",
            Accept: "application/json",
        } ;
        let jwt = localStorage.getItem("openbamz-jwt") ;
        if(jwt){
            headers.Authorization = "Bearer "+jwt
        }
        let result = await fetch("/graphql/"+appName, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ query: query }),
        }) ;
        return result.json() ;
    },
    authenticate: async function (email, password){
        let result = await window.openbamz.queryGraphql(`mutation auth {
authenticate(input: {email: "${email}", password: "${password}"}) {
result
}
}`, "_openbamz");
        let token = result?.data?.authenticate?.result;
        if(token){
            localStorage.setItem("openbamz-jwt", token) ;
            return true
        }else{
            return false;
        }
    },
    fetchAuth: async function(url, options){
        try{
            const jwt = localStorage.getItem("openbamz-jwt") ;
            if(jwt){
                if(!options){
                    options = {} ;
                }
                if(!options.headers){
                    options.headers = {} ;
                }
                if(!options.headers.Authorization && !options.headers.authorization){
                    options.headers.Authorization = "Bearer "+jwt ;
                }
            }
        }catch(err){
            console.warn("Can't access to local storage", err) ;
        }
        return fetch(url, options) ;
    },
    logout: async function (){
        localStorage.removeItem("openbamz-jwt") ;
    },
    refreshAuth: async function (){
        let result = await window.openbamz.queryGraphql(`mutation refresh {
  refreshAuth(input: {}) {
    result
  }
}`, "_openbamz");
        let token = result?.data?.refreshAuth?.result;
        if(token){
            localStorage.setItem("openbamz-jwt", token) ;
            return true
        }else{
            return false;
        }
    },
    createAccount: async function (email, password, name){
        let result = await window.openbamz.queryGraphql(`mutation createaccount {
createAccount(input: {email: "${email}", password: "${password}", name: "${name}"}) {
result {
createTime
email
role
name
}
}
}`, "_openbamz");
        return result;
    }
}
