var trackFunc = function(tracks) {
    console.log(tracks);
};

var searchFunc = function(responseArtists) {
    for (let index = 0; index < responseArtists.length; index++) {
        const responseArtist = responseArtists[index];
        spotify.tracks(responseArtist, tracksFunc)
    }
};

function searchSpotify(artist) {
    spotify.search(artist,  searchFunc)
}

function forEach(f) {
    for (let index = 0; index < this.array.length; index++) {
        const element = this.array[index];
        f(element, index, array);
    }
}