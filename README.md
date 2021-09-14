# MonitorApp

This App pings all registered apps and store responses in mongodb
Every Registered app has its own collection of ping responses.

## Run local
In config.js, uncomment the localhost one for running locally
Use npm start for local run

## For docker image
docker build -t monitor-app .

Above command will build the image.
