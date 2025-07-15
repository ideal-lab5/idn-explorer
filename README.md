# Ideal Network Explorer

This is a web interface for interacting with and monitoring the [Ideal Network](https://docs.idealabs.network).

## Setup

(Optional) This explorer requires an Ideal Network node to connect to.

To run the explorer, first install the npm dependencies:

```bash
npm install
```

Then, configure your Ideal Labs Node URI in your .env path

```
NEXT_PUBLIC_NODE_WS="ws://127.0.0.1:9944"
```

## Run

```bash
npm run dev
```

Finally, open [http://localhost:3000](http://localhost:3000) in your browser to view the website. 3000 is nextjs default port but it could be different in your environment.

## Docker

To build the docker image included in this repo, you must specify a websocket URL of an Ideal Network node:

```shell
docker build -t ideallabs/etf-explorer --build-arg NEXT_PUBLIC_NODE_WS="ws://172.14.1.1:9944"  .
```

then run

```shell
docker run -p 3000:3000 ideallabs/etf-explorer
```

## License

This repo is licensed under the Apache 2 license.
