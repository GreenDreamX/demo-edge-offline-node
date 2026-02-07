module.exports = {
    apps: [
        {
            name: 'simrs-edge',
            script: 'npm',
            args: 'start',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
                CLOUD_API_URL: 'https://api.simrs-cloud.com/fhir/Bundle' // Example URL
            },
        },
    ],
};
