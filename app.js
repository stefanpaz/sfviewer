const http = require("http");
const https = require("https");
const url = require("url");

const clientKey = process.env.SFClientKey;
const clientSecret = process.env.SFClientSecret;
const loginUrl = "https://login.salesforce.com";
var accessToken = "";
var instanceUrl = "";

function onRequest(request,response) {
    console.log("Request received");
    console.log(process.env);

    const reqUrl = url.parse(request.url, true);

    if(reqUrl.pathname == "/" && request.method === "GET")
    {
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write("Test server response");
        response.end();
    }
    else if(reqUrl.pathname.toLowerCase() == "/sf" && request.method === "GET")
    {
        response.statusCode = 302;
        response.setHeader("Location", loginUrl + "/services/oauth2/authorize?response_type=code&client_id=" + clientKey + "&redirect_uri=" + encodeURI("http://localhost:3000/sfreturn"));
        response.end();
    }
    else if(reqUrl.pathname.toLowerCase() == "/sfreturn" && request.method === "GET")
    {
        const code = reqUrl.query.code;
        const oauthPath = "/services/oauth2/token?grant_type=authorization_code&client_secret=" + clientSecret + "&client_id=" + clientKey + "&redirect_uri=" + encodeURI("http://localhost:3000/sfreturn") + "&code=" + code;

        const req = https.request(loginUrl + oauthPath, (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
            var body = "";
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                console.log("Data: " + body);
                console.log('No more data in response.');
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
    }
    else if(reqUrl.pathname.toLowerCase() == "/sfdata" && request.method === "GET")
    {
        response.writeHead(200, {"Content-Type": "text/html"});
        response.write("<!DOCTYPE html><html><head><title>Test Salesforce Integration</title></head><body><p>Instance URL: " + instanceUrl + "</p><p>Access Token: " + accessToken + "</p><p><a href='/objects'>See Objects</a></p></body></html>");
        response.end();
    }
    else if(reqUrl.pathname.toLowerCase() == "/objects" && request.method === "GET")
    {
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
                console.log("Data: " + body);
                console.log('No more data in response.');
                var parsedData = JSON.parse(body);
                var sobjects = parsedData.sobjects;
                response.writeHead(200, {"Content-Type": "text/html"});
                response.write("<!DOCTYPE html><html><head></head><body>");;
                response.write("<table><tr><th>Name</th><th>Label</th></tr>")
                for(var i = 0; i < sobjects.length; i++)
                {
                    response.write("<tr><td><a href='/objects/" + sobjects[i].name + "'>" + sobjects[i].name + "</a></td><td>" + sobjects[i].label + "</td></tr>");
                }
                response.write("</table></body></html>");
                response.end();
            });       
        });

        req.end();
    }
    else if(/\/objects\/[\s\S]*/.test(reqUrl.pathname.toLowerCase()) && request.method === "GET")
    {
        const objectName = reqUrl.pathname.substring(9);
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
                console.log("Data: " + body);
                console.log('No more data in response.');
                var parsedData = JSON.parse(body);
                var sobjects = parsedData;
                console.log("SOBJECTS: " + sobjects);
                response.writeHead(200, {"Content-Type": "text/html"});
                response.write("<!DOCTYPE html><html><head></head><body>");;
                response.write("<table><tr><th>Name</th><th>Label</th><th>Type</th><th>Length</th></tr>")
                for(var i = 0; i < sobjects.fields.length; i++)
                {
                    response.write("<tr><td>" + sobjects.fields[i].name + "</td><td>" + sobjects.fields[i].label + "</td><td>" + sobjects.fields[i].type + "</td><td>" + sobjects.fields[i].length + "</td></tr>");
                }
                response.write("</table></body></html>");
                console.log("%j", sobjects.fields);
                response.end();
            });       
        });

        req.end();
    }
    else{
        response.writeHead(404, {"Content-Type": "text/plain"});
        response.write("Path Not Found");
        response.end();
    }
}

http.createServer(onRequest).listen(3000);
console.log("Server has started");