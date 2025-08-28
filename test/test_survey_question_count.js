const axios = require('axios');

async function testSurveyQuestionCount() {
    try {
        console.log('Testing survey question count API endpoint...');

        // First, let's get a list of companies to test with
        const companiesResponse = await axios.get('http://localhost:3000/api/sa/companies', {
            headers: {
                'Authorization': 'Bearer test-token' // You'll need to replace with actual token
            }
        });

        if (companiesResponse.data.success && companiesResponse.data.data.length > 0) {
            const firstCompany = companiesResponse.data.data[0];
            console.log(`Testing with company: ${firstCompany.name} (ID: ${firstCompany._id})`);

            // Test the surveys endpoint
            const surveysResponse = await axios.get(`http://localhost:3000/api/sa/companies/${firstCompany._id}/surveys`, {
                headers: {
                    'Authorization': 'Bearer test-token'
                }
            });

            if (surveysResponse.data.success) {
                const surveys = surveysResponse.data.data;
                console.log(`Found ${surveys.length} surveys for this company`);

                surveys.forEach((survey, index) => {
                    console.log(`Survey ${index + 1}:`);
                    console.log(`  Title: ${survey.title || survey._id}`);
                    console.log(`  Type: ${survey.type}`);
                    console.log(`  Status: ${survey.status}`);
                    console.log(`  Question Count: ${survey.questionCount || 0}`);
                    console.log(`  Created: ${new Date(survey.createdAt).toLocaleDateString()}`);
                    console.log('');
                });
            } else {
                console.log('Failed to get surveys:', surveysResponse.data.error);
            }
        } else {
            console.log('No companies found to test with');
        }

    } catch (error) {
        console.error('Error testing survey question count:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testSurveyQuestionCount();
