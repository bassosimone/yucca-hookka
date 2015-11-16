# yucca-hookka

This proxy filters all the HTTP requests directed towards
`https://userportal.smartdatanet.it/userportal/`.

Most requests are proxied to the original website, except for
requests for partials and javascript.

In that case, if a local file with the correct name exists,
this file is served instead of the remove one.

This helps to easily test changes of the [yucca-userportal](
https://github.com/csipiemonte/yucca-userportal) portal.

Used csipiemonte/yucca-userportal@80cb840d39 as starting point
for copying the required partials and javascripts.

## Usage

```
node index.js
```

Then open the browser at `http://127.0.0.1:8080/`.
