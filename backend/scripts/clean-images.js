const mongoose = require('mongoose');
const url = 'mongodb://temple-mongo-dev:27017/temple_db';

mongoose.connect(url, { authSource: 'admin' }).then(async () => {
    console.log('Connected to DB');
    const first = await mongoose.connection.collection('temples').findOne({});
    console.log('Sample format:', first);
    const result = await mongoose.connection.collection('temples').updateMany({}, { $unset: { imageUrl: "", images: "" } });
    console.log('Modified:', result.modifiedCount);
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
