'use strict';

const Lab = require('lab');
const Code = require('code');
const Hapi = require('hapi');
const Proxyquire = require('proxyquire');


const stub = {
    Fb: {}
};
const Plugin = Proxyquire('../', {
    'Fb': stub.Fb
});
const lab = exports.lab = Lab.script();
let request;
let server;


lab.beforeEach((done) => {

    server = new Hapi.Server();
    server.connection({port: 0});
    server.route({
        method: 'GET',
        path: '/',
        handler: function (req, reply) {

            /*
            if (req.query.kill) {
                req.Fb.kill = true;
            }
            */

            reply('hapi-node-firebird is running');
        }
    });

    request = {
        method: 'GET',
        url: '/'
    };

    done();
});


lab.experiment('Firebird Plugin', () => {

    lab.test('it registers the plugin', (done) => {

        server.register(Plugin, (err) => {

            Code.expect(err).to.not.exist();
            done();
        });
    });


    lab.test('it returns an error when the connection fails in the extension point', (done) => {

        const realConnect = stub.Fb.pool;
        stub.Fb.pool = function (connection, callback) {

            callback(Error('connect failed'));
        };

        server.register(Plugin, (err) => {

            Code.expect(err).to.not.exist();

            server.inject(request, (response) => {

                Code.expect(response.statusCode).to.equal(500);
                stub.Fb.pool = realConnect;

                done();
            });
        });
    });


    lab.test('it successfully returns when the connection succeeds in extension point', (done) => {

        const realConnect = stub.Fb.pool;
        stub.Fb.pool = function (connection, callback) {

            const returnClient = () => {};

            callback(null, {}, returnClient);
        };

        server.register(Plugin, (err) => {

            Code.expect(err).to.not.exist();

            server.inject(request, (response) => {

                Code.expect(response.statusCode).to.equal(200);
                stub.Fb.pool = realConnect;

                done();
            });
        });
    });


    /*
    lab.test('it successfully cleans up during the server tail event', (done) => {

        const realConnect = stub.Fb.connect;
        stub.Fb.connect = function (connection, callback) {

            const returnClient = function (killSwitch) {

                Code.expect(killSwitch).to.equal(true);
                stub.Fb.connect = realConnect;

                done();
            };

            callback(null, {}, returnClient);
        };

        server.register(Plugin, (err) => {

            Code.expect(err).to.not.exist();

            request.url = '/?kill=true';

            server.inject(request, (response) => {

                Code.expect(response.statusCode).to.equal(200);
                stub.Fb.connect = realConnect;
            });
        });
    });
    */


    lab.test('it successfully uses native bindings without error', (done) => {

        const pluginWithConfig = {
            register: Plugin,
            options: {
                'maxpool': 5,
                'host': 'localhost',
                'port': 3050,
                'database': '/tmp/hapi_node_firebird.fdb',
                'user': 'SYSDBA',
                'password': 'masterkey'
            }
        };

        server.register(pluginWithConfig, (err) => {

            Code.expect(err).to.not.exist();

            server.inject(request, (response) => {

                Code.expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });
});
