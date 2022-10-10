# Pharma progress

This is the central repository for the eKEP project. It contains the following services:

 - pharma-backend: A nestjs based backend.
 - pharma-frontend: A nextjs based frontend for kep users
 - pharma-proxy: An nginx instance.
 - pharma-keycloak: A keycloak instance bundled with the necessary plugins.
 - redis: An instance of redis which is used as a) a session store by oauth2-proxy, b) an application cache
   by the backend, and c) as a queue system for jobs.
 - pharma-load-data-sidecar: A sidecar which on boot populates the system with demo data.

The main docker-compose file is `docker-compose.yaml` which is complemented by an additional docker-compose file 
on each environment. For example for local development the file `docker-compose.local.yaml` contains additional 
definitions.

# Local Development

 - Clone the repository `git@github.com:PanagiotisKanakakis/pharma-progress.git` or `https://github.com/PanagiotisKanakakis/pharma-progress.git` recursively
 - Open `/etc/hosts` and add `127.0.0.1 pharma.test auth.pharma.test`.
   Since the backend communicates directly with the keycloak service we need to have valid DNS names.
 - Copy `.env.sample` to `.env`
 - Go to folder `ekep-backend` and run `npm ci`. This is important to avoid issues with file ownerships due to hot reload.
 - Go to folder `pharma-frontend` and run `npm ci`.
 - Build the docker images using `docker-compose -f docker-compose.yaml -f docker-compose.local.yaml build pharma-frontend`
 - In case you come across a permission related issue regarding the front end containers, rebuild the images using the --no-cache argument
   ```
   docker-compose build --no-cache pharma-frontend 
   ```
 - Start the system using `docker-compose -f docker-compose.yaml -f docker-compose.local.yaml up` 

The above procedure is required only the first time. After that you can start the system using 

```
docker-compose -f docker-compose.yaml -f docker-compose.local.yaml up -d
docker-compose -f docker-compose.yaml -f docker-compose.local.yaml logs -f
```

Go to `http://pharma.test`.

# Database Migrations 

We use a Postgres database and database migrations to handle the DB schema. All migrations are stored in folder
`ekep-backend/src/database/migrations`. ORM is handled using the `typeorm` framework. You need to execute the
migrations scripts inside the `ekep_backend` container in order to find the database without any additional 
configuration. Shortcuts for the commands are executed using `npm`. 

 - Create a new migration: 

   ```
   docker exec -i $(docker-compose ps -q pharma-backend) npm run migration:generate NameOfMigration
   ```

 - In order to apply all pending migrations: 

   ```
   docker exec -i $(docker-compose ps -q pharma-backend) npm run migration:run
   ```

 - Revert the last migration using:

   ```
   docker exec -i $(docker-compose ps -q pharma-backend) npm run migration:revert
   ```

 - Show migration status: 

   ```
   docker exec -i $(docker-compose ps -q pharma-backend) npm run migration:show
   ```

# Swagger implementation (for development purposes only)

The backend service uses swagger to expose the api documentation which is located under 
`http://pharma.test:3002/swagger-ui` endpoint. In order to use the endpoints you must first be authorized 
following the next steps. The authorization should be done using the JWT token and not the browser's cookie, since traffic hits 
directly the backend and not the oauth2-proxy.

 - Login in to pharma.test/
 - Open backend logs using `docker logs -f pharma_backend`, search for the JWT token and copy it
 - On swagger page press the Authorize button and paste the token.