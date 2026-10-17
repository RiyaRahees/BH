async function startServer() {
    await import('./server.js');
}

startServer().catch(err => {
    console.error("Failed to start server via dynamic import in app.cjs:");
    console.error(err);
});
