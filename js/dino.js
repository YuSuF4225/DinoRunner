"use strict";

import { Game } from "./game.js";

document.addEventListener("DOMContentLoaded", function() {
    
    // liste des ressources 
    const resources = { dino: "./assets/dino.png" };
    // jeu en lui-même
    const game = new Game(document.querySelector("canvas"), resources);

    // chargement des ressources (simplifié)
    for (let r in resources) {
        const src = resources[r];
        resources[r] = new Image();
        resources[r].onload = () => game.notifyLoad();
        resources[r].src = src;
    }
    
    // boucle de jeu 
    let lastUpdate = Date.now();
    (function gameloop() {
        requestAnimationFrame(gameloop);
        const now = Date.now(), dt = now - lastUpdate;
        game.update(dt);
        game.render();
        lastUpdate = now;
    })();

    // capture des événements clavier 
    document.addEventListener("keydown", function(e) {
        game.keydown(e.code);
    });
});