const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    // Strip trailing slashes to prevent redirect loops with LiteSpeed
    if (req.url !== "/" && req.url.endsWith("/")) {
      req.url = req.url.slice(0, -1);
    }
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(process.env.PORT || 3000, (err) => {
    if (err) throw err;
    console.log("> Ready on port " + (process.env.PORT || 3000));
  });
});
