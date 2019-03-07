/*
example call:  http://127.0.0.1:5100/artists?artist=u2
*/

import express from 'express';
import request from 'request-promise';
import bodyParser from 'body-parser';
import artistEnricherApiLib from './artist-enricher-api-lib.js';

const PORT = 5100;
const spotifyAPI = artistEnricherApiLib.spotifyAPI;
const token = artistEnricherApiLib.token;

const route_options = {
    "method": "GET",
    "headers": {
        "Authorization": "Bearer " + token
    }
};

express()
    .use(bodyParser.urlencoded({
        extended: true
    }))

    // register url path /artists/:artistname
    .get('/artists/:artistname', (req, res) => {
        const artistName = req.params['artistname'];
        handleArtists(req, res, artistName);
    })

    // register url path
    .get('/artists', (req, res) => {
        const artistName = req.query['artist']; // to retrieve value of query parameter called artist (?artist=someValue&otherParam=X)
        handleArtists(req, res, artistName);
    })
    .get('/', (req, res) => {
        console.log('request received: ' + request.url);
        res.writeHead(200, {
            'Content-Type': 'text/html'
        });
        res.write("Artist Enricher API - No Data Requested, so none is returned");
        res.write("Try something like http://127.0.0.1:5100/artists?artist=madonna");
        res.end();
    })
    .listen(PORT);

console.log('server running on port ', PORT);

const composeArtistResponse = (res, artist) => {
    res.statusCode = 200;
    res.send(JSON.stringify(artist));
} //composeArtistResponse

const composeErrorResponse = (res, err) => {
    console.log("Error in composing artist response: " + JSON.stringify(err));
    res.statusCode = 500;
    res.send('An internal error occurred: ' + JSON.stringify(err));
} //composeErrorResponse


const handleArtists = (req, res, artistName) => {
    const artist = {}; // artist record that will be constructed bit by bit

    // use Promis to organize two sequential actions that each perform an asynchronous operation (HTTP REQUEST)
    // first function: find artist on spotify, establish the id and some basic attributes

    const artistUrl = spotifyAPI + '/search?q=' + encodeURI(artistName) + '&type=artist'; // use encodeURI to handle special characters in the name in the proper way
    route_options.uri = artistUrl;

    console.log('1. Call to Spotify to find artist : ' + artistUrl);
            // 1. invoke Spotify Search API to find the Artist and the spotify identifier; the response brings in genres and an image url
    request(route_options)
    .then((response) => {
        const artistsResponse = JSON.parse(response);

        // if the artist has not been found, return immediately
        if (artistsResponse.artists.total == 0) {
            throw 'not found';
        } // if artist not found

        // else continue processing with spotify response
        artist.spotifyId = artistsResponse.artists.items[0].id;
        artist.name = artistsResponse.artists.items[0].name;
        artist.genres = JSON.stringify(artistsResponse.artists.items[0].genres);
        if (artistsResponse.artists.items[0].images.length > 0) {
            artist.imageURL = artistsResponse.artists.items[0].images[0].url;
        }
        artist.spottiyHRef = artistsResponse.artists.items[0].href;

        const artistSpotifyId = artist.spotifyId
        // second function: go collect list of albums by this artist

        // 2. now get discography - the most recent 50 albums (the maximum we can collect in one call)
        const albumsURL = spotifyAPI + '/artists/' + artistSpotifyId + '/albums' + '?limit=50&album_type=album';
        artist.albums = [];
        console.log('2. Call to Spotify to collect list of albums : ' + albumsURL);
        route_options.uri = albumsURL;

        return request(route_options);
    })
    // go get details on the albums in the list artist.albums
    .then((response) => {
        const albumsResponse = JSON.parse(response);
        for (let i = 0; i < albumsResponse.items.length; i++) {
            const album = {};
            album.title = albumsResponse.items[i].name;
            if (albumsResponse.items[i].images.length > 0) {
                album.imageURL = albumsResponse.items[i].images[0].url;
            }
            album.spotifyId = albumsResponse.items[i].id;
            artist.albums.push(album);
        }

        const albums = artist.albums;
        const albumArrays = [];
        let i, j, chunk = 15;
        // create albumArrays with no more than 15 album ids in each of them
        for (i = 0, j = albums.length; i < j; i += chunk) {
            albumArrays.push(albums.slice(i, i + chunk));
        }
        return albumArrays;
    })
    .map((value) => {
        let albumsDetailsURL = spotifyAPI + '/albums/?ids=';
        // concatenate album id's together
        for (let i = 0; i < value.length; i++) {
            albumsDetailsURL += (i > 0 ? ',' : '') + value[i].spotifyId;
        } //for
        console.log('3. Call to Spotify to collect album (release date) details: ' + albumsDetailsURL);
        // invoke REST API to retrieve details for a set of albums
        route_options.uri = albumsDetailsURL;

       return request(route_options)
        .then((body) => {

            console.log('map ', body);

            const albumDetailsResponse = JSON.parse(body);
            for (let i = 0; i < albumDetailsResponse.albums.length; i++) {
                // clumsy way to correct for incomplete release dates (year only for example)
                value.releaseDate =
                    (albumDetailsResponse.albums[i].release_date_precision == 'day' ?
                        albumDetailsResponse.albums[i].release_date :
                        albumDetailsResponse.albums[i].release_date + '-01-01'
                    );
            } // for
            // return the fact that this albumArray is done - up to forEachOf
            return value;
        },
        (err) => {
                    console.log("Done foreach!");
                    throw err;
                }); // forEachOf
    })
    .then(() => {
        console.log(artist);
        console.log("done with processing "); // + JSON.stringify(results));
        // take the artist record as it stands right now and compose the response
        composeArtistResponse(res, artist);
    })
    .catch((err) => {
        console.log("Done!", err);
        console.log("error in processing artist enrichment: " + JSON.stringify(err));
        composeErrorResponse(res, err);
    });
} //handleArtists
