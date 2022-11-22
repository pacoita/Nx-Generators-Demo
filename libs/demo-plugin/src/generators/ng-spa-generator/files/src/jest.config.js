/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
    displayName: '<%= name %>',
    preset: '../../<%= locals.directory ? "../" : "" %>jest.preset.js',
    setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
    globals: { 'ts-jest': { tsconfig: '<rootDir>/tsconfig.spec.json', stringifyContentPathRegex: '\\.(html|svg)$' } },
    coverageDirectory: '<rootDir>/coverage/',
    coverageReporters: ['html', 'text-summary', 'cobertura'],
    collectCoverageFrom: ['**/src/{lib,app}/**/*.{ts,js}', '!**/*.module.ts'],
    reporters: ['default', ['jest-junit', { outputDirectory: '<rootDir>/test-results' }]],
    transform: {
        '^.+\\.(ts|js|html)$': 'jest-preset-angular'
    },
    snapshotSerializers: [
        'jest-preset-angular/build/serializers/no-ng-attributes',
        'jest-preset-angular/build/serializers/ng-snapshot',
        'jest-preset-angular/build/serializers/html-comment'
    ]
};
