#!/bin/bash

cd /home/node/app

echo 'Waiting until pg is ready'
until pg_isready -h $PHARMA_POSTGRES_HOST -p $PHARMA_POSTGRES_PORT -d $PHARMA_POSTGRES_DB -U $PHARMA_POSTGRES_USER; do sleep 2; done

echo 'Executing DB migrations' 
npm run migration:run

echo 'Loading initial data' 
npm run seeds:run

echo 'Starting in dev mode'
npm run start:dev

