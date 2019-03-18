const http = require("http");
const url = require("url");
const sforce = require("./sforce");

var accessToken = "";
var instanceUrl = "";

function onRequest(request,response) {

    const reqUrl = url.parse(request.url, true);

    if(reqUrl.pathname == "/" && request.method === "GET")
    {
        response.writeHead(200, {"Content-Type": "text/html"});
        response.writeHead(200, {"Content-Type": "text/html"});
        response.write("<!DOCTYPE html><html><head></head><body>");;
        response.write("<h1>Salesforce Viewer Test Application</h1>");
        response.write("<p><a href='/sf'>Continue to login</a></p>");
        response.end();
    }
    else if(reqUrl.pathname.toLowerCase() == "/sf" && request.method === "GET")
    {
        sforce.oauthRedirect(response);
    }
    else if(reqUrl.pathname.toLowerCase() == "/sfreturn" && request.method === "GET")
    {
        sforce.getAccessToken(reqUrl.query.code,response);
    }
    else if(reqUrl.pathname.toLowerCase() == "/sfdata" && request.method === "GET")
    {
        response.writeHead(200, {"Content-Type": "text/html"});
        response.write("<!DOCTYPE html><html><head><title>Salesforce Connection Success</title></head><body><h1>Available Functions</h1><p><a href='/objects'>View SOBjects</a><br /><a href='/query'>SOQL Query</a></p></body></html>");
        response.end();
    }
    else if(reqUrl.pathname.toLowerCase() == "/objects" && request.method === "GET")
    {
        sforce.getSObjects().then((sObjects) => {
            response.writeHead(200, {"Content-Type": "text/html"});
            response.write("<!DOCTYPE html><html><head></head><body>");;
            response.write("<table><tr><th>Name</th><th>Label</th></tr>")
            for(let i = 0; i < sObjects.length; i++)
            {
                response.write("<tr><td><a href='/objects/" + sObjects[i].name + "'>" + sObjects[i].name + "</a></td><td>" + sObjects[i].label + "</td></tr>");
            }
            response.write("</table></body></html>");
            response.end();    
        });
    }
    else if(/\/objects\/[\s\S]*/.test(reqUrl.pathname.toLowerCase()) && request.method === "GET")
    {
        const objectName = reqUrl.pathname.substring(9);
        sforce.getSObjectData(objectName).then((sObjects) => {
                response.writeHead(200, {"Content-Type": "text/html"});
                response.write("<!DOCTYPE html><html><head></head><body>");
                response.write("<table><tr><th>Name</th><th>Label</th><th>Type</th><th>Length</th></tr>");
                response.write("<h1>" + sObjects.label + "</h1>");
                response.write("<h2>API Name: " + sObjects.name + "</h2>");
                for(let i = 0; i < sObjects.fields.length; i++)
                {
                    response.write("<tr><td>" + sObjects.fields[i].name + "</td><td>" + sObjects.fields[i].label + "</td><td>" + sObjects.fields[i].type + "</td><td>" + sObjects.fields[i].length + "</td></tr>");
                }
                response.write("</table></body></html>");
                response.end();
        });
    }
    else if(reqUrl.pathname.toLowerCase() === "/query" && request.method === "GET")
    {
        response.writeHead(200, {"Content-Type": "text/html"});
        response.write("<!DOCTYPE html><html><head></head><body>");
        response.write("<h1>Enter Query Here</h1><form action='/query' method='POST'><input type='textarea' name='query' id='query'><button type='submit'>Submit</button></body></html>");
        response.end();

    }
    else if(reqUrl.pathname.toLowerCase() === "/query" && request.method === "POST")
    {
        var body = "";
        request.on('data', (data) => {
            body += data;
        })
        request.on('end', () => {
            sforce.executeSoqlQuery(require('querystring').parse(body).query).then((results) => {
                response.writeHead(200, {"Content-Type": "text/html"});
                response.write("<!DOCTYPE html><html><head></head><body><table><tr>");
                let keys = Object.keys(results[0]);
                for(let i=0; i<keys.length; i++)
                {
                    if(keys[i] !== "attributes") response.write("<th>" + keys[i] + "</th>");
                }
                response.write("</tr>");
                for(let j=0; j<results.length; j++)
                {
                    response.write("<tr>");
                    for(let k=0; k<keys.length; k++)
                    {
                        if(keys[k] !== "attributes") response.write("<td>" + results[j][keys[k]] + "</td>");
                    }
                    response.write("</tr>")
                }
                response.write("</table></body></html>");
                response.end();
            });
        });
    }
    else{
        response.writeHead(404, {"Content-Type": "text/plain"});
        response.write("Path " + reqUrl.query + " Not Found");
        response.end();
    }
}

http.createServer(onRequest).listen(3000);
console.log("Server has started");