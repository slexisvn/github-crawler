# Github Crawler

## Installation

`npm install`

## Configuration

Create a .env file in your root folder

```
MONGO_URI=<YOUR_MONGO_URI>

PERSONAL_ACESS_TOKEN=<YOUR_PERSONAL_GITHUB_ACESS_TOKEN>
```

## Run the app

`npm start`

## API

### Create list of 200 users/hour

`POST /api/users`

Request Body

```js
{
  "repoUrl": "https://github.com/{ower}/{repo}"
}
```

E.g.

```js
{
  "repoUrl": "https://github.com/faceobook/react"
}
```

### Export csv file

`GET /api/users`