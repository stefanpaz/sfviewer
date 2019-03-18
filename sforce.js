const https = require("https");
const url = require("url");

module.exports = (() => {

    let clientKey = process.env.SFClientKey;
    let clientSecret = process.env.SFClientSecret;
    let loginUrl = "https://login.salesforce.com";
    let accessToken = "";
    let instanceUrl = "";
    
    const oauthRedirect = function(response) {
        response.statusCode = 302;
        response.setHeader("Location", loginUrl + "/services/oauth2/authorize?response_type=code&client_id=" + clientKey + "&redirect_uri=" + encodeURI("http://localhost:3000/sfreturn"));
        response.end();
    };

    const getAccessToken = function(code, response) {
        const oauthPath = "/services/oauth2/token?grant_type=authorization_code&client_secret=" + clientSecret + "&client_id=" + clientKey + "&redirect_uri=" + encodeURI("http://localhost:3000/sfreturn") + "&code=" + code;

        const req = https.request(loginUrl + oauthPath, (res) => {
            var body = "";
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                var parsedData = JSON.parse(body);
                instanceUrl = url.parse(parsedData.instance_url, true).host;
                accessToken = parsedData.access_token;

                response.statusCode = 302;
                response.setHeader("Location","/sfdata")
                response.end();
            });
        });

        req.on('error', (e) => {
            console.log("Error " + e.message); 
        });

        req.write("");
        req.end();
    };

    const getSObjects = function() {
        var promise = new Promise(function(resolve,reject) {
            const options = {
                host: instanceUrl,
                path: "/services/data/v37.0/sobjects/",
                headers: { "Authorization": "Bearer " + accessToken }
            };
            const req = https.request(options, (res) => {
                var body = "";
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    var parsedData = JSON.parse(body);
                    var sobjects = parsedData.sobjects;
                    resolve(sobjects);
                });       
            });
    
            req.on('error', (e) => {
                console.log("Error " + e.message); 
            });
            
            req.end();
        });

        return promise;
        
    };

    const getSObjectData = function(objectName) {
        var promise = new Promise(function(resolve, reject) {
            const options = {
                host: instanceUrl,
                path: "/services/data/v37.0/sobjects/" + objectName + "/describe",
                headers: { "Authorization": "Bearer " + accessToken }
            };
            const req = https.request(options, (res) => {
                var body = "";
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    var parsedData = JSON.parse(body);
                    var sobjects = parsedData;
                    resolve(sobjects);  
                }); 
            });

            req.on('error', (e) => {
                console.log("Error " + e.message); 
            });

            req.end();
        });                  

        return promise;
    };

    const executeSoqlQuery = function(query) {
        var promise = new Promise(function(resolve,reject) {
            const options = {
                host: instanceUrl,
                path: "/services/data/v37.0/query/?q=" + encodeURIComponent(query),
                headers: { "Authorization": "Bearer " + accessToken }
            }; 
            console.log("path: " + options.path);
            const req = https.request(options, (res) => {
                var body = "";
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    var parsedData = JSON.parse(body);
                    var resultSet = parsedData.records;
                    console.log("Result: " + JSON.stringify(resultSet));
                    resolve(resultSet);  
                }); 
            });

            req.on('error', (e) => {
                console.log("Error " + e.message); 
            });

            req.end();
        });

        return promise;

    };

    const returnInstanceUrl = function() {
        return instanceUrl;
    };

    const returnAccessToken = function() {
        return accessToken;
    };

    return {
        oauthRedirect,
        getAccessToken,
        getSObjects,
        getSObjectData,
        executeSoqlQuery,
        returnInstanceUrl,
        returnAccessToken
    };

})();