'use strict';

var PokemonGO = require('./poke.io.js');
var express = require('express');

var a = new PokemonGO.Pokeio();
var username = process.env.PGO_USERNAME || "USER";
var password = process.env.PGO_PASSWORD || "PASS";
var provider = "ptc"; //google or ptc

var location = {
    type: 'name',
    name: 'Mumbai'
};

a.init(username, password, location, provider, function(err) {
    if (err) {
        console.log(err);
        res.send(getResponseString(requestLocation,[]));
    } else {
    
        console.log('1[i] Current location: ' + a.playerInfo.locationName);
        console.log('1[i] lat/long/alt: : ' + a.playerInfo.latitude + ' ' + a.playerInfo.longitude + ' ' + a.playerInfo.altitude);

        a.GetProfile(function(err, profile) {
            if (err) {
                console.log(err);
                res.send(getResponseString(requestLocation,[]));
            } else {

                console.log('1[i] Username: ' + profile.username);
                console.log('1[i] Poke Storage: ' + profile.poke_storage);
                console.log('1[i] Item Storage: ' + profile.item_storage);

                var poke = 0;
                if (profile.currency[0].amount) {
                    poke = profile.currency[0].amount;
                }

                console.log('1[i] Pokecoin: ' + poke);
                console.log('1[i] Stardust: ' + profile.currency[1].amount);

            }
        });
    }
});

var app = express();

app.get('/', function(req, res){

    var requestLocation = ''
    if (req.query.location) {
        requestLocation = req.query.location;
    } else {
        res.send(getResponseString("Not Specified",[]));
    }

    var location = {
        type: 'name',
        name: requestLocation || 'Mumbai'
    };

    a.SetLocation(location, function (err, loc) {
        if (err) {
            console.log(err);
            res.send(getResponseString(requestLocation,[]));
        }

        a.Heartbeat(function(err,hb) {
            if(err) {
                console.log(err);
                res.send(getResponseString(requestLocation,[]));
            } else {

                var pokeList = [];

                for (var i = hb.cells.length - 1; i >= 0; i--) {
                    if(hb.cells[i].NearbyPokemon[0]) {
                        //console.log(a.pokemonlist[0])
                        var pokemon = a.pokemonlist[parseInt(hb.cells[i].NearbyPokemon[0].PokedexNumber)-1];
                        var infoString = 'There is a ' + pokemon.name + ' at ' + hb.cells[i].NearbyPokemon[0].DistanceMeters.toString() + ' meters'; 
                        console.log(infoString);
                        pokeList.push(infoString);
                    }
                }
                res.send(getResponseString(requestLocation,pokeList));
            }
        });
    });
});


function getResponseString(location,pokeList) {

    return JSON.stringify({
        'location': location,
        'pokeList': pokeList
    });

}

app.listen(8088);