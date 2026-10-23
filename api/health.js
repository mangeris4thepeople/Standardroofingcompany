// Health check: confirms the function runtime is up and reports which integrations are configured.
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    ok: true,
    service: 'standardroofingcompany.net',
    time: new Date().toISOString(),
    region: process.env.VERCEL_REGION || null,
    deployment: process.env.VERCEL_GIT_COMMIT_SHA ? process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7) : null,
    integrations: {
      leadsDatabase: Boolean(process.env.LEADS_DATABASE_URL),
      resend: Boolean(process.env.RESEND_API_KEY),
      indexNow: Boolean(process.env.INDEXNOW_KEY),
      analytics: Boolean(process.env.GA_MEASUREMENT_ID),
    },
  });
};
