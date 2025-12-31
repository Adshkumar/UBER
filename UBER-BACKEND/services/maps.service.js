const axios = require('axios');
const captainModel = require('../models/captain.model');

module.exports.getAddressCoordinate = async (address) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

    try {
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "uber-clone"
            }
        });

        if (response.data && response.data.length > 0) {
            return {
                ltd: parseFloat(response.data[0].lat),
                lng: parseFloat(response.data[0].lon)
            };
        } else {
            throw new Error("Unable to fetch coordinates");
        }
    } catch (error) {
        console.error(error.message);
        throw error;
    }
};

module.exports.getDistanceTime = async (origin, destination) => {
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
    }

    // Mock response for development
    return {
        distance: {
            text: '10 km',
            value: 10000 // in meters
        },
        duration: {
            text: '15 mins',
            value: 900 // in seconds
        },
        status: 'OK'
    };
}

module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input) {
        throw new Error('query is required');
    }

    const apiKey = process.env.GOOGLE_MAPS_API;
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}`;

    try {
        const response = await axios.get(url);
        if (response.data.status === 'OK') {
            return response.data.predictions.map(prediction => prediction.description).filter(value => value);
        } else {
            throw new Error('Unable to fetch suggestions');
        }
    } catch (err) {
        console.error(err);
        throw err;
    }
}

module.exports.getCaptainsInTheRadius = async (ltd, lng, radius) => {

    // radius in km
    console.log(`Searching for captains within ${radius}km of [${lng}, ${ltd}]`);

    const captains = await captainModel.find({
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [lng, ltd] // [lng, lat]
                },
                $maxDistance: radius * 1000 // radius in meters
            }
        }
    });

    console.log(`Found ${captains.length} captains in radius.`);

    // DEBUG: Check if ANY captains exist
    if (captains.length === 0) {
        const anyCaptain = await captainModel.findOne();
        if (anyCaptain) {
            console.log('DEBUG: A captain exists in DB at:', anyCaptain.location.coordinates, 'Status:', anyCaptain.status);
        } else {
            console.log('DEBUG: No captains found in DB at all.');
        }
    }

    return captains;
}