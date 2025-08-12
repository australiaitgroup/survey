const axios = require('axios');

async function testCandidateDetailAPI() {
    try {
        // Test with the response ID from the previous test
        const responseId = '6899fd50496af680cf5b069f';
        
        console.log('Testing candidate detail API...');
        console.log('Response ID:', responseId);
        
        // Note: This would normally require authentication
        // For testing purposes, we're checking if the endpoint exists
        
        const response = await axios.get(`http://localhost:3000/admin/responses/${responseId}`, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000
        }).catch(err => {
            console.log('API Error Status:', err.response?.status);
            console.log('API Error Message:', err.response?.data?.error || err.message);
            return null;
        });
        
        if (response) {
            console.log('✅ API Response received');
            console.log('Response structure keys:', Object.keys(response.data));
            if (response.data.candidateInfo) {
                console.log('✅ candidateInfo present');
                console.log('Name:', response.data.candidateInfo.name);
                console.log('Email:', response.data.candidateInfo.email);
            }
            if (response.data.statistics) {
                console.log('✅ statistics present');
            }
            if (response.data.questionDetails) {
                console.log('✅ questionDetails present, count:', response.data.questionDetails.length);
            }
        } else {
            console.log('❌ API call failed or returned no data');
        }
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testCandidateDetailAPI();