import * as express from 'express';

namespace spock {
    const port = 3000;

    const app = express();

    app.get('/', function(req, res) {
        res.send('Hello!')
    });

    app.listen(port, function() {
        console.log('Listening on ' + port);
    });
}