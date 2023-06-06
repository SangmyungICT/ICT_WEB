const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    createProxyMiddleware('/trashbin', {
      target: process.env.REACT_APP_API_BASE_URL,
      changeOrigin: true,
    })
  );

  app.use(
    createProxyMiddleware('/report', {
      target: process.env.REACT_APP_API_BASE_URL,
      changeOrigin: true,
    })
  );
};
