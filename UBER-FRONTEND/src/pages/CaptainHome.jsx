import React, { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import CaptainDetails from '../components/CaptainDetails'
import RidePopUp from '../components/RidePopUp'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ConfirmRidePopUp from '../components/ConfirmRidePopUp'
import { useEffect, useContext } from 'react'
import { SocketContext } from '../context/SocketContext'
import { CaptainDataContext } from "../context/CaptainContext";
import axios from 'axios'

const CaptainHome = () => {

    const [ ridePopupPanel, setRidePopupPanel ] = useState(false)
    const [ confirmRidePopupPanel, setConfirmRidePopupPanel ] = useState(false)

    const ridePopupPanelRef = useRef(null)
    const confirmRidePopupPanelRef = useRef(null)
    const [ ride, setRide ] = useState(null)

    const { socket } = useContext(SocketContext)
    const { captain } = useContext(CaptainDataContext)

    useEffect(() => {
        if (!captain?._id) return;
        
        console.log('🚗 Captain ID:', captain._id);
        
        // Join socket room
        socket.emit('join', {
            userId: captain._id,
            userType: 'captain'
        });
        console.log('📡 Join event emitted for captain');
        
        // Listen for new ride
        socket.on('new-ride', (data) => {
            console.log('🎉 NEW RIDE RECEIVED!', data);
            console.log('✅ Setting ride state and showing popup');
            setRide(data);
            setRidePopupPanel(true);
            
            // TEST: Force show alert to confirm popup should appear
            alert('🎉 New ride received! Check for popup.');
        });
        
        // Test listener
        socket.on('test-ride', (data) => {
            console.log('🧪 Test ride received:', data);
            alert('Test notification: ' + data.message);
        });

        // Update location
        const updateLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {
                    console.log('📍 Position updated:', position.coords.latitude, position.coords.longitude);
                    
                    socket.emit('update-location-captain', {
                        userId: captain._id,
                        location: {
                            ltd: position.coords.latitude,
                            lng: position.coords.longitude
                        }
                    })
                })
            }
        }

        const locationInterval = setInterval(updateLocation, 10000)
        updateLocation()

        return () => {
            clearInterval(locationInterval);
            socket.off('new-ride');
            socket.off('test-ride');
        }
    }, [captain, socket])

    // Add useEffect to debug when ridePopupPanel changes
    useEffect(() => {
        console.log('🔍 ridePopupPanel changed to:', ridePopupPanel);
        console.log('🔍 Current ride:', ride);
    }, [ridePopupPanel, ride]);

    async function confirmRide() {
        console.log('Confirming ride:', ride?._id);
        
        const token = localStorage.getItem('captain_token') || localStorage.getItem('token');
        
        try {
            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/confirm`, {
                rideId: ride._id
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            console.log('✅ Ride confirmed:', response.data);
            setRidePopupPanel(false);
            setConfirmRidePopupPanel(true);
        } catch (error) {
            console.error('❌ Error confirming ride:', error);
            alert('Failed to confirm ride: ' + (error.response?.data?.message || error.message));
        }
    }


    useGSAP(function () {
        console.log('🎬 GSAP animation triggered for ridePopupPanel:', ridePopupPanel);
        
        if (ridePopupPanel) {
            gsap.to(ridePopupPanelRef.current, {
                transform: 'translateY(0)',
                duration: 0.3,
                ease: "power2.out"
            });
        } else {
            gsap.to(ridePopupPanelRef.current, {
                transform: 'translateY(100%)',
                duration: 0.3,
                ease: "power2.in"
            });
        }
    }, [ ridePopupPanel ])

    useGSAP(function () {
        console.log('🎬 GSAP animation triggered for confirmRidePopupPanel:', confirmRidePopupPanel);
        
        if (confirmRidePopupPanel) {
            gsap.to(confirmRidePopupPanelRef.current, {
                transform: 'translateY(0)',
                duration: 0.3,
                ease: "power2.out"
            });
        } else {
            gsap.to(confirmRidePopupPanelRef.current, {
                transform: 'translateY(100%)',
                duration: 0.3,
                ease: "power2.in"
            });
        }
    }, [ confirmRidePopupPanel ])

    return (
        <div className='h-screen relative'>
            <div className='fixed p-6 top-0 flex items-center justify-between w-screen z-20'>
                <img className='w-16' src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png" alt="" />
                <Link to='/captain-home' className=' h-10 w-10 bg-white flex items-center justify-center rounded-full'>
                    <i className="text-lg font-medium ri-logout-box-r-line"></i>
                </Link>
            </div>
            <div className='h-3/5'>
                <img className='h-full w-full object-cover' src="https://miro.medium.com/v2/resize:fit:1400/0*gwMx05pqII5hbfmX.gif" alt="" />
            </div>
            <div className='h-2/5 p-6'>
                <CaptainDetails />
            </div>
            
            {/* Ride Popup - Fixed styling */}
            <div 
                ref={ridePopupPanelRef} 
                className='fixed w-full z-30 bottom-0 translate-y-full bg-white px-3 py-10 pt-12 rounded-t-3xl shadow-2xl'
                style={{
                    maxHeight: '80vh',
                    overflowY: 'auto'
                }}
            >
                {ride ? (
                    <RidePopUp
                        ride={ride}
                        setRidePopupPanel={setRidePopupPanel}
                        setConfirmRidePopupPanel={setConfirmRidePopupPanel}
                        confirmRide={confirmRide}
                    />
                ) : (
                    <div className="text-center p-10">
                        <p>Loading ride details...</p>
                    </div>
                )}
            </div>
            
            {/* Confirm Ride Popup */}
            <div 
                ref={confirmRidePopupPanelRef} 
                className='fixed w-full h-screen z-30 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'
            >
                {ride ? (
                    <ConfirmRidePopUp
                        ride={ride}
                        setConfirmRidePopupPanel={setConfirmRidePopupPanel} 
                        setRidePopupPanel={setRidePopupPanel} 
                    />
                ) : (
                    <div className="text-center p-10">
                        <p>Loading ride details...</p>
                    </div>
                )}
            </div>
            
            {/* Debug overlay - shows when popup should be visible */}
            {ridePopupPanel && (
                <div className="fixed inset-0 bg-black bg-opacity-30 z-20" 
                     onClick={() => setRidePopupPanel(false)}>
                    <div className="absolute top-4 left-4 bg-red-500 text-white p-2 rounded">
                        Popup Active - Click to close
                    </div>
                </div>
            )}
        </div>
    )
}

export default CaptainHome