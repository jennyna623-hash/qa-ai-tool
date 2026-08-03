export async function onRequestGet({ env }) {
  const jiraConfigured = Boolean(
    env.ATLASSIAN_CLIENT_ID &&
    env.ATLASSIAN_CLIENT_SECRET &&
    env.JIRA_SESSION_SECRET &&
    String(env.JIRA_SESSION_SECRET).length >= 32
  );
  return Response.json({
    ok: true,
    service: "GSI AI Tools Cloud",
    version: "0.4.1",
    integrations: {
      jira: jiraConfigured,
      notion: false
    },
    timestamp: new Date().toISOString()
  }, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
