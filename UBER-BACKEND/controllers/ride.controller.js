const rideService = require('../services/ride.service');
const mapService = require('../services/maps.service');
const { validationResult } = require('express-validator');
const rideModel = require('../models/ride.model');
const { sendMessageToSocketId, broadcastToCaptains } = require('../socket');

module.exports.createRide = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { pickup, destination, vehicleType } = req.body;
        console.log('Creating ride for user:', req.user._id);

        const ride = await rideService.createRide({
            user: req.user._id,
            pickup,
            destination,
            vehicleType
        });

        const pickupCoordinates = await mapService.getAddressCoordinate(pickup);

        // Find nearby captains
        const captainsInRadius = await mapService.getCaptainsInTheRadius(
            pickupCoordinates.ltd,
            pickupCoordinates.lng,
            100 // 100km radius for testing
        );

        console.log(`Found ${captainsInRadius.length} captains nearby`);

        // Get ride with populated user
        const rideWithUser = await rideModel.findOne({ _id: ride._id })
            .populate('user', 'firstname lastname socketId');

        // Send ride request to each captain
        captainsInRadius.forEach(captain => {
            console.log(`Sending ride request to captain: ${captain._id}, socket: ${captain.socketId}`);

            if (captain.socketId) {
                // Using socketId
                sendMessageToSocketId(captain.socketId, {
                    event: 'new-ride',
                    data: rideWithUser
                });

                // ALSO emit to captain room as backup
                broadcastToCaptains([captain._id], 'new-ride', rideWithUser);
            } else {
                console.log(`Captain ${captain._id} has no socket ID (offline)`);
            }
        });

        res.status(201).json(ride);

    } catch (err) {
        console.log('Error in createRide:', err);
        return res.status(500).json({ message: err.message });
    }
};

module.exports.getFare = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { pickup, destination } = req.query;

        const fare = await rideService.getFare(pickup, destination);
        return res.status(200).json(fare);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

module.exports.confirmRide = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { rideId } = req.body;
        const ride = await rideService.confirmRide({ rideId, captain: req.captain });

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-confirmed',
            data: ride
        })

        return res.status(200).json(ride);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

module.exports.startRide = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { rideId, otp } = req.query;
        const ride = await rideService.startRide({ rideId, otp, captain: req.captain });

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-started',
            data: ride
        })

        return res.status(200).json(ride);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

module.exports.endRide = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { rideId } = req.body;
        console.log('Ending ride:', rideId);

        const ride = await rideService.endRide({ rideId, captain: req.captain });
        console.log('Ride ended in DB. User socket ID:', ride.user.socketId);

        if (ride.user.socketId) {
            sendMessageToSocketId(ride.user.socketId, {
                event: 'ride-ended',
                data: ride
            });
            console.log('Sent ride-ended event to user');
        } else {
            console.log('User has no socket ID, cannot send notification');
        }

        return res.status(200).json(ride);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};