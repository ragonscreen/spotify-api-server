'use strict';

const express = require('express');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = 3000;
app.listen(port, () => console.log(`Starting server at ${port}`));
app.use(express.static('public'));
app.use(express.json({ limit: '1mb' }));

// My API

app.get('/api', async (req, res) => {
    const tokenExists = await haveValidToken();
    let token;
    tokenExists
        ? (token = getAccessToken().token)
        : (token = (await spotifyGetNewAccessToken()).access_token);
    console.log(token);
    const data = { status: 200, message: 'Token Generated' };
    res.json(data);
});

app.get('/project/:spotifyURI', async (req, res) => {
    const spotifyURI = req.params.spotifyURI;
    const data = await spotifyGetAlbumData(spotifyURI);
    res.json(data);
});

app.get('/data/:projectList', async (req, res) => {
    const projectList = req.params.projectList;
    const url = `./data/${projectList}.json`;
    const data = JSON.parse(fs.readFileSync(url));
    console.log(data);
    res.json(data);
});

// Spotify API

const spotifyGetNewAccessToken = async () => {
    const clientID = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const url = 'https://accounts.spotify.com/api/token';
    const reqOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=client_credentials&client_id=${clientID}&client_secret=${clientSecret}`,
    };

    const response = await fetch(url, reqOptions);
    const data = await response.json();
    saveAccessToken(data);
    return data;
};

const spotifyGetAlbumData = async (albumID) => {
    const accessToken = getAccessToken().token;
    const url = `https://api.spotify.com/v1/albums/${albumID}?market=US`;
    const reqOptions = {
        method: 'GET',
        headers: { Authorization: 'Bearer ' + accessToken },
    };

    const response = await fetch(url, reqOptions);
    const data = await response.json();
    return data;
};

// Access Token

const getAccessToken = () => {
    const url = './data/accessToken.json';
    const data = JSON.parse(fs.readFileSync(url));
    return data;
};

const haveValidToken = async () => {
    const response = getAccessToken();
    const timeExpiry = response.timeExpiry;
    const timeCurrent = new Date().getTime();
    return timeExpiry > timeCurrent;
};

const saveAccessToken = (response) => {
    const token = response.access_token;
    const expiresIn = response.expires_in;
    const timeCurrent = new Date().getTime();
    const timeExpiry = timeCurrent + expiresIn * 1000 * 0.95;
    const data = { token, timeExpiry };
    const url = './data/accessToken.json';
    fs.writeFileSync(url, JSON.stringify(data, null, 4));
};
