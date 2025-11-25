# SafeSend

SafeSend is a tiny project to make a proof of concept of a simple but amazing idea: annihilate spam, for ever.

## Development

You will need to have a local maildev server running. To do so, run:
```sh
docker run -p 1080:1080 -p 1025:1025 maildev/maildev
```

And then, run the server locally:
```sh
# For the first time create a JWT secret
echo 'JWT_SECRET=yop' > .env.app.local
echo 'SMTP_CONNECTION_URL = smtp://localhost:1025' >> .env.app.local
# And install the dependencies 
npm it
# Update the tests
node --run jest -- -u

# Then and later, just run the server
npm run watch
```

Testing email server:
```sh
SMTP_CONNECTION_URL=smtp://localhost:2025 node --run dev -- sendMail --recipient text@xx.com --sender test@enigma.com --subject test --message test
```

## Usage

To run the server in production:

```sh
# For the first time create a JWT secret
echo 'JWT_SECRET=$(openssl rand -base64 10)' > .env.app.production
# And install the dependencies 
npm it

# Then and later, just run build and run the server
npm run build
NODE_ENV=production APP_ENV=production npm start
```

You can understand deeply this repository and Whook's internal by simply reading
the [Architecture Notes](./ARCHITECTURE.md). The "See in context" links drive
your directly in the concerned implementation so that you can just see the code
that explains the notes.

Feel free to continue creating architecture notes and to regenerate the markdown
file by running:

```sh
node --run architecture
```

## Dev

Start the server in development:

```sh
# Simple dev mode
node --run dev

# Watch mode
node --run watch
```

Create a new route / cron / service / provider or command:

```sh
node --run create
```

Play with the REPL:

```sh
node --run repl
```

Generate the dependency injection graph (here, for the `putTime` handler):

```sh
node --run  whook -- __inject putTime,mermaid > DEPENDENCIES.mmd;
docker run --rm -u `id -u`:`id -g` -v $(pwd):/data minlag/mermaid-cli -i DEPENDENCIES.mmd -o DEPENDENCIES.mmd.svg;
```

List available commands:

```sh
## In dev mode
node --run dev -- ls
## With built files
npx whook ls
```

Generate API types:

```sh
node --run apitypes
```

## Debug

Execute a handler in isolation:

```sh
npx whook route --name putEcho --parameters '{"body": { "echo": "YOLO!" }}'
```

Debug `whook` internals:

```sh
DEBUG=whook node --run dev
```

Debug `knifecycle` internals (dependency injection issues):

```sh
DEBUG=knifecycle node --run dev
```

## Author
Enigma Students

