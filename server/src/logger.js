import morgan from "morgan";

export function createRequestLogger() {
  return morgan((tokens, req, res) => {
    const method = tokens.method(req, res);
    const url = tokens.url(req, res);
    const status = tokens.status(req, res);
    const responseTime = tokens["response-time"](req, res);
    const size = tokens.res(req, res, "content-length") ?? "0";

    return `${method} ${url} ${status} ${size}b ${responseTime}ms`;
  });
}
