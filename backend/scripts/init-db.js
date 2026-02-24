/**
 * init-db.js — Smart First-Run Database Initializer
 *
 * Automatically detects if this is a fresh clone and seeds all required data.
 * Safe to run multiple times — uses upsert logic, never destroys existing data.
 *
 * Called automatically by start.ps1 on first run.
 * Can also be run manually: node backend/scripts/init-db.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/temple_db';

// ── Models (inline to avoid circular deps) ────────────────────────────────────
const userSchema = new mongoose.Schema({
    name: String, email: { type: String, unique: true, lowercase: true },
    password: String, role: { type: String, default: 'user' },
    isSuperAdmin: { type: Boolean, default: false },
    assignedTemples: [mongoose.SchemaTypes.ObjectId],
}, { timestamps: true });
const User = mongoose.models.User || mongoose.model('User', userSchema);

const Temple = require('../src/models/Temple');

// ── Default users ─────────────────────────────────────────────────────────────
const DEFAULT_USERS = [
    { name: 'System Administrator', email: 'admin@temple.com', password: 'Admin@123456', role: 'admin', isSuperAdmin: true },
    { name: 'Temple Gatekeeper', email: 'gatekeeper@temple.com', password: 'Gate@12345', role: 'gatekeeper', isSuperAdmin: false },
    { name: 'Demo Devotee', email: 'user@temple.com', password: 'User@12345', role: 'user', isSuperAdmin: false },
];

// Curated Unsplash photos (free commercial use)
const IMG = {
    golden: 'https://images.unsplash.com/photo-1585468274952-66591eb14165?w=900&q=85&auto=format&fit=crop',
    varanasi: 'https://images.unsplash.com/photo-1561361058-c24e02aa1f81?w=900&q=85&auto=format&fit=crop',
    tirupati: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=900&q=85&auto=format&fit=crop',
    vaishno: 'https://images.unsplash.com/photo-1600689833903-53d70a4f4c04?w=900&q=85&auto=format&fit=crop',
    kedarnath: 'https://images.unsplash.com/photo-1626621344184-7e1f6a0c5e25?w=900&q=85&auto=format&fit=crop',
    meenakshi: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=900&q=85&auto=format&fit=crop',
    siddhivinayak: 'https://images.unsplash.com/photo-1576487236230-eaa4afe68192?w=900&q=85&auto=format&fit=crop',
    jagannath: 'https://images.unsplash.com/photo-1564785596530-2b03c6e62fb7?w=900&q=85&auto=format&fit=crop',
    shirdi: 'https://images.unsplash.com/photo-1600100397608-e2d47b05be59?w=900&q=85&auto=format&fit=crop',
    somnath: 'https://images.unsplash.com/photo-1594980596870-8f7a7ea0c5e8?w=900&q=85&auto=format&fit=crop',
    akshardham: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=900&q=85&auto=format&fit=crop',
    sabarimala: 'https://images.unsplash.com/photo-1609920658906-8223bd289001?w=900&q=85&auto=format&fit=crop',
    dakshineswar: 'https://images.unsplash.com/photo-1624541355487-7f9e4fd73aa6?w=900&q=85&auto=format&fit=crop',
    kamakhya: 'https://images.unsplash.com/photo-1609920658906-8223bd289001?w=900&q=85&auto=format&fit=crop',
    brihadeeswara: 'https://images.unsplash.com/photo-1633022376457-4a9e2e8e3c86?w=900&q=85&auto=format&fit=crop',
    rameswaram: 'https://images.unsplash.com/photo-1589699001059-70c71f471022?w=900&q=85&auto=format&fit=crop',
    padmanabha: 'https://images.unsplash.com/photo-1624286859988-8e86baed0dc2?w=900&q=85&auto=format&fit=crop',
    dwarka: 'https://images.unsplash.com/photo-1562602833-0f4ab2fc46e5?w=900&q=85&auto=format&fit=crop',
    mahakal: 'https://images.unsplash.com/photo-1561136594-7f68af3d2c35?w=900&q=85&auto=format&fit=crop',
    trimbak: 'https://images.unsplash.com/photo-1624461040893-c7f8f2f5acbb?w=900&q=85&auto=format&fit=crop',
    mahalaxmi: 'https://images.unsplash.com/photo-1576487236230-eaa4afe68192?w=900&q=85&auto=format&fit=crop',
    iskcon: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=900&q=85&auto=format&fit=crop',
    birla: 'https://images.unsplash.com/photo-1588416936097-41850ab3d86d?w=900&q=85&auto=format&fit=crop',
    konark: 'https://images.unsplash.com/photo-1564604292-b6f7a1248aa3?w=900&q=85&auto=format&fit=crop',
    lingaraj: 'https://images.unsplash.com/photo-1592861956644-69f7b84cf4b6?w=900&q=85&auto=format&fit=crop',
};

// ── 25 Famous Indian Temples — real data, rich descriptions ───────────────────
const TEMPLES = [
    { name: 'Golden Temple', imageUrl: IMG.golden, location: { address: 'Golden Temple Road', city: 'Amritsar', state: 'Punjab', coordinates: { latitude: 31.6200, longitude: 74.8765 } }, capacity: { total: 100000, per_slot: 5000 }, deity: 'Guru Granth Sahib', description: 'Holiest Gurdwara of Sikhism, also called Harmandir Sahib ("Abode of God"). Built in 1589 by Guru Arjan Dev Ji, rebuilt in marble by Maharaja Ranjit Singh in 1830 and plated with 750 kg of pure gold. Open 24/7 to all faiths — no caste, religion, or creed distinction. The Langar (community kitchen) serves free vegetarian meals to 100,000+ people daily, making it the world\'s largest free kitchen.', operatingHours: { regular: { opens: '02:00', closes: '22:00' } }, fees: { general: 0, specialDarshan: 0 }, status: 'OPEN', contact: { phone: '+91-183-2553954', website: 'https://www.goldentempleamritsar.org' } },
    { name: 'Kashi Vishwanath Temple', imageUrl: IMG.varanasi, location: { address: 'Lahori Tola, Vishwanath Gali', city: 'Varanasi', state: 'Uttar Pradesh', coordinates: { latitude: 25.3109, longitude: 83.0107 } }, capacity: { total: 50000, per_slot: 3000 }, deity: 'Lord Shiva (Jyotirlinga)', description: 'One of 12 sacred Jyotirlingas and the holiest Shiva shrine. Located on the western bank of the Ganga, the city\'s spiritual epicenter. Originally built by Emperor Akbar\'s minister Todar Mal in 1585, destroyed by Aurangzeb in 1669, and rebuilt in 1780 by Ahilyabai Holkar of Indore. The Kashi Vishwanath Corridor unveiled in 2021 now offers a direct ganga-dham-corridor connecting the temple to the Ganga ghats.', operatingHours: { regular: { opens: '03:00', closes: '23:00' } }, fees: { general: 0, specialDarshan: 500, vipEntry: 1500 }, status: 'OPEN', contact: { phone: '+91-542-2392629', website: 'https://shrikashivishwanath.org' } },
    { name: 'Tirupati Balaji', imageUrl: IMG.tirupati, location: { address: 'Tirumala Hills, Seven Hills', city: 'Tirupati', state: 'Andhra Pradesh', coordinates: { latitude: 13.6833, longitude: 79.3500 } }, capacity: { total: 100000, per_slot: 8000 }, deity: 'Lord Venkateswara (Sri Balaji, Vishnu)', description: 'The richest and most visited religious site on Earth. Between 50,000–100,000 pilgrims visit daily; during festivals like Brahmotsavam, over 500,000 people gather. The temple treasury receives donations exceeding ₹3,000 crore annually. The famous Tirupati Laddu is GI-tagged. Devotees offer their hair as a sacred offering (tonsure) in an annual tradition that generates over 50 tonnes of hair per year.', operatingHours: { regular: { opens: '02:30', closes: '01:30' } }, fees: { general: 0, specialDarshan: 300, vipEntry: 10000 }, status: 'OPEN', contact: { phone: '+91-877-2277777', website: 'https://www.tirumala.org' } },
    { name: 'Vaishno Devi Temple', imageUrl: IMG.vaishno, location: { address: 'Trikuta Hills, Bhawan', city: 'Katra', state: 'Jammu & Kashmir', coordinates: { latitude: 33.0305, longitude: 74.9490 } }, capacity: { total: 50000, per_slot: 3000 }, deity: 'Goddess Vaishno Devi (Maha Kali, Maha Lakshmi, Maha Saraswati)', description: 'Located at 5,200 feet in the Trikuta Mountains of Jammu. The 13 km trek from Katra base camp to the natural cave shrine is one of India\'s most popular pilgrimages, drawing 8 million+ visitors annually. Inside the holy cave are three natural rock formations (Pindis) representing Maha Kali, Maha Lakshmi, and Maha Saraswati — no man-made idol. The journey involves trekking through the Himalayas.', operatingHours: { regular: { opens: '05:00', closes: '21:00' } }, fees: { general: 0, prasad: 150 }, status: 'OPEN', contact: { phone: '+91-1991-234088', website: 'https://www.maavaishnodevi.org' } },
    { name: 'Kedarnath Temple', imageUrl: IMG.kedarnath, location: { address: 'Kedarnath, Mandakini River Valley', city: 'Rudraprayag', state: 'Uttarakhand', coordinates: { latitude: 30.7352, longitude: 79.0669 } }, capacity: { total: 15000, per_slot: 1000 }, deity: 'Lord Shiva (Jyotirlinga — Kedarnath)', description: 'The highest Jyotirlinga at 3,583 metres in the Garhwal Himalayas. Part of Char Dham. Built by the Pandavas according to legend; the current structure dates to the 8th century (attributed to Adi Shankaracharya). The temple miraculously survived the devastating 2013 Kedarnath flood disaster. Accessible only May–November; helicopter service available. In winter, the deity is relocated to Ukhimath.', operatingHours: { regular: { opens: '04:00', closes: '21:00' } }, fees: { general: 0, specialDarshan: 1500, vipEntry: 5000 }, status: 'OPEN', contact: { phone: '+91-1364-263170', website: 'https://badrinath-kedarnath.gov.in' } },
    { name: 'Meenakshi Amman Temple', imageUrl: IMG.meenakshi, location: { address: 'Temple South Gate, Aruldoss Madam', city: 'Madurai', state: 'Tamil Nadu', coordinates: { latitude: 9.9195, longitude: 78.1193 } }, capacity: { total: 30000, per_slot: 2000 }, deity: 'Goddess Meenakshi (Parvati) & Lord Sundareswarar (Shiva)', description: '2,500-year-old living temple at the heart of Madurai, a UNESCO candidate. Features 14 towering gopurams (gateway towers) encrusted with 33,000 sculptures — the tallest at 52 metres. The divine marriage of Meenakshi and Sundareswarar is ceremonially re-enacted every night. 15,000+ pilgrims on weekdays; over 25,000 on festival days. The temple has 14 temples within, numerous mandapams, and a sacred lotus tank.', operatingHours: { regular: { opens: '05:00', closes: '22:00' } }, fees: { general: 0, specialDarshan: 100, foreigners: 50 }, status: 'OPEN', contact: { phone: '+91-452-2348085', website: 'https://www.meenakshitemple.org' } },
    { name: 'Siddhivinayak Temple', imageUrl: IMG.siddhivinayak, location: { address: 'SK Bole Road, Prabhadevi', city: 'Mumbai', state: 'Maharashtra', coordinates: { latitude: 19.0168, longitude: 72.8303 } }, capacity: { total: 25000, per_slot: 2000 }, deity: 'Lord Ganesha (Siddhivinayak — Wish-Fulfilling)', description: 'The most famous Ganesha temple in Maharashtra, originally built in 1801 by Laxman Vithu and Deubai Patil. The presiding deity has a unique right-hand trunk (extremely rare) — believed to be highly powerful and wish-fulfilling. Bollywood celebrities, industrialists, and politicians regularly seek blessings before major events. The temple complex has been renovated multiple times with gold-plated dome added.', operatingHours: { regular: { opens: '05:30', closes: '22:00' }, weekend: { opens: '03:00', closes: '22:00' } }, fees: { general: 0, specialDarshan: 200, vipEntry: 1500 }, status: 'OPEN', contact: { phone: '+91-22-24373626', website: 'https://www.siddhivinayak.org' } },
    { name: 'Jagannath Temple', imageUrl: IMG.jagannath, location: { address: 'Grand Road (Bada Danda)', city: 'Puri', state: 'Odisha', coordinates: { latitude: 19.8050, longitude: 85.8181 } }, capacity: { total: 50000, per_slot: 3000 }, deity: 'Lord Jagannath (Krishna), Balabhadra & Subhadra', description: 'One of four sacred Char Dham sites. The English word "Juggernaut" originates from Jagannath\'s annual Rath Yatra chariot, which draws millions worldwide. The 12th-century temple stands 65 metres tall. Non-Hindus are not permitted inside. The Mahaprasad offered here is considered sacred — cooked in 752 clay pots simultaneously using firewood, the remarkable part is that pot on highest always cooks first defying physics.', operatingHours: { regular: { opens: '05:00', closes: '23:00' } }, fees: { general: 0, prasad: 50 }, status: 'OPEN', contact: { phone: '+91-6752-222002', website: 'https://jagannath.nic.in' } },
    { name: 'Shirdi Sai Baba Temple', imageUrl: IMG.shirdi, location: { address: 'Shirdi Village, Ahmednagar District', city: 'Ahmednagar', state: 'Maharashtra', coordinates: { latitude: 19.7645, longitude: 74.4769 } }, capacity: { total: 60000, per_slot: 4000 }, deity: 'Shirdi Sai Baba (Spiritual Master)', description: 'Third most visited pilgrimage in India, after Tirupati and Vaishno Devi. Sai Baba lived in Shirdi from 1858 until his Mahasamadhi in 1918. Uniquely worshipped by both Hindus and Muslims — embodying "Sabka Malik Ek" (One God for All). The Samadhi Mandir features his marble tomb visited by 25,000+ daily. Seven mandatory Aarti services daily. Free langar for all pilgrims.', operatingHours: { regular: { opens: '04:00', closes: '22:00' } }, fees: { general: 0, specialDarshan: 500, vipEntry: 1000 }, status: 'OPEN', contact: { phone: '+91-2423-258500', website: 'https://www.shrisaibabasansthan.org' } },
    { name: 'Somnath Temple', imageUrl: IMG.somnath, location: { address: 'Somnath Mandir, Prabhas Kshetra', city: 'Prabhas Patan', state: 'Gujarat', coordinates: { latitude: 20.8880, longitude: 70.4014 } }, capacity: { total: 25000, per_slot: 1500 }, deity: 'Lord Shiva (Somnath — First Jyotirlinga)', description: 'The first and most revered of the 12 Jyotirlingas. This legendary temple was plundered 17 times in history by various invaders, starting with Mahmud of Ghazni in 1024 AD, yet was rebuilt every time — making it a symbol of India\'s indestructible spirit. The current majestic structure was built post-independence in 1951 under Sardar Vallabhbhai Patel\'s initiative. Located on the Saurashtra coast where the Arabian Sea meets three rivers (Triveni Sangam).', operatingHours: { regular: { opens: '06:00', closes: '21:00' } }, fees: { general: 0, specialDarshan: 200, vipEntry: 500 }, status: 'OPEN', contact: { phone: '+91-2876-231241', website: 'https://somnath.org' } },
    { name: 'Akshardham Temple', imageUrl: IMG.akshardham, location: { address: 'NH 24, Noida Mor, Pandav Nagar', city: 'New Delhi', state: 'Delhi', coordinates: { latitude: 28.6127, longitude: 77.2773 } }, capacity: { total: 30000, per_slot: 2000 }, deity: 'Bhagwan Swaminarayan', description: 'Holds the Guinness World Record as the largest comprehensive Hindu temple complex (2007). 10,000+ craftsmen carved 234 ornate pillars, 9 ornamental domes, and 20,000 statues from Rajasthani sandstone and Italian marble. Features a "Sahaj Anand" cultural boat journey, IMAX-format film on Swaminarayan\'s life, Yagnapurush Kund (world\'s largest step well), and a spectacular musical fountain show. Closed on Mondays.', operatingHours: { regular: { opens: '09:30', closes: '18:30' } }, fees: { general: 0, exhibition: 170, waterShow: 80 }, status: 'OPEN', contact: { phone: '+91-11-43442344', website: 'https://akshardham.com' } },
    { name: 'Sabarimala Temple', imageUrl: IMG.sabarimala, location: { address: 'Periyar Tiger Reserve, Sannidhanam', city: 'Pathanamthitta', state: 'Kerala', coordinates: { latitude: 9.4367, longitude: 77.0826 } }, capacity: { total: 50000, per_slot: 5000 }, deity: 'Lord Ayyappa (Dharma Sastha)', description: 'Sabarimala is one of the largest annual pilgrimages in the world, with an estimated 40–50 million devotees visiting during the Mandalam-Makaravilakku season. Unique requirements: 41-day penance (Vrathum) wearing black/blue clothes before undertaking the trek. A 5 km trek through Periyar Tiger Reserve. The mystical Makara Jyothi (celestial light) appears on Makaravilakku day. Lord Ayyappa is considered eternally celibate (Naishtika Brahmachari).', operatingHours: { regular: { opens: '04:00', closes: '22:00' } }, fees: { general: 0 }, status: 'OPEN', contact: { website: 'https://sabarimala.kerala.gov.in' } },
    { name: 'Dakshineswar Kali Temple', imageUrl: IMG.dakshineswar, location: { address: 'Dakshineswar, Hooghly River Bank', city: 'Kolkata', state: 'West Bengal', coordinates: { latitude: 22.6547, longitude: 88.3577 } }, capacity: { total: 20000, per_slot: 1500 }, deity: 'Goddess Kali (Bhavatarini — She who liberates the universe)', description: 'Built in 1855 by Rani Rashmoni on the eastern bank of the Hooghly River. Sri Ramakrishna Paramhansa served as the head priest here from 1855–1886, achieving God-realization and mystical experiences. His most famous disciple, Swami Vivekananda, visited him here. The temple complex includes 12 Shiva temples, a Radha-Krishna temple, and Ramakrishna\'s room preserved as a museum. Rani Rashmoni\'s dedicated advocacy changed temple Brahmin traditions.', operatingHours: { regular: { opens: '06:00', closes: '20:30' } }, fees: { general: 0 }, status: 'OPEN', contact: { website: 'https://dakshineswarkalitemple.org' } },
    { name: 'Kamakhya Temple', imageUrl: IMG.kamakhya, location: { address: 'Nilachal Hill, Kamakhya', city: 'Guwahati', state: 'Assam', coordinates: { latitude: 26.1663, longitude: 91.7050 } }, capacity: { total: 15000, per_slot: 1000 }, deity: 'Goddess Kamakhya (Maha Shakti)', description: 'One of the 51 Shakti Peethas and the most powerful. Located atop Nilachal Hill overlooking the Brahmaputra river. The shrine has no idol — instead a stone yoni (symbol of the goddess) is worshipped. The annual Ambubachi Mela when the temple closes for 3 days represents the goddess\'s menstruation — thousands of Tantric practitioners (Aghoris, sadhus) gather. Prasad distributed after reopening is considered especially sacred.', operatingHours: { regular: { opens: '08:00', closes: '17:00' } }, fees: { general: 0, specialDarshan: 500 }, status: 'OPEN', contact: { website: 'https://kamakhyatemple.org' } },
    { name: 'Brihadeeswara Temple', imageUrl: IMG.brihadeeswara, location: { address: 'South Main Street, Big Temple Road', city: 'Thanjavur', state: 'Tamil Nadu', coordinates: { latitude: 10.7828, longitude: 79.1318 } }, capacity: { total: 15000, per_slot: 1000 }, deity: 'Lord Shiva (Brihadeeswara — The Great Lord)', description: 'UNESCO World Heritage Site. Built by Raja Raja Chola I (985–1014 AD) as a monument to Chola supremacy. The 216-ft (66 m) vimana (pyramidal tower) is one of the tallest in the world and casts NO shadow at noon, a feat of ancient architectural brilliance. The 80-tonne granite capstone was hauled up using a 6 km ramp with elephants. Finest extant example of Dravidian Chola architecture. Also called Peruvudaiyar Kovil or the Big Temple.', operatingHours: { regular: { opens: '06:00', closes: '20:30' } }, fees: { general: 0 }, status: 'OPEN', contact: { website: 'https://tnhrce.gov.in' } },
    { name: 'Ramanathaswamy Temple', imageUrl: IMG.rameswaram, location: { address: 'Rameswaram Island, Gulf of Mannar', city: 'Rameswaram', state: 'Tamil Nadu', coordinates: { latitude: 9.2876, longitude: 79.3173 } }, capacity: { total: 30000, per_slot: 2000 }, deity: 'Lord Shiva (Ramanathaswamy — Jyotirlinga)', description: 'One of the four sacred Char Dham and one of 12 Jyotirlingas. The famous 1,220-metre long corridor (3rd Prakara) is the longest temple corridor in India. Lord Rama is said to have installed the Shivalinga here to atone for killing Ravana. The temple has 22 different sacred wells (theerthams) inside — pilgrims bathe in each one. The island location makes it spiritually comparable to Varanasi — dying here grants moksha.', operatingHours: { regular: { opens: '05:00', closes: '21:00' } }, fees: { general: 0, specialDarshan: 100 }, status: 'OPEN', contact: { website: 'https://rameswaramtemple.tn.gov.in' } },
    { name: 'Padmanabhaswamy Temple', imageUrl: IMG.padmanabha, location: { address: 'East Fort, Fort Road', city: 'Thiruvananthapuram', state: 'Kerala', coordinates: { latitude: 8.4833, longitude: 76.9437 } }, capacity: { total: 15000, per_slot: 1000 }, deity: 'Lord Vishnu (Padmanabha — Ananthasayanam, reclining on Ananta Shesha)', description: 'The world\'s wealthiest temple. Secret vaults (Vault A–F) discovered in 2011 contained treasures worth over ₹1 lakh crore (1 trillion rupees) including gold statues, diamond-studded ornaments, and ancient coins from global civilizations. The presiding 18-foot Vishnu idol is made of 12,008 Saligrama stones bound together with traditional ayurvedic paste. Strictly Hindu-only entry. Traditional dress (men: dhoti only, no shirts) is mandatory.', operatingHours: { regular: { opens: '03:30', closes: '20:00' } }, fees: { general: 0 }, status: 'OPEN', contact: { website: 'https://padmanabhaswamytemple.org' } },
    { name: 'Dwarkadhish Temple', imageUrl: IMG.dwarka, location: { address: 'Dwarka, Saurashtra Peninsula', city: 'Dwarka', state: 'Gujarat', coordinates: { latitude: 22.2376, longitude: 68.9674 } }, capacity: { total: 20000, per_slot: 1500 }, deity: 'Lord Krishna (Dwarkadhish — King of Dwarka)', description: 'One of India\'s four sacred Char Dham pilgrimage sites. Built on the site of Krishna\'s ancient capital city Dwarka — marine archaeological surveys have found submerged structures offshore confirming an ancient city. The current 5-storey main temple is 42 metres tall and the 52-yard flag (Dhwaja Stambha) is changed five times a day. Dwarka is also one of the four sacred founding seats (Peethas) established by Adi Shankaracharya.', operatingHours: { regular: { opens: '06:00', closes: '21:30' } }, fees: { general: 0, specialDarshan: 300 }, status: 'OPEN', contact: { website: 'https://dwarkadhish.org' } },
    { name: 'Mahakaleshwar Temple', imageUrl: IMG.mahakal, location: { address: 'Jaisinghpura, Mahakal Marg', city: 'Ujjain', state: 'Madhya Pradesh', coordinates: { latitude: 23.1828, longitude: 75.7682 } }, capacity: { total: 25000, per_slot: 1500 }, deity: 'Lord Shiva (Mahakaleshwar — Lord of Death and Time)', description: 'One of 12 Jyotirlingas and uniquely south-facing (Dakshinamukhi, symbolizing death and time). The famous Bhasma Aarti at 4 AM is performed with sacred ash from the cremation ground — one of Hinduism\'s most dramatic rituals. The Great Mahakal Lok complex opened in 2022 transformed 2.5 hectares, creating one of the most impressive temple precinct experiences in India. Ujjain hosts Kumbh Mela every 12 years.', operatingHours: { regular: { opens: '04:00', closes: '23:00' } }, fees: { general: 0, specialDarshan: 250, vipEntry: 1500 }, status: 'OPEN', contact: { website: 'https://mahakaleshwar.nic.in' } },
    { name: 'Trimbakeshwar Temple', imageUrl: IMG.trimbak, location: { address: 'Trimbak Village, Brahmagiri Hills', city: 'Nashik', state: 'Maharashtra', coordinates: { latitude: 19.9322, longitude: 73.5308 } }, capacity: { total: 15000, per_slot: 1000 }, deity: 'Lord Shiva (Trimbakeshwar — with three lingams: Brahma, Vishnu, Shiva)', description: 'One of 12 Jyotirlingas. The holy Godavari River originates from Brahmagiri Hill adjacent to this temple. The unique lingam here has three faces (Trimukha): Brahma, Vishnu, and Mahesh — symbolizing the Trinity. The Nashik-Trimbakeshwar Kumbh Mela is held every 12 years, attracting 30 million+ pilgrims. Kaal Sarpa Dosh yagna/puja is a major ritual performed here for removing astrological obstacles.', operatingHours: { regular: { opens: '05:30', closes: '21:00' } }, fees: { general: 0, specialDarshan: 300 }, status: 'OPEN', contact: { website: 'https://trimbakeshwar.org' } },
    { name: 'Mahalaxmi Temple Mumbai', imageUrl: IMG.mahalaxmi, location: { address: 'Bhulabhai Desai Road, Breach Candy', city: 'Mumbai', state: 'Maharashtra', coordinates: { latitude: 18.9757, longitude: 72.8052 } }, capacity: { total: 15000, per_slot: 1000 }, deity: 'Goddess Mahalaxmi (Lakshmi), Mahakali, and Mahasaraswati — the Tri-Devi', description: 'One of the most ancient and powerful temples in Mumbai. Three distinct goddesses are enshrined together: Mahakali (destroyer of evil), Mahalaxmi (goddess of wealth, the presiding deity), and Mahasaraswati (goddess of wisdom) as the Tri-Devi. Located right on the Arabian Sea at Breach Candy, the seafront view is stunning. Navratri festivals here are celebrated for 9 days with spectacular events; thousands queue for blessings.', operatingHours: { regular: { opens: '06:00', closes: '22:00' } }, fees: { general: 0, specialDarshan: 200 }, status: 'OPEN', contact: { website: 'https://mahalaxmitemple.co.in' } },
    { name: 'ISKCON Temple Delhi', imageUrl: IMG.iskcon, location: { address: 'Sant Nagar, East of Kailash', city: 'New Delhi', state: 'Delhi', coordinates: { latitude: 28.5509, longitude: 77.2403 } }, capacity: { total: 10000, per_slot: 800 }, deity: 'Lord Krishna & Radha Rani (Radha Parthasarathi)', description: 'The International Society for Krishna Consciousness (ISKCON) temple, also known as Glory of India Cultural Centre. Part of the global Hare Krishna movement founded by Srila Prabhupada. Features the permanent "Glory of India" multimedia exhibition, a Vedic library, and the famous Govinda\'s vegetarian restaurant. Janmashtami celebrations here draw 300,000+ devotees over two days. All faiths are welcome; peaceful, clean, and organized.', operatingHours: { regular: { opens: '04:30', closes: '21:00' } }, fees: { general: 0, prasad: 150 }, status: 'OPEN', contact: { website: 'https://www.iskcondelhi.com' } },
    { name: 'Birla Mandir Jaipur', imageUrl: IMG.birla, location: { address: 'Moti Doongri Hill, Jawaharlal Nehru Marg', city: 'Jaipur', state: 'Rajasthan', coordinates: { latitude: 26.8898, longitude: 75.8129 } }, capacity: { total: 8000, per_slot: 500 }, deity: 'Lord Vishnu (Laxmi Narayan) & Goddess Lakshmi', description: 'Inaugurated in 1988 by the BM Birla Foundation. Built entirely from gleaming white Makrana marble — the same quarry that supplied marble for the Taj Mahal. The temple glows spectacularly at night under floodlights, making it a landmark of Jaipur\'s skyline. Intricate wall carvings depict scenes from the Mahabharata, Ramayana, and the history of science and philosophy. On Moti Doongri hill, it overlooks the illuminated Jaipur cityscape.', operatingHours: { regular: { opens: '08:00', closes: '20:00' } }, fees: { general: 0 }, status: 'OPEN', contact: { website: 'https://birlatemple.org' } },
    { name: 'Konark Sun Temple', imageUrl: IMG.konark, location: { address: 'Konark Village, Puri District', city: 'Konark', state: 'Odisha', coordinates: { latitude: 19.8876, longitude: 86.0945 } }, capacity: { total: 20000, per_slot: 1500 }, deity: 'Lord Surya (The Sun God)', description: 'UNESCO World Heritage Site (1984) and one of India\'s most iconic landmarks. Built in the 13th century by King Narasimhadeva I of the Eastern Ganga dynasty. Architecturally designed as a giant stone chariot with 12 pairs of intricately carved wheels (working as sundials) and 7 galloping horses — all symbolizing the Sun chariot. The 24 wheels represent the hours of a day. Called the "Black Pagoda" by European sailors who used it as a navigational landmark.', operatingHours: { regular: { opens: '06:00', closes: '20:00' } }, fees: { general: 40, foreigners: 600 }, status: 'OPEN', contact: { website: 'https://konark.nic.in' } },
    { name: 'Lingaraj Temple', imageUrl: IMG.lingaraj, location: { address: 'Old Town, Ekamra Kshetra', city: 'Bhubaneswar', state: 'Odisha', coordinates: { latitude: 20.2383, longitude: 85.8341 } }, capacity: { total: 25000, per_slot: 2000 }, deity: 'Lord Shiva (Harihara — the combined form of Shiva and Vishnu)', description: 'The largest and most significant of Bhubaneswar\'s 450+ ancient temples. Over 1,100 years old, built primarily in the 11th century by the Somavanshi dynasty. The 55-metre deul (main tower) with its superb honeycomb-like Kalinga Nagara architecture. Uniquely, the deity here is Harihara — both Shiva and Vishnu united in one form, reflecting synthesis of Shaivism and Vaishnavism. Non-Hindus may view the temple from a special platform built by the Archaeological Survey of India.', operatingHours: { regular: { opens: '05:00', closes: '21:00' } }, fees: { general: 0 }, status: 'OPEN', contact: { website: 'https://lingarajtemplebhubaneswar.in' } },
];

// ── Main initializer ───────────────────────────────────────────────────────────
async function initDB() {
    console.log('\n🔧 Temple System — Database Initializer');
    console.log('━'.repeat(50));

    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // ── Check if this is first run ──────────────────────────────────────────
    const [templeCount, userCount] = await Promise.all([
        Temple.countDocuments(),
        User.countDocuments()
    ]);

    const isFirstRun = templeCount === 0 && userCount === 0;
    console.log(`📊 Current DB: ${templeCount} temples, ${userCount} users`);
    if (isFirstRun) {
        console.log('🆕 Fresh database detected — running full setup...\n');
    } else {
        console.log('🔄 Existing data found — updating safely (no data will be lost)...\n');
    }

    // ── Seed users ──────────────────────────────────────────────────────────
    let usersAdded = 0, usersUpdated = 0;
    for (const u of DEFAULT_USERS) {
        const exists = await User.findOne({ email: u.email });
        if (!exists) {
            const hashed = await bcrypt.hash(u.password, 12);
            await User.create({ ...u, password: hashed });
            usersAdded++;
        } else {
            // Ensure role / isSuperAdmin are correct even on existing accounts
            await User.updateOne({ email: u.email }, {
                $set: { role: u.role, isSuperAdmin: u.isSuperAdmin, name: u.name }
            });
            usersUpdated++;
        }
    }
    console.log(`👤 Users: ${usersAdded} created, ${usersUpdated} verified/updated`);

    // ── Seed temples ────────────────────────────────────────────────────────
    let templesAdded = 0, templesUpdated = 0;
    for (const t of TEMPLES) {
        const existing = await Temple.findOne({ name: t.name });
        if (!existing) {
            // Auto-generate time slots based on operating hours
            const open = parseInt((t.operatingHours?.regular?.opens || '06:00').split(':')[0]);
            const close = parseInt((t.operatingHours?.regular?.closes || '21:00').split(':')[0]);
            const slots = [];
            for (let h = open; h < Math.min(close, open + 8); h++) {
                const p = (n) => String(n).padStart(2, '0');
                slots.push({ time: `${p(h)}:00 - ${p(h + 1)}:00`, max_capacity: t.capacity.per_slot || 500 });
            }
            await Temple.create({ ...t, slots });
            templesAdded++;
        } else {
            // Preserve live_count and bookings — only update metadata & images
            await Temple.updateOne({ name: t.name }, {
                $set: {
                    description: t.description, deity: t.deity,
                    'location.address': t.location.address,
                    'location.coordinates': t.location.coordinates,
                    operatingHours: t.operatingHours, fees: t.fees,
                    contact: t.contact,
                    'capacity.per_slot': t.capacity.per_slot,
                    'capacity.total': t.capacity.total,
                }
            });
            templesUpdated++;
        }
    }
    console.log(`🛕 Temples: ${templesAdded} created, ${templesUpdated} metadata updated`);

    const total = await Temple.countDocuments();
    console.log(`\n📊 Final DB state: ${total} temples, ${await User.countDocuments()} users`);

    if (isFirstRun) {
        console.log('\n🎉 First-time setup complete! Default credentials:');
        DEFAULT_USERS.forEach(u => {
            console.log(`   ${u.role.padEnd(12)} → ${u.email.padEnd(28)} / ${u.password}`);
        });
    }

    console.log('\n✅ Database initialization complete!\n');
}

initDB()
    .catch(e => { console.error('❌ Init failed:', e.message); process.exit(1); })
    .finally(() => mongoose.disconnect());
