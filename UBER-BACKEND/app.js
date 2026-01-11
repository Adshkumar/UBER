const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const express = require('express');
const cors = require('cors');
const app = express();
const cookieParser = require('cookie-parser');
const connectToDb = require('./db/db');
const userRoutes = require('./routes/user.routes');
const captainRoutes = require('./routes/captain.routes');
const mapsRoutes = require('./routes/maps.routes');
const rideRoutes = require('./routes/ride.routes');

connectToDb();

app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174', 
        'http://localhost:3000',
        'https://uber-psi-three.vercel.app',
        'https://uber-git-main-adshkumars-projects.vercel.app',
        'https://uber-woad.vercel.app' 
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.use('/users', userRoutes);
app.use('/captains', captainRoutes);
app.use('/maps', mapsRoutes);
app.use('/rides', rideRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Something went wrong!'
    });
});

app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

module.exports = app;