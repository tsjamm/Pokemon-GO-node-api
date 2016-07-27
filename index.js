'use strict';

var PokemonGO = require('./poke.io.js');
var express = require('express');

var username = process.env.PGO_USERNAME || "USER";
var password = process.env.PGO_PASSWORD || "PASS";
var provider = "ptc"; //google or ptc
var location = {
    type: 'name',
    name: 'Mumbai'
};

var a = initPokeio();
setInterval(reInitPokeio,1000*60*10); //re-init pokeio every 10 min

var app = express();

app.get('/', function(req, res){

    var requestLocation = ''
    if (req.query.location) {
        requestLocation = req.query.location;
        console.log('[loc] Request for location: ' + requestLocation);
    } else {
        res.send(getResponseString("Not Specified",[]));
        return;
    }

    var location = {
        type: 'name',
        name: requestLocation || 'Mumbai'
    };

    a.SetLocation(location, function (err, loc) {
        if (err) {
            console.log(err);
            res.send(getResponseString(requestLocation,[]));
            return;
        }

        a.Heartbeat(function(err,hb) {
            if(err) {
                console.log(err);
                res.send(getResponseString(requestLocation,[]));
                return;
            } else {

                var pokeList = [];

                for (var i = hb.cells.length - 1; i >= 0; i--) {
                    if(hb.cells[i].NearbyPokemon[0]) {
                        //console.log(a.pokemonlist[0])
                        var pokemon = a.pokemonlist[parseInt(hb.cells[i].NearbyPokemon[0].PokedexNumber)-1];
                        var infoString = 'There is a ' + pokemon.name + ' at ' + hb.cells[i].NearbyPokemon[0].DistanceMeters.toString() + ' meters'; 
                        pokeList.push(infoString);
                        console.log('[pkmn] ' + requestLocation + ': ' + infoString);
                    }
                }
                res.send(getResponseString(requestLocation,pokeList));
                return;
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

function initPokeio() {
    var a = new PokemonGO.Pokeio();
    a.init(username, password, location, provider, function(err) {
        if (err) {
            console.log(err);
        } else {
        
            console.log('[i] Current location: ' + a.playerInfo.locationName);
            console.log('[i] lat/long/alt: : ' + a.playerInfo.latitude + ' ' + a.playerInfo.longitude + ' ' + a.playerInfo.altitude);

            a.GetProfile(function(err, profile) {
                if (err) {
                    console.log(err);
                } else {

                    console.log('[i] Username: ' + profile.username);
                    console.log('[i] Poke Storage: ' + profile.poke_storage);
                    console.log('[i] Item Storage: ' + profile.item_storage);

                    var poke = 0;
                    if (profile.currency[0].amount) {
                        poke = profile.currency[0].amount;
                    }

                    console.log('[i] Pokecoin: ' + poke);
                    console.log('[i] Stardust: ' + profile.currency[1].amount);

                }
            });
        }
    });
    return a;
}

function reInitPokeio() {
    console.log('[i]Restarting Pokeio');
    a = initPokeio();
}