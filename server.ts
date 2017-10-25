import * as path from "path"
import * as express from "express"

const app = express()
const port = process.env.PORT || 3000

//app.use(express.static('dist'))
app.use('/dist', express.static(path.join(__dirname, 'dist')))
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))
})

app.listen(port, () => console.log('Listening on ' + port))
