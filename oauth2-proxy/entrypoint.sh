#!/bin/sh 

echo 'Waiting for keycloak through reverse proxy' 
wait-for ${PHARMA_KEYCLOAK_URL} -t 600 -- echo 'Done'

echo 'Waiting for realm openid-configuration'
wait-for ${PHARMA_KEYCLOAK_URL}/realms/${PHARMA_KEYCLOAK_REALM}/.well-known/openid-configuration -t 600 -- echo 'Done'

echo 'Starting oauth2-proxy' 
/bin/oauth2-proxy --insecure-oidc-allow-unverified-email
