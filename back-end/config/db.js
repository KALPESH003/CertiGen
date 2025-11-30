const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas
 * Uses Mongoose for object modeling and connection pooling.
 * * Best Practice: 
 * We use async/await to ensure the connection is established 
 * before the server starts accepting requests.
 */
const connectDB = async () => {
    try {
        // StrictQuery setup: Prepares for Mongoose 7 future strictness changes
        mongoose.set('strictQuery', true);

        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // Options are no longer needed in Mongoose 6+, 
            // but kept here for reference if using older drivers:
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        
        // Critical Failure: If DB doesn't connect, the app cannot function.
        // We exit with failure code (1) to trigger restart mechanisms in cloud hosting (Docker/K8s/Render).
        process.exit(1);
    }
};

module.exports = connectDB;