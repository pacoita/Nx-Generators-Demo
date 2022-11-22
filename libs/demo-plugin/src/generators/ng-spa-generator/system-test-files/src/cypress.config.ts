import { defineConfig } from 'cypress';

export default defineConfig({
    chromeWebSecurity: false,
    fileServerFolder: '.',
    fixturesFolder: './fixtures',
    reporter: 'junit',
    reporterOptions: {
        mochaFile: '../../test-results/report.xml',
        toConsole: true
    },
    screenshotsFolder: `../<%= name %>/dist/system-test/screenshots`,
    videosFolder: `../<%= name %>/dist/system-test/videos`,
    video: true,
    viewportWidth: 1600,
    viewportHeight: 768,
    e2e: {
        // setupNodeEvents(
        //     on: Cypress.PluginEvents,
        //     config: Cypress.PluginConfigOptions
        // ): Promise<Cypress.PluginConfigOptions | void> | Cypress.PluginConfigOptions | void {
        //     // configure plugins here
        // },
        baseUrl: 'http://localhost:4200',
        specPattern: './src/e2e/**/*.cy.{js,jsx,ts,tsx}',
        supportFile: './src/support/e2e.ts'
    }
});
