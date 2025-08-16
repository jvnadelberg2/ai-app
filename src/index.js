const { createServer } = require('./server');
const PORT = process.env.PORT || 3000;
const server = createServer();
server.listen(PORT, () => console.log(`AI app listening on http://localhost:${PORT}`));
process.on('SIGINT', () => server.close(() => process.exit(0)));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
