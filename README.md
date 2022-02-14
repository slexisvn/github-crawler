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

### Create list of 250 users/hour

`POST /api/users`

Request Body

```js
{
  "repoUrl": "{ower}/{repo}"
}
```

E.g.

```js
{
  "repoUrl": "faceobook/react"
}
```

### Export csv file

`GET /api/users`