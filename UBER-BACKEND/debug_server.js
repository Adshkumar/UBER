try {
    console.log('Requiring maps.routes...');
    require('./routes/maps.routes');
    console.log('maps.routes loaded.');

    console.log('Requiring ride.routes...');
    require('./routes/ride.routes');
    console.log('ride.routes loaded.');

    console.log('Requiring app...');
    require('./app'); // This will trigger db connection too
    console.log('app loaded.');
} catch (e) {
    console.error('ERROR CAUGHT:');
    console.error(e);
}
