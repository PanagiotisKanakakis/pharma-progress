#!/bin/sh 

echo 'Waiting for keycloak through reverse proxy' 
wait-for http://auth.pharma.test/ -t 600 -- echo 'Done (keycloak)'

echo 'Creating initial keycloak realm' 
/app/load_keycloak_realm.py                     \
  --keycloakurl ${PHARMA_KEYCLOAK_URL}            \
  --adminuser ${PHARMA_KEYCLOAK_USER}             \
  --adminpassword ${PHARMA_KEYCLOAK_PASSWORD}     \
  --realmname ${PHARMA_KEYCLOAK_REALM}            \
  --backend-clientid ${PHARMA_BACKEND_CLIENT_ID}  \

echo 'Load scripts finished'
while true; do sleep 60; done;
