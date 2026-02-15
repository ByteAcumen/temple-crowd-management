const http = require('http');

const passId = "4642212d-117c-47a1-950f-d8eaa507a400";
const url = `http://localhost:5000/api/v1/bookings/pass/${passId}`;

console.log(`Sending request to: ${url}`);

http.get(url, (res) => {
    let data = '';

    console.log(`Status Code: ${res.statusCode}`);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Response:', data);
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
