export async function onRequestGet() {
  return Response.json({
    ok: true,
    service: "GSI AI Tools Cloud",
    version: "0.1.0",
    integrations: {
      jira: false,
      notion: false
    },
    timestamp: new Date().toISOString()
  }, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
