const { port } = require("./config");
const { createServer } = require("./server");

async function main() {
  const { app, connectDb } = createServer();
  await connectDb();

  app.listen(port, () => {
    console.log(`UniLink API listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

