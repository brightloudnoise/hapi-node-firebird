'use strict';

const Hoek = require('hoek');
const Fb = require('node-firebird');


const DEFAULTS = {
    attach: 'onPreHandler',
    detach: 'tail'
};


exports.register = function (server, options, next) {

    const config = Hoek.applyToDefaults(DEFAULTS, options);

    server.ext(config.attach, (request, reply) => {

        const pool = Fb.pool(5, config);
        pool.get(function (err, db, done) {

            if (err) {
                reply(err);
                console.log(err);
                return;
            }

            request.Fb = {
                db: db,
                done: done
            };

            reply.continue();
            return;


        });
    });


    server.on(config.detach, (request, err) => {

        if (err) {
            reply(err);
            console.log(err);
            return;
        }

        if (request.Fb) {
            // Destroy pool
            //pool.destroy();
        }
    });


    next();
};


exports.register.attributes = {
    pkg: require('./package.json')
};
