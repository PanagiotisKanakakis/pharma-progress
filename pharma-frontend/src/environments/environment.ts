// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  hmr: true,
  apiUrl: 'http://localhost:4000',
  CURRENT_DOMAIN: 'pharma.test',
  KEYCLOAK_REALM: 'pharma',
  BASE_URL: 'http://pharma.test',
  API_BASE_URL: 'http://pharma.test/v1/api',
  KEYCLOAK_URL: 'http://auth.pharma.test',
  KEYCLOAK_USER: 'admin',
  KEYCLOAK_PASSWORD: 'admin',
  CLIENT_ID: 'pharma-app',
  CLIENT_SECRET: 'j3LeI9M31LuYOQrphX2N1HHwtVUrVdzS'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
