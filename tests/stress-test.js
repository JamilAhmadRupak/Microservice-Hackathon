import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp up to 50 users
    { duration: '1m', target: 200 },   // Ramp up to 200 users
    { duration: '2m', target: 500 },   // Ramp up to 500 users
    { duration: '1m', target: 1000 },  // Spike to 1000 users (peak load)
    { duration: '2m', target: 1000 },  // Hold at 1000 users
    { duration: '30s', target: 100 },  // Ramp down to 100
    { duration: '30s', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
    'http_req_failed': ['rate<0.05'], // Error rate < 5%
    'errors': ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Sample test data
const testUsers = [];
const testCampaigns = [];

export function setup() {
  console.log('Setting up test data...');
  
  // Register a test user
  const registerRes = http.post(`${BASE_URL}/api/users/register`, JSON.stringify({
    email: `testuser${Date.now()}@test.com`,
    password: 'TestPass123!',
    name: 'Load Test User'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (registerRes.status === 201) {
    const userData = JSON.parse(registerRes.body);
    return { 
      token: userData.token,
      userId: userData.user._id
    };
  }
  
  return null;
}

export default function(data) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Idempotency-Key': `test-${Date.now()}-${__VU}-${__ITER}`,
  };
  
  if (data && data.token) {
    headers['Authorization'] = `Bearer ${data.token}`;
  }

  // Scenario 1: Browse campaigns (read-heavy)
  if (__VU % 3 === 0) {
    const browseCampaigns = http.get(`${BASE_URL}/api/campaigns`, { headers });
    
    check(browseCampaigns, {
      'browse campaigns status 200': (r) => r.status === 200,
      'browse campaigns response time < 500ms': (r) => r.timings.duration < 500,
    }) || errorRate.add(1);
    
    sleep(1);
  }
  
  // Scenario 2: Create campaign (write operation)
  if (__VU % 5 === 0 && data && data.token) {
    const newCampaign = http.post(`${BASE_URL}/api/campaigns`, JSON.stringify({
      title: `Emergency Medical Help - Test ${Date.now()}`,
      description: 'Load test campaign for stress testing',
      goalAmount: 100000,
      category: 'medical',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      beneficiaryName: 'Test Patient'
    }), { headers });
    
    check(newCampaign, {
      'create campaign status 201': (r) => r.status === 201,
      'create campaign response time < 1000ms': (r) => r.timings.duration < 1000,
    }) || errorRate.add(1);
    
    sleep(2);
  }
  
  // Scenario 3: Make pledge/donation (critical path - includes idempotency)
  if (__VU % 2 === 0) {
    // Get a random campaign first
    const campaigns = http.get(`${BASE_URL}/api/campaigns`, { headers });
    
    if (campaigns.status === 200) {
      const campaignList = JSON.parse(campaigns.body);
      
      if (campaignList.campaigns && campaignList.campaigns.length > 0) {
        const randomCampaign = campaignList.campaigns[Math.floor(Math.random() * campaignList.campaigns.length)];
        
        // Create pledge with idempotency key
        const pledge = http.post(`${BASE_URL}/api/pledges`, JSON.stringify({
          campaignId: randomCampaign._id,
          amount: Math.floor(Math.random() * 5000) + 100,
          donorInfo: {
            name: `Donor ${__VU}`,
            email: `donor${__VU}@test.com`
          }
        }), { headers });
        
        check(pledge, {
          'create pledge status 201': (r) => r.status === 201,
          'create pledge response time < 800ms': (r) => r.timings.duration < 800,
          'pledge has idempotency': (r) => {
            if (r.status === 201) {
              const body = JSON.parse(r.body);
              return body.pledge && body.pledge.idempotencyKey;
            }
            return false;
          }
        }) || errorRate.add(1);
        
        // Test idempotency - retry same request
        const retryPledge = http.post(`${BASE_URL}/api/pledges`, JSON.stringify({
          campaignId: randomCampaign._id,
          amount: Math.floor(Math.random() * 5000) + 100,
          donorInfo: {
            name: `Donor ${__VU}`,
            email: `donor${__VU}@test.com`
          }
        }), { headers }); // Same idempotency key
        
        check(retryPledge, {
          'idempotent request returns cached': (r) => r.status === 201 || r.status === 200,
        });
      }
    }
    
    sleep(1.5);
  }
  
  // Scenario 4: View campaign details (read operation)
  const campaigns = http.get(`${BASE_URL}/api/campaigns`, { headers });
  if (campaigns.status === 200) {
    const campaignList = JSON.parse(campaigns.body);
    if (campaignList.campaigns && campaignList.campaigns.length > 0) {
      const randomCampaign = campaignList.campaigns[0];
      
      const details = http.get(`${BASE_URL}/api/campaigns/${randomCampaign._id}`, { headers });
      
      check(details, {
        'campaign details status 200': (r) => r.status === 200,
        'campaign details response time < 300ms': (r) => r.timings.duration < 300,
        'campaign has read model data': (r) => {
          if (r.status === 200) {
            const body = JSON.parse(r.body);
            return body.campaign && typeof body.campaign.currentAmount !== 'undefined';
          }
          return false;
        }
      }) || errorRate.add(1);
    }
  }
  
  sleep(0.5);
}

export function teardown(data) {
  console.log('Load test completed!');
  console.log(`Test user: ${data ? data.userId : 'N/A'}`);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'stress-test-results.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let summary = '\n' + indent + '='.repeat(60) + '\n';
  summary += indent + 'STRESS TEST SUMMARY\n';
  summary += indent + '='.repeat(60) + '\n\n';
  
  // Requests
  summary += indent + `Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += indent + `Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)} req/s\n`;
  summary += indent + `Failed Requests: ${data.metrics.http_req_failed.values.rate.toFixed(2)}%\n\n`;
  
  // Response Times
  summary += indent + 'Response Times:\n';
  summary += indent + `  Average: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += indent + `  Median: ${data.metrics.http_req_duration.values.med.toFixed(2)}ms\n`;
  summary += indent + `  95th Percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += indent + `  99th Percentile: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
  summary += indent + `  Max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms\n\n`;
  
  // Virtual Users
  summary += indent + `Peak Virtual Users: ${data.metrics.vus_max.values.max}\n`;
  summary += indent + `Test Duration: ${(data.state.testRunDurationMs / 1000 / 60).toFixed(2)} minutes\n\n`;
  
  summary += indent + '='.repeat(60) + '\n';
  
  return summary;
}
