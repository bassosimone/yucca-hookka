var fs = require('fs');
var http = require('http');
var https = require('https');
var url = require('url');
var path = require('path');

var rootdir = path.resolve('.');

var proxyRequest = function (request, response) {
    console.log("- proxy request");

    // Rewrite incoming HTTP request
    if (request.headers['host']) {
        request.headers['host'] = 'userportal.smartdatanet.it';
    }
    if (request.headers['referer']) {
        delete request.headers['referer'];
    }
    console.log('>', request.method);
    console.log('>', request.headers);
    console.log('>');

    var proxyRequest = https.request({
        hostname: 'userportal.smartdatanet.it',
        port: 443,
        path: request.url,
        method: request.method,
        headers: request.headers
    });

    proxyRequest.on('response', function (serverResponse) {
        // Rewrite server response
        if (serverResponse.headers['location']) {
            var value = serverResponse.headers['location'];
            value = url.parse(value);
            value.protocol = 'http';
            value.host = '127.0.0.1:8080';
            value = url.format(value);
            serverResponse.headers['location'] = value;
        }
        console.log('<', serverResponse.statusCode);
        console.log('<', serverResponse.headers);
        console.log('<');
        response.writeHead(serverResponse.statusCode, serverResponse.headers);
        serverResponse.pipe(response);
    });
    proxyRequest.on('error', function (error) {
        console.log('proxyRequest error', error);
    });

    proxyRequest.end();
};

var serveError = function (response, code) {
    response.writeHead(code);
    response.end("Status: " + code + "\n");
};

var maybeLocallyCached = function (request, response) {
    console.log("- maybe locally cached");
    var urlPath = url.parse(request.url).pathname;
    if (urlPath.indexOf('/userportal') !== 0) throw 'assertion failed';
    urlPath = urlPath.substr('/userportal'.length);
    var filepath = path.resolve('./' + urlPath);
    if (filepath.indexOf(rootdir) !== 0) {
        serveError(response, 403);
        return;
    }
    console.log("- local filepath", filepath);
    fs.lstat(filepath, function (error) {
        if (error) {
            if (error.code === 'ENOENT') {
                proxyRequest(request, response);  // Not stored in local cache
                return;
            }
            console.log("stat error", error);
            serveError(response, 500);
            return;
        }
        var stream = fs.createReadStream(filepath);
        stream.on("error", function (error) {
            console.log("stream error", error);
            response.end();
        });
        // XXX: defer loading local javascripts otherwise there is a
        // race condition resulting in reference errors
        setTimeout(function () {
            stream.pipe(response);
        }, (filepath.indexOf(".js") == (filepath.length - 3) ? 250 : 0));
    });
};

var server = http.createServer(function (request, response) {

    // We cache some of the partial views
    if (request.url.indexOf('/userportal/partials') === 0) {
        maybeLocallyCached(request, response);
        return;
    }

    // We cache certain non-minified .js files
    if (request.url.indexOf('/userportal/js-min') === 0) {
        console.log('- js-min candidate', request.url);
        // Derive the non minified name from the minified name:
        request.url = '/userportal/js' + request.url.substr(
            '/userportal/js-min'.length);
        console.log('- rewritten url (step 1)', request.url);
        var parsed = url.parse(request.url);
        var basename = path.basename(parsed.pathname);
        console.log('- basename', basename);
        if (basename.match(/^[a-f0-9]{8}\./)) {
            basename = basename.substr(9);
            parsed.pathname = path.dirname(parsed.pathname) + "/" + basename;
            request.url = url.format(parsed);
            console.log('- removed minified tag', request.url);
            maybeLocallyCached(request, response);
            return;
        }
    }

    proxyRequest(request, response);
});

server.listen(8080, function () {
    console.log('server listening on http://127.0.0.1:8080');
});
server.on('error', function (error) {
    console.log('server error', error);
});
