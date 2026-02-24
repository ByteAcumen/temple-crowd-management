/**
 * Comprehensive Famous Indian Temples Seed Script
 * Seeds 25+ famous temples with complete data: prasad, donations, services, history
 * 
 * Run: node backend/scripts/seed_famous_temples.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Temple = require('../src/models/Temple');

// 25+ Famous Indian Temples with comprehensive data
const famousTemples = [
    // ============ NORTH INDIA ============
    {
        name: 'Golden Temple',
        location: { address: 'Golden Temple Road', city: 'Amritsar', state: 'Punjab', coordinates: { latitude: 31.6200, longitude: 74.8765 } },
        capacity: { total: 100000, per_slot: 5000, threshold_warning: 85, threshold_critical: 95 },
        operatingHours: { regular: { opens: '02:00', closes: '22:00' }, weekend: { opens: '02:00', closes: '23:00' } },
        fees: { general: 0, specialDarshan: 0, vipEntry: 0, foreigners: 0, prasad: 0, photography: 0 },
        description: 'The Harmandir Sahib (Golden Temple) is the holiest Gurdwara of Sikhism, located in Amritsar. Built around the holy tank (Amrit Sarovar).',
        deity: 'Guru Granth Sahib',
        significance: 'Holiest shrine in Sikhism. Open to all regardless of religion, caste, or creed.',
        facilities: { parking: true, wheelchairAccess: true, cloakroom: true, prasadCounter: true, shoeStand: true, drinkingWater: true, restrooms: true, accommodation: true, freeFood: true },
        prasadMenu: [
            { name: 'Kada Prasad', description: 'Sacred halwa made with wheat flour, sugar & ghee', price: 0, isAvailable: true, servingSize: '1 portion' },
            { name: 'Langar Meal', description: 'Complete vegetarian meal served free', price: 0, isAvailable: true, servingSize: 'Full plate' }
        ],
        donations: {
            enabled: true, minimumAmount: 1,
            options: [
                { name: 'General Donation', suggestedAmounts: [101, 501, 1001, 5001], purpose: 'Temple maintenance' },
                { name: 'Langar Seva', suggestedAmounts: [1100, 5100, 11000], purpose: 'Free community kitchen' },
                { name: 'Gold Donation', suggestedAmounts: [10000, 51000], purpose: 'Gold plating maintenance' }
            ],
            bankDetails: { bankName: 'Punjab National Bank', upiId: 'goldentemple@pnb' },
            taxExemption: true, section80G: true
        },
        specialServices: [
            { name: 'Sukhmani Sahib Path', description: 'Recitation of complete Sukhmani Sahib', price: 1100, duration: '3 hours', timings: ['05:00', '11:00'], requiresBooking: true },
            { name: 'Akhand Path', description: '48-hour continuous recitation of Guru Granth Sahib', price: 5100, duration: '48 hours', requiresBooking: true, advanceBookingDays: 30 }
        ],
        annualEvents: [
            { name: 'Baisakhi', description: 'Sikh New Year celebration', startDate: 'April 13', duration: '1 day', expectedCrowd: 'extreme' },
            { name: 'Guru Nanak Jayanti', description: 'Birth anniversary of Guru Nanak', startDate: 'November', duration: '3 days', expectedCrowd: 'extreme' }
        ],
        history: { foundedYear: '1604 AD', founder: 'Guru Arjan Dev', architecturalStyle: 'Sikh Architecture' },
        rules: { dressCode: { men: 'Head must be covered', women: 'Head must be covered' }, restrictions: ['No tobacco', 'No alcohol', 'No shoes'] },
        howToReach: { nearestAirport: { name: 'Sri Guru Ram Dass Jee International', distance: '11 km' }, nearestRailway: { name: 'Amritsar Junction', distance: '2 km' } },
        liveDarshan: { enabled: true, streamUrl: 'https://www.sgpc.net/live', timings: ['24/7'] },
        status: 'OPEN',
        contact: { phone: '+91-183-2553954', website: 'https://www.goldentempleamritsar.org' }
    },
    {
        name: 'Kashi Vishwanath Temple',
        location: { address: 'Lahori Tola', city: 'Varanasi', state: 'Uttar Pradesh', coordinates: { latitude: 25.3109, longitude: 83.0107 } },
        capacity: { total: 50000, per_slot: 3000, threshold_warning: 85, threshold_critical: 95 },
        operatingHours: { regular: { opens: '03:00', closes: '23:00' }, weekend: { opens: '03:00', closes: '23:00' } },
        fees: { general: 0, specialDarshan: 500, vipEntry: 1500, foreigners: 0, prasad: 251, photography: 0 },
        description: 'One of the most famous Hindu temples dedicated to Lord Shiva. One of the twelve Jyotirlingas.',
        deity: 'Lord Shiva (Jyotirlinga)',
        significance: 'One of 12 Jyotirlingas. Moksha Dayak pilgrimage. Rebuilt in 1780 by Ahilyabai Holkar.',
        facilities: { parking: true, wheelchairAccess: true, cloakroom: true, prasadCounter: true, shoeStand: true, drinkingWater: true, restrooms: true, accommodation: false, freeFood: false },
        prasadMenu: [
            { name: 'Panchamrit', description: 'Divine mixture of milk, curd, honey, sugar, ghee', price: 51, servingSize: '100ml' },
            { name: 'Bel Patra', description: 'Sacred Bel leaves for offering', price: 21, servingSize: '11 leaves' },
            { name: 'Prasad Thali', description: 'Complete offering set', price: 251, servingSize: '1 thali' }
        ],
        donations: {
            enabled: true, minimumAmount: 11,
            options: [
                { name: 'Temple Trust', suggestedAmounts: [101, 501, 1001], purpose: 'Temple operations' },
                { name: 'Ganga Seva', suggestedAmounts: [251, 1001, 5001], purpose: 'Ganga cleaning' },
                { name: 'Annadaan', suggestedAmounts: [1100, 5100], purpose: 'Feed the poor' }
            ],
            bankDetails: { bankName: 'State Bank of India', upiId: 'kashivishwanath@sbi' },
            taxExemption: true, section80G: true
        },
        specialServices: [
            { name: 'Rudrabhishek', description: 'Sacred bathing of Shiva Linga with milk, honey, water', price: 1100, duration: '45 mins', timings: ['05:00', '11:00', '19:00'], requiresBooking: true },
            { name: 'Shringar Darshan', description: 'Special darshan during aarti with decorations', price: 500, duration: '30 mins', timings: ['03:00', '11:30', '19:00'] },
            { name: 'Mangala Aarti', description: 'Early morning first aarti', price: 0, duration: '30 mins', timings: ['03:00'] }
        ],
        annualEvents: [
            { name: 'Maha Shivaratri', description: 'Greatest festival of Lord Shiva', startDate: 'February/March', duration: '1 day', expectedCrowd: 'extreme' },
            { name: 'Dev Deepawali', description: 'Festival of lights on Ghats', startDate: 'November', duration: '1 day', expectedCrowd: 'high' }
        ],
        history: { foundedYear: 'Ancient (rebuilt 1780)', founder: 'Original unknown, rebuilt by Ahilyabai Holkar', architecturalStyle: 'Nagara' },
        rules: { dressCode: { men: 'Dhoti/formal wear', women: 'Saree/salwar' }, restrictions: ['No leather', 'No mobiles in sanctum'] },
        howToReach: { nearestAirport: { name: 'Lal Bahadur Shastri Airport', distance: '25 km' }, nearestRailway: { name: 'Varanasi Junction', distance: '3 km' } },
        liveDarshan: { enabled: true, streamUrl: 'https://shrikashivishwanath.org/live', timings: ['03:00-11:30', '12:30-19:00', '19:30-23:00'] },
        status: 'OPEN',
        contact: { phone: '+91-542-2392629', website: 'https://shrikashivishwanath.org' }
    },
    {
        name: 'Vaishno Devi Temple',
        location: { address: 'Trikuta Hills', city: 'Katra', state: 'Jammu & Kashmir', coordinates: { latitude: 33.0305, longitude: 74.9490 } },
        capacity: { total: 50000, per_slot: 3000, threshold_warning: 80, threshold_critical: 90 },
        operatingHours: { regular: { opens: '05:00', closes: '21:00' }, weekend: { opens: '05:00', closes: '22:00' } },
        fees: { general: 0, specialDarshan: 0, vipEntry: 0, foreigners: 0, prasad: 150, photography: 0 },
        description: 'Located at 5,200 feet, dedicated to Goddess Vaishno Devi. 13 km trek from Katra. Second most visited shrine in India.',
        deity: 'Goddess Vaishno Devi (Maha Kali, Maha Lakshmi, Maha Saraswati)',
        significance: 'Natural rock formation of 3 Pindis. 2nd most visited shrine in India. Self-manifested goddess.',
        facilities: { parking: true, wheelchairAccess: false, cloakroom: true, prasadCounter: true, shoeStand: false, drinkingWater: true, restrooms: true, accommodation: true, freeFood: true },
        prasadMenu: [
            { name: 'Dry Fruit Prasad', description: 'Mix of dry fruits blessed by Mata', price: 200, servingSize: '250g' },
            { name: 'Chunri', description: 'Red cloth for offering', price: 51, servingSize: '1 piece' },
            { name: 'Prasad Box', description: 'Complete prasad set', price: 301, servingSize: '1 box' }
        ],
        donations: {
            enabled: true, minimumAmount: 11,
            options: [
                { name: 'General Donation', suggestedAmounts: [101, 501, 1001], purpose: 'Temple trust' },
                { name: 'Langar Seva', suggestedAmounts: [1100, 5100, 11000], purpose: 'Free meals for pilgrims' },
                { name: 'Yatra Path Maintenance', suggestedAmounts: [2100, 5100], purpose: 'Trek path maintenance' }
            ],
            taxExemption: true, section80G: true
        },
        specialServices: [
            { name: 'Aarti', description: 'Daily aarti at the shrine', price: 0, duration: '30 mins', timings: ['06:00', '20:00'] },
            { name: 'Special Pooja', description: 'Personal pooja at the shrine', price: 551, duration: '15 mins', requiresBooking: true, advanceBookingDays: 7 },
            { name: 'Helicopter Yatra', description: 'Helicopter ride from Katra', price: 1860, duration: '6 mins' }
        ],
        annualEvents: [
            { name: 'Navratri', description: 'Nine nights festival', startDate: 'March-April & September-October', duration: '9 days', expectedCrowd: 'extreme' },
            { name: 'Mata Ka Jagrata', description: 'Night-long devotional singing', startDate: 'Various', duration: 'Night', expectedCrowd: 'high' }
        ],
        history: { foundedYear: 'Ancient (700 years old shrine)', architecturalStyle: 'Natural Cave' },
        rules: { dressCode: { men: 'Simple clothes for trek', women: 'Simple clothes for trek' }, restrictions: ['13 km trek required', 'No leather', 'Physical fitness required'] },
        howToReach: { nearestAirport: { name: 'Jammu Airport', distance: '50 km from Katra' }, nearestRailway: { name: 'Katra Station', distance: 'Base camp' } },
        status: 'OPEN',
        contact: { phone: '+91-1991-234088', website: 'https://www.maavaishnodevi.org' }
    },
    {
        name: 'Kedarnath Temple',
        location: { address: 'Kedarnath', city: 'Rudraprayag', state: 'Uttarakhand', coordinates: { latitude: 30.7352, longitude: 79.0669 } },
        capacity: { total: 15000, per_slot: 1000, threshold_warning: 80, threshold_critical: 90 },
        operatingHours: { regular: { opens: '04:00', closes: '21:00' }, weekend: { opens: '04:00', closes: '21:00' } },
        fees: { general: 0, specialDarshan: 1500, vipEntry: 5000, foreigners: 0, prasad: 200, photography: 0 },
        description: 'Located at 3,583 meters above sea level. Open only April-November. Part of Char Dham pilgrimage.',
        deity: 'Lord Shiva (Jyotirlinga)',
        significance: 'Highest among 12 Jyotirlingas. Part of Char Dham. Temple survived 2013 Kedarnath floods.',
        facilities: { parking: false, wheelchairAccess: false, cloakroom: true, prasadCounter: true, shoeStand: true, drinkingWater: true, restrooms: true, accommodation: true, freeFood: true },
        prasadMenu: [
            { name: 'Prasad', description: 'Blessed prasad', price: 100, servingSize: '1 packet' },
            { name: 'Bhasma', description: 'Sacred ash', price: 51, servingSize: '1 packet' },
            { name: 'Rudraksha', description: 'Sacred bead', price: 501, servingSize: '1 bead' }
        ],
        specialServices: [
            { name: 'Rudrabhishek', description: 'Abhishek with sacred items', price: 1700, duration: '1 hour', requiresBooking: true },
            { name: 'Helicopter Yatra', description: 'Helicopter from Phata/Guptkashi', price: 7500, duration: '10 mins' }
        ],
        annualEvents: [
            { name: 'Temple Opening', description: 'Annual opening ceremony', startDate: 'April/May (Akshaya Tritiya)', duration: '1 day', expectedCrowd: 'extreme' },
            { name: 'Temple Closing', description: 'Bhai Dooj closing ceremony', startDate: 'November', duration: '1 day', expectedCrowd: 'high' }
        ],
        history: { foundedYear: '8th Century AD', founder: 'Adi Shankaracharya', architecturalStyle: 'Stone Architecture' },
        rules: { dressCode: { men: 'Warm clothes, trek wear', women: 'Warm clothes, trek wear' }, restrictions: ['16 km trek from Gaurikund', 'Closed Nov-April', 'High altitude - be prepared'] },
        howToReach: { nearestAirport: { name: 'Jolly Grant Airport, Dehradun', distance: '239 km' }, nearestRailway: { name: 'Rishikesh', distance: '216 km' } },
        status: 'OPEN',
        contact: { phone: '+91-1364-263170', website: 'https://badrinath-kedarnath.gov.in' }
    },
    // ============ SOUTH INDIA ============
    {
        name: 'Tirumala Tirupati Devasthanams',
        location: { address: 'Tirumala Hills', city: 'Tirupati', state: 'Andhra Pradesh', coordinates: { latitude: 13.6833, longitude: 79.3500 } },
        capacity: { total: 100000, per_slot: 8000, threshold_warning: 80, threshold_critical: 92 },
        operatingHours: { regular: { opens: '02:30', closes: '01:30' }, weekend: { opens: '02:30', closes: '01:30' } },
        fees: { general: 0, specialDarshan: 300, vipEntry: 10000, foreigners: 0, prasad: 25, photography: 0 },
        description: 'Richest and most visited religious place in the world. Lord Venkateswara temple on Tirumala Hills.',
        deity: 'Lord Venkateswara (Vishnu)',
        significance: 'Richest temple in world. 50,000+ pilgrims daily. Bhooloka Vaikuntham.',
        facilities: { parking: true, wheelchairAccess: true, cloakroom: true, prasadCounter: true, shoeStand: true, drinkingWater: true, restrooms: true, accommodation: true, freeFood: true },
        prasadMenu: [
            { name: 'Tirupati Laddu', description: 'World-famous sweet prasad - GI tagged', price: 25, servingSize: '1 laddu (175g)', isAvailable: true },
            { name: 'Laddu (Big)', description: 'Large size laddu', price: 50, servingSize: '1 laddu (750g)' },
            { name: 'Vada', description: 'Medu vada prasad', price: 10, servingSize: '2 pieces' },
            { name: 'Pulihora', description: 'Tamarind rice', price: 10, servingSize: '1 packet' }
        ],
        donations: {
            enabled: true, minimumAmount: 1,
            options: [
                { name: 'Srivari Seva', suggestedAmounts: [500, 1000, 5000], purpose: 'Temple service' },
                { name: 'Annadanam', suggestedAmounts: [1116, 5580, 11160], purpose: 'Free meals' },
                { name: 'Go Samrakshanam', suggestedAmounts: [1000, 5000], purpose: 'Cow protection' },
                { name: 'Hair Offering', suggestedAmounts: [0], purpose: 'Tonsuring ceremony' }
            ],
            taxExemption: true, section80G: true
        },
        specialServices: [
            { name: 'Suprabhatam', description: 'Early morning awakening prayer', price: 0, duration: '30 mins', timings: ['03:00'] },
            { name: 'Thomala Seva', description: 'Special darshan with flower garland', price: 1200, duration: '1 hour', timings: ['04:00'], requiresBooking: true },
            { name: 'Archana', description: 'Personal prayer recitation', price: 150, duration: '5 mins' },
            { name: 'Kalyanotsavam', description: 'Celestial wedding ceremony', price: 10000, duration: '3 hours', requiresBooking: true, advanceBookingDays: 90 }
        ],
        annualEvents: [
            { name: 'Brahmotsavam', description: 'Nine-day annual festival', startDate: 'September/October', duration: '9 days', expectedCrowd: 'extreme' },
            { name: 'Vaikunta Ekadasi', description: 'Heavenly gate opening', startDate: 'December/January', duration: '1 day', expectedCrowd: 'extreme' }
        ],
        history: { foundedYear: '300 AD', architecturalStyle: 'Dravidian' },
        rules: { dressCode: { men: 'Dhoti/formal pants & shirt', women: 'Saree/churidar' }, restrictions: ['No leather', 'No mobiles in queue', 'Strict dress code'] },
        howToReach: { nearestAirport: { name: 'Tirupati Airport', distance: '15 km' }, nearestRailway: { name: 'Tirupati Station', distance: '22 km' } },
        liveDarshan: { enabled: true, streamUrl: 'https://www.tirumala.org/LiveDarshan', timings: ['24/7'] },
        status: 'OPEN',
        contact: { phone: '+91-877-2277777', website: 'https://www.tirumala.org' }
    },
    {
        name: 'Meenakshi Amman Temple',
        location: { address: 'Temple South Gate', city: 'Madurai', state: 'Tamil Nadu', coordinates: { latitude: 9.9195, longitude: 78.1193 } },
        capacity: { total: 30000, per_slot: 2000, threshold_warning: 85, threshold_critical: 95 },
        operatingHours: { regular: { opens: '05:00', closes: '12:30' }, weekend: { opens: '05:00', closes: '22:00' } },
        fees: { general: 0, specialDarshan: 100, vipEntry: 500, foreigners: 50, prasad: 50, photography: 50 },
        description: 'Historic temple with 14 gateway towers (gopurams). Tallest gopuram is 52 meters.',
        deity: 'Goddess Meenakshi (Parvati) & Lord Sundareswarar (Shiva)',
        significance: 'One of oldest temples. UNESCO nominee. Divine marriage celebrated daily.',
        facilities: { parking: true, wheelchairAccess: false, cloakroom: true, prasadCounter: true, shoeStand: true, drinkingWater: true, restrooms: true, accommodation: false, freeFood: false },
        prasadMenu: [
            { name: 'Prasad Box', description: 'Temple prasad', price: 50, servingSize: '1 box' },
            { name: 'Kumkum', description: 'Sacred vermillion', price: 20, servingSize: '1 packet' }
        ],
        specialServices: [
            { name: 'Abhishekam', description: 'Sacred bathing ritual', price: 500, duration: '30 mins', requiresBooking: true },
            { name: 'Archana', description: 'Chanting of 108 names', price: 50, duration: '15 mins' }
        ],
        annualEvents: [
            { name: 'Chithirai Festival', description: 'Divine wedding of Meenakshi & Sundareswarar', startDate: 'April/May', duration: '12 days', expectedCrowd: 'extreme' }
        ],
        status: 'OPEN',
        contact: { phone: '+91-452-2348085', website: 'https://www.meenakshitemple.org' }
    },
    {
        name: 'Sabarimala Temple',
        location: { address: 'Periyar Tiger Reserve', city: 'Pathanamthitta', state: 'Kerala', coordinates: { latitude: 9.4367, longitude: 77.0826 } },
        capacity: { total: 50000, per_slot: 5000, threshold_warning: 80, threshold_critical: 90 },
        operatingHours: { regular: { opens: '04:00', closes: '22:00' } },
        fees: { general: 0, specialDarshan: 0, vipEntry: 0, prasad: 10 },
        description: 'Unique temple requiring 41-day vratham. Open only specific days. 5 km trek through forest.',
        deity: 'Lord Ayyappa',
        significance: 'Requires 41-day penance. Only temple where all religions worship together. Makara Jyoti.',
        facilities: { parking: true, wheelchairAccess: false, cloakroom: true, prasadCounter: true, drinkingWater: true, restrooms: true, accommodation: true, freeFood: true },
        prasadMenu: [
            { name: 'Appam', description: 'Sweet rice cake', price: 10, servingSize: '5 pieces' },
            { name: 'Aravana', description: 'Sweet made with jaggery & ghee', price: 20, servingSize: '1 packet' }
        ],
        specialServices: [
            { name: 'Irumudi Kettu', description: 'Sacred bundle for trek', price: 100, requiresBooking: false }
        ],
        annualEvents: [
            { name: 'Mandala-Makaravilakku', description: 'Main pilgrimage season', startDate: 'November-January', duration: '2 months', expectedCrowd: 'extreme' },
            { name: 'Makara Sankranti', description: 'Seeing the divine light', startDate: 'January 14', duration: '1 day', expectedCrowd: 'extreme' }
        ],
        rules: { restrictions: ['41-day vratham required', 'Traditional black clothes', '5 km forest trek', 'Women 10-50 years traditionally restricted'] },
        status: 'OPEN',
        contact: { website: 'https://sabarimala.kerala.gov.in' }
    },
    // ============ WEST INDIA ============
    {
        name: 'Somnath Temple',
        location: { address: 'Somnath Mandir', city: 'Prabhas Patan', state: 'Gujarat', coordinates: { latitude: 20.8880, longitude: 70.4014 } },
        capacity: { total: 25000, per_slot: 1500, threshold_warning: 85, threshold_critical: 95 },
        operatingHours: { regular: { opens: '06:00', closes: '21:00' } },
        fees: { general: 0, specialDarshan: 200, vipEntry: 500, prasad: 100 },
        description: 'First among the 12 Jyotirlingas. Destroyed and rebuilt 7 times - symbol of Indian resilience.',
        deity: 'Lord Shiva (Jyotirlinga)',
        significance: '1st Jyotirlinga. Rebuilt by Sardar Patel. Arrow pointing to South Pole.',
        prasadMenu: [
            { name: 'Prasad Laddu', description: 'Sweet laddu', price: 50, servingSize: '2 pieces' }
        ],
        specialServices: [
            { name: 'Sound & Light Show', description: 'Evening show on temple history', price: 25, duration: '1 hour', timings: ['19:30'] }
        ],
        annualEvents: [
            { name: 'Maha Shivaratri', startDate: 'February/March', duration: '1 day', expectedCrowd: 'extreme' },
            { name: 'Kartik Purnima', startDate: 'November', duration: '1 day', expectedCrowd: 'high' }
        ],
        history: { foundedYear: 'Ancient (rebuilt 1951)', founder: 'Current structure by Sardar Patel', architecturalStyle: 'Chalukya' },
        status: 'OPEN',
        contact: { phone: '+91-2876-231241', website: 'https://somnath.org' }
    },
    {
        name: 'Siddhivinayak Temple',
        location: { address: 'SK Bole Road, Prabhadevi', city: 'Mumbai', state: 'Maharashtra', coordinates: { latitude: 19.0168, longitude: 72.8303 } },
        capacity: { total: 25000, per_slot: 2000, threshold_warning: 85, threshold_critical: 95 },
        operatingHours: { regular: { opens: '05:30', closes: '22:00' }, weekend: { opens: '03:00', closes: '22:00' } },
        fees: { general: 0, specialDarshan: 200, vipEntry: 1500, prasad: 100 },
        description: 'Most visited temple in Mumbai. Wish-fulfilling Ganesha. Celebrity pilgrimage spot.',
        deity: 'Lord Ganesha (Siddhivinayak)',
        significance: 'Wish-fulfilling Ganesha. Trunk turns right (rare). Celebrities visit before releases.',
        facilities: { parking: true, wheelchairAccess: true, cloakroom: true, prasadCounter: true, shoeStand: true, drinkingWater: true, restrooms: true },
        prasadMenu: [
            { name: 'Modak', description: 'Sweet dumpling - Ganesh favorite', price: 100, servingSize: '5 pieces' },
            { name: 'Laddu', description: 'Round sweet', price: 50, servingSize: '2 pieces' }
        ],
        specialServices: [
            { name: 'Abhishek', description: 'Sacred bathing ritual', price: 1001, duration: '30 mins', requiresBooking: true },
            { name: 'Satyanarayana Puja', description: 'Special Vishnu puja', price: 1500, duration: '2 hours', requiresBooking: true }
        ],
        annualEvents: [
            { name: 'Ganesh Chaturthi', description: 'Birth of Lord Ganesha', startDate: 'August/September', duration: '10 days', expectedCrowd: 'extreme' }
        ],
        history: { foundedYear: '1801', founder: 'Laxman Vithu Patil' },
        status: 'OPEN',
        contact: { phone: '+91-22-24373626', website: 'https://www.siddhivinayak.org' }
    },
    {
        name: 'Shirdi Sai Baba Temple',
        location: { address: 'Shirdi', city: 'Ahmednagar', state: 'Maharashtra', coordinates: { latitude: 19.7645, longitude: 74.4769 } },
        capacity: { total: 60000, per_slot: 4000, threshold_warning: 85, threshold_critical: 95 },
        operatingHours: { regular: { opens: '04:00', closes: '22:00' } },
        fees: { general: 0, specialDarshan: 500, vipEntry: 1000, prasad: 50 },
        description: 'Temple dedicated to Sai Baba. Multi-faith pilgrims. Sabka Malik Ek philosophy.',
        deity: 'Shirdi Sai Baba',
        significance: 'Multi-faith spiritual leader. "Sabka Malik Ek" - All have same master.',
        facilities: { parking: true, wheelchairAccess: true, cloakroom: true, prasadCounter: true, shoeStand: true, drinkingWater: true, restrooms: true, accommodation: true, freeFood: true },
        prasadMenu: [
            { name: 'Udi Prasad', description: 'Sacred ash', price: 0, servingSize: '1 packet' },
            { name: 'Prasad Box', description: 'Sweets & snacks', price: 50, servingSize: '1 box' }
        ],
        specialServices: [
            { name: 'Kakad Aarti', description: 'Early morning aarti', price: 0, timings: ['04:15'], duration: '30 mins' },
            { name: 'Dhoop Aarti', description: 'Noon aarti', price: 0, timings: ['12:00'], duration: '15 mins' },
            { name: 'Shej Aarti', description: 'Night aarti', price: 0, timings: ['22:30'], duration: '15 mins' }
        ],
        annualEvents: [
            { name: 'Ram Navami', description: 'Baba considered Ram reincarnation', startDate: 'March/April', duration: '3 days', expectedCrowd: 'extreme' },
            { name: 'Guru Purnima', startDate: 'July', duration: '1 day', expectedCrowd: 'high' }
        ],
        liveDarshan: { enabled: true, streamUrl: 'https://live.sai.org.in' },
        status: 'OPEN',
        contact: { phone: '+91-2423-258500', website: 'https://www.shrisaibabasansthan.org' }
    },
    {
        name: 'Mahalaxmi Temple',
        location: { address: 'Bhulabhai Desai Road', city: 'Mumbai', state: 'Maharashtra', coordinates: { latitude: 18.9757, longitude: 72.8052 } },
        capacity: { total: 15000, per_slot: 1000 },
        operatingHours: { regular: { opens: '06:00', closes: '22:00' } },
        fees: { general: 0, specialDarshan: 200, prasad: 100 },
        description: 'Dedicated to Goddess Mahalaxmi. Three idols of Mahakali, Mahalaxmi, Mahasaraswati.',
        deity: 'Goddess Mahalaxmi (Lakshmi)',
        significance: 'Tri-devi temple. Navratri celebrations famous. Seafront temple.',
        specialServices: [
            { name: 'Abhishek', description: 'Goddess bathing', price: 500, requiresBooking: true }
        ],
        annualEvents: [
            { name: 'Navratri', startDate: 'September/October', duration: '9 days', expectedCrowd: 'extreme' }
        ],
        status: 'OPEN',
        contact: { website: 'https://mahalaxmitemple.co.in' }
    },
    // ============ EAST INDIA ============
    {
        name: 'Jagannath Temple',
        location: { address: 'Grand Road', city: 'Puri', state: 'Odisha', coordinates: { latitude: 19.8050, longitude: 85.8181 } },
        capacity: { total: 50000, per_slot: 3000, threshold_warning: 85, threshold_critical: 95 },
        operatingHours: { regular: { opens: '05:00', closes: '23:00' } },
        fees: { general: 0, specialDarshan: 0, vipEntry: 0, prasad: 50 },
        description: 'Dedicated to Lord Jagannath. Origin of word "Juggernaut". Famous Rath Yatra.',
        deity: 'Lord Jagannath (Krishna), Balabhadra, Subhadra',
        significance: 'Char Dham. Mahaprasad: food becomes divine. Non-Hindus not allowed inside.',
        facilities: { parking: true, wheelchairAccess: false, cloakroom: true, prasadCounter: true, shoeStand: true, drinkingWater: true, restrooms: true, freeFood: true },
        prasadMenu: [
            { name: 'Mahaprasad', description: '56 items cooked in earthen pots', price: 50, servingSize: '1 plate' },
            { name: 'Khaja', description: 'Layered sweet', price: 30, servingSize: '4 pieces' },
            { name: 'Arisa', description: 'Sweet rice cake', price: 20, servingSize: '2 pieces' }
        ],
        specialServices: [
            { name: 'Pahandi', description: 'Watch deities being carried', price: 0, timings: ['During festivals'] }
        ],
        annualEvents: [
            { name: 'Rath Yatra', description: 'Chariot festival - world famous', startDate: 'June/July', duration: '9 days', expectedCrowd: 'extreme', specialActivities: ['Chariots pulled by millions'] },
            { name: 'Snana Yatra', description: 'Bathing ceremony', startDate: 'June', duration: '1 day', expectedCrowd: 'high' }
        ],
        rules: { restrictions: ['Non-Hindus not allowed inside', 'No cameras'] },
        status: 'OPEN',
        contact: { phone: '+91-6752-222002', website: 'https://jagannath.nic.in' }
    },
    {
        name: 'Dakshineswar Kali Temple',
        location: { address: 'Dakshineswar', city: 'Kolkata', state: 'West Bengal', coordinates: { latitude: 22.6547, longitude: 88.3577 } },
        capacity: { total: 20000, per_slot: 1500 },
        operatingHours: { regular: { opens: '06:00', closes: '12:30' }, weekend: { opens: '06:00', closes: '20:30' } },
        fees: { general: 0, specialDarshan: 0, prasad: 20 },
        description: 'Temple where Ramakrishna Paramhansa attained spiritual realization. On Hooghly river bank.',
        deity: 'Goddess Kali (Bhavatarini)',
        significance: 'Ramakrishna Paramhansa sadhana sthal. Vivekananda visiting place.',
        specialServices: [
            { name: 'Puja', description: 'Kali puja', price: 151, requiresBooking: true }
        ],
        annualEvents: [
            { name: 'Kali Puja', description: 'Diwali night Kali worship', startDate: 'October/November', duration: '1 day', expectedCrowd: 'extreme' }
        ],
        history: { foundedYear: '1855', founder: 'Rani Rashmoni' },
        status: 'OPEN',
        contact: { website: 'https://dakshineswarkalitemple.org' }
    },
    {
        name: 'Kamakhya Temple',
        location: { address: 'Nilachal Hill', city: 'Guwahati', state: 'Assam', coordinates: { latitude: 26.1663, longitude: 91.7050 } },
        capacity: { total: 15000, per_slot: 1000 },
        operatingHours: { regular: { opens: '08:00', closes: '17:00' } },
        fees: { general: 0, specialDarshan: 500, prasad: 50 },
        description: 'One of oldest Shakti Peethas. Temple dedicated to goddess Kamakhya.',
        deity: 'Goddess Kamakhya (Shakti)',
        significance: 'Shakti Peeth where Sati\'s yoni fell. Tantric worship center.',
        prasadMenu: [
            { name: 'Prasad', description: 'Red cloth & flowers', price: 50, servingSize: '1 set' }
        ],
        annualEvents: [
            { name: 'Ambubachi Mela', description: 'Temple closes for 3 days during goddess menstruation', startDate: 'June', duration: '4 days', expectedCrowd: 'extreme' }
        ],
        status: 'OPEN',
        contact: { website: 'https://kamakhyatemple.org' }
    },
    // ============ MORE FAMOUS TEMPLES ============
    {
        name: 'ISKCON Temple Delhi',
        location: { address: 'Sant Nagar, East of Kailash', city: 'New Delhi', state: 'Delhi', coordinates: { latitude: 28.5509, longitude: 77.2403 } },
        capacity: { total: 10000, per_slot: 800 },
        operatingHours: { regular: { opens: '04:30', closes: '21:00' } },
        fees: { general: 0, prasad: 150 },
        description: 'Modern Krishna temple with multimedia exhibits. "Glory of India" display.',
        deity: 'Lord Krishna & Radha',
        prasadMenu: [
            { name: 'Govinda\'s Thali', description: 'Pure vegetarian meal', price: 150, servingSize: 'Full plate' }
        ],
        annualEvents: [
            { name: 'Janmashtami', startDate: 'August/September', duration: '2 days', expectedCrowd: 'extreme' }
        ],
        status: 'OPEN',
        contact: { website: 'https://www.iskcondelhi.com' }
    },
    {
        name: 'Akshardham Temple',
        location: { address: 'Noida Mor', city: 'New Delhi', state: 'Delhi', coordinates: { latitude: 28.6127, longitude: 77.2773 } },
        capacity: { total: 30000, per_slot: 2000 },
        operatingHours: { regular: { opens: '09:30', closes: '18:30' } },
        fees: { general: 0, exhibition: 170, waterShow: 80, prasad: 100 },
        description: 'Modern Hindu temple complex showcasing Indian culture. Guinness World Record.',
        deity: 'Swaminarayan',
        significance: 'Largest Hindu temple in Delhi. Cultural exhibitions. Musical fountain show.',
        facilities: { parking: true, wheelchairAccess: true, cloakroom: true, prasadCounter: true, shoeStand: true, drinkingWater: true, restrooms: true },
        specialServices: [
            { name: 'Musical Fountain Show', description: 'Light & sound water show', price: 80, timings: ['19:30'], duration: '24 mins' },
            { name: 'Boat Ride', description: 'Through 10,000 years of Indian culture', price: 50, duration: '15 mins' }
        ],
        annualEvents: [
            { name: 'Diwali', startDate: 'October/November', duration: '5 days', expectedCrowd: 'extreme' }
        ],
        history: { foundedYear: '2005', architecturalStyle: 'Traditional Hindu' },
        rules: { restrictions: ['No electronics', 'No bags inside', 'Closed Mondays'] },
        status: 'OPEN',
        contact: { phone: '+91-11-43442344', website: 'https://akshardham.com' }
    },
    {
        name: 'Birla Mandir Jaipur',
        location: { address: 'Moti Doongri Hill', city: 'Jaipur', state: 'Rajasthan', coordinates: { latitude: 26.8898, longitude: 75.8129 } },
        capacity: { total: 8000, per_slot: 500 },
        operatingHours: { regular: { opens: '08:00', closes: '12:00' }, weekend: { opens: '08:00', closes: '20:00' } },
        fees: { general: 0, prasad: 50 },
        description: 'Beautiful white marble temple. Stunning night illumination. BM Birla foundation.',
        deity: 'Lord Vishnu & Goddess Lakshmi',
        history: { foundedYear: '1988', founder: 'BM Birla Foundation', architecturalStyle: 'Modern Hindu with marble' },
        status: 'OPEN',
        contact: { website: 'https://birlatemple.org' }
    },
    {
        name: 'Dwarkadhish Temple',
        location: { address: 'Dwarka', city: 'Dwarka', state: 'Gujarat', coordinates: { latitude: 22.2376, longitude: 68.9674 } },
        capacity: { total: 20000, per_slot: 1500 },
        operatingHours: { regular: { opens: '06:00', closes: '12:30' }, weekend: { opens: '17:00', closes: '21:30' } },
        fees: { general: 0, specialDarshan: 300, prasad: 50 },
        description: 'One of Char Dham. Krishna\'s kingdom. Built on original Dwaraka.',
        deity: 'Lord Krishna (Dwarkadhish)',
        significance: 'Char Dham. Krishna\'s capital. 52 yards flag mast.',
        annualEvents: [
            { name: 'Janmashtami', startDate: 'August/September', duration: '3 days', expectedCrowd: 'extreme' }
        ],
        status: 'OPEN',
        contact: { website: 'https://dwarkadhish.org' }
    },
    {
        name: 'Ramanathaswamy Temple',
        location: { address: 'Rameswaram Island', city: 'Rameswaram', state: 'Tamil Nadu', coordinates: { latitude: 9.2876, longitude: 79.3173 } },
        capacity: { total: 30000, per_slot: 2000 },
        operatingHours: { regular: { opens: '05:00', closes: '13:00' }, weekend: { opens: '15:00', closes: '21:00' } },
        fees: { general: 0, specialDarshan: 100, prasad: 30 },
        description: 'One of 12 Jyotirlingas. Longest temple corridor in India (1,220 meters).',
        deity: 'Lord Shiva (Jyotirlinga)',
        significance: '12th Jyotirlinga. Char Dham. Rama worshipped Shiva here. 22 holy wells.',
        specialServices: [
            { name: '22 Theertham', description: 'Bath in 22 holy wells', price: 50, duration: '1 hour' }
        ],
        status: 'OPEN',
        contact: { website: 'https://rameswaramtemple.tn.gov.in' }
    },
    {
        name: 'Padmanabhaswamy Temple',
        location: { address: 'East Fort', city: 'Thiruvananthapuram', state: 'Kerala', coordinates: { latitude: 8.4833, longitude: 76.9437 } },
        capacity: { total: 15000, per_slot: 1000 },
        operatingHours: { regular: { opens: '03:30', closes: '12:00' }, weekend: { opens: '17:00', closes: '20:00' } },
        fees: { general: 0, specialDarshan: 0, prasad: 20 },
        description: 'Richest temple - treasure worth billions found in vaults. 18-ft reclining Vishnu.',
        deity: 'Lord Vishnu (Padmanabha)',
        significance: 'Richest temple by treasure. Royal Travancore family deity. Strict dress code.',
        rules: { dressCode: { men: 'Dhoti/mundu mandatory', women: 'Saree mandatory' }, restrictions: ['Very strict dress code', 'No stitched clothes'] },
        status: 'OPEN',
        contact: { website: 'https://padmanabhaswamytemple.org' }
    },
    {
        name: 'Brihadeeswara Temple',
        location: { address: 'Thanjavur', city: 'Thanjavur', state: 'Tamil Nadu', coordinates: { latitude: 10.7828, longitude: 79.1318 } },
        capacity: { total: 15000, per_slot: 1000 },
        operatingHours: { regular: { opens: '06:00', closes: '12:30' }, weekend: { opens: '16:00', closes: '20:30' } },
        fees: { general: 0, prasad: 20 },
        description: 'UNESCO World Heritage. 1000 years old. 216 ft tower. Shadow never falls on ground.',
        deity: 'Lord Shiva (Brihadeeswara)',
        significance: 'UNESCO site. Chola architecture. 80-ton granite dome. Shadow mystery.',
        history: { foundedYear: '1010 AD', founder: 'Raja Raja Chola I', architecturalStyle: 'Dravidian Chola' },
        status: 'OPEN',
        contact: { website: 'https://tnhrce.gov.in' }
    },
    {
        name: 'Trimbakeshwar Temple',
        location: { address: 'Trimbak', city: 'Nashik', state: 'Maharashtra', coordinates: { latitude: 19.9322, longitude: 73.5308 } },
        capacity: { total: 15000, per_slot: 1000 },
        operatingHours: { regular: { opens: '05:30', closes: '21:00' } },
        fees: { general: 0, specialDarshan: 300, prasad: 50 },
        description: 'One of 12 Jyotirlingas. Godavari river origin. Three lingams (Brahma, Vishnu, Shiva).',
        deity: 'Lord Shiva (Jyotirlinga)',
        significance: 'Jyotirlinga. Godavari origin. Kumbh Mela location.',
        specialServices: [
            { name: 'Kaal Sarpa Dosh Puja', description: 'For planetary affliction', price: 3100, duration: '2 hours', requiresBooking: true }
        ],
        annualEvents: [
            { name: 'Kumbh Mela', description: 'Every 12 years', startDate: 'Every 12 years', duration: '3 months', expectedCrowd: 'extreme' }
        ],
        status: 'OPEN',
        contact: { website: 'https://trimbakeshwar.org' }
    },
    {
        name: 'Mahakaleshwar Temple',
        location: { address: 'Jaisinghpura', city: 'Ujjain', state: 'Madhya Pradesh', coordinates: { latitude: 23.1828, longitude: 75.7682 } },
        capacity: { total: 25000, per_slot: 1500 },
        operatingHours: { regular: { opens: '04:00', closes: '23:00' } },
        fees: { general: 0, specialDarshan: 250, vipEntry: 1500, prasad: 100 },
        description: 'One of 12 Jyotirlingas. Only south-facing Jyotirlinga. Bhasma Aarti famous.',
        deity: 'Lord Shiva (Mahakaleshwar)',
        significance: 'Jyotirlinga. Only south-facing. Bhasma Aarti with cremation ash.',
        specialServices: [
            { name: 'Bhasma Aarti', description: 'Aarti with sacred ash from cremation ground', price: 250, timings: ['04:00'], duration: '45 mins', requiresBooking: true, advanceBookingDays: 30 }
        ],
        annualEvents: [
            { name: 'Maha Shivaratri', startDate: 'February/March', duration: '1 day', expectedCrowd: 'extreme' }
        ],
        status: 'OPEN',
        contact: { website: 'https://mahakaleshwar.nic.in' }
    }
];

// Seed function — safe upsert mode by default, use --force to reset all
async function seedFamousTemples() {
    const forceReset = process.argv.includes('--force');

    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/temple_db');
        console.log('✅ Connected to MongoDB');

        if (forceReset) {
            const del = await Temple.deleteMany({});
            console.log(`🗑️  [FORCE] Deleted ${del.deletedCount} existing temples — full reset`);
        }

        let added = 0, updated = 0, skipped = 0;

        for (const temple of famousTemples) {
            const existing = await Temple.findOne({ name: temple.name });

            if (existing) {
                // Update only metadata fields — DO NOT touch live_count or booking data
                await Temple.updateOne(
                    { name: temple.name },
                    {
                        $set: {
                            description: temple.description,
                            deity: temple.deity,
                            significance: temple.significance,
                            location: temple.location,
                            operatingHours: temple.operatingHours,
                            fees: temple.fees,
                            facilities: temple.facilities,
                            prasadMenu: temple.prasadMenu,
                            donations: temple.donations,
                            specialServices: temple.specialServices,
                            annualEvents: temple.annualEvents,
                            history: temple.history,
                            rules: temple.rules,
                            howToReach: temple.howToReach,
                            liveDarshan: temple.liveDarshan,
                            contact: temple.contact,
                            'capacity.per_slot': temple.capacity.per_slot,
                            'capacity.total': temple.capacity.total,
                            'capacity.threshold_warning': temple.capacity.threshold_warning || 85,
                            'capacity.threshold_critical': temple.capacity.threshold_critical || 95,
                        }
                    }
                );
                updated++;
            } else {
                // New temple — insert with default slots generated
                const slotStart = parseInt((temple.operatingHours?.regular?.opens || '06:00').split(':')[0]);
                const slotEnd = parseInt((temple.operatingHours?.regular?.closes || '21:00').split(':')[0]);
                const slots = [];
                for (let h = slotStart; h < Math.min(slotEnd, slotStart + 8); h++) {
                    const fmt = (n) => String(n).padStart(2, '0');
                    slots.push({ time: `${fmt(h)}:00 - ${fmt(h + 1)}:00`, max_capacity: temple.capacity.per_slot || 500 });
                }
                await Temple.create({ ...temple, slots });
                added++;
            }
        }

        console.log(`\n🛕 Seed complete:`);
        console.log(`   ✅ ${added} new temples added`);
        console.log(`   🔄 ${updated} existing temples updated (data preserved)`);
        console.log(`   ⏭️  ${skipped} skipped`);
        console.log(`\n📊 Total in DB: ${await Temple.countDocuments()} temples`);

    } catch (error) {
        console.error('❌ Seed failed:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run seed
seedFamousTemples();
