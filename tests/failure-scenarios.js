import http from 'k6/http';
import { check, sleep } from 'k6';

// Failure scenario configuration
export const options = {
  scenarios: {
    // Scenario 1: Redis failure (event bus down)
    redis_failure: {
      executor: 'constant-vus',
      vus: 50,
      duration: '2m',
      exec: 'testRedisFail',
      startTime: '0s',
    },
    // Scenario 2: MongoDB slow queries
    slow_db: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '1m', target: 200 },
      ],
      exec: 'testSlowDB',
      startTime: '2m',
    },
    // Scenario 3: Service timeout
    service_timeout: {
      executor: 'constant-vus',
      vus: 30,
      duration: '1m',
      exec: 'testTimeout',
      startTime: '3m30s',
    },
  },
  thresholds: {
    'http_req_duration{scenario:redis_failure}': ['p(95)<2000'], // Allow higher latency during failure
    'http_req_failed{scenario:redis_failure}': ['rate<0.20'], // Allow 20% errors during failure
    'http_req_duration{scenario:slow_db}': ['p(95)<3000'],
    'http_req_duration{scenario:service_timeout}': ['p(99)<5000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test Redis failure resilience
export function testRedisFail() {
  const headers = {
    'Content-Type': 'application/json',
    'X-Idempotency-Key': `redis-fail-${Date.now()}-${__VU}-${__ITER}`,
  };
  
  console.log('Testing with Redis unavailable...');
  
  // Try to create campaigns (should work even if Redis events fail)
  const campaigns = http.get(`${BASE_URL}/api/campaigns`, { headers });
  
  check(campaigns, {
    'campaigns available during Redis failure': (r) => r.status === 200,
    'response time acceptable': (r) => r.timings.duration < 2000,
  });
  
  // Test pledge creation with Outbox pattern (should queue events)
  if (campaigns.status === 200) {
    const campaignList = JSON.parse(campaigns.body);
    if (campaignList.campaigns && campaignList.campaigns.length > 0) {
      const pledge = http.post(`${BASE_URL}/api/pledges`, JSON.stringify({
        campaignId: campaignList.campaigns[0]._id,
        amount: 1000,
        donorInfo: {
          name: 'Redis Fail Test',
          email: 'redisfail@test.com'
        }
      }), { headers });
      
      check(pledge, {
        'pledge created with outbox pattern': (r) => r.status === 201,
        'pledge saved to database': (r) => {
          if (r.status === 201) {
            const body = JSON.parse(r.body);
            return body.pledge && body.pledge._id;
          }
          return false;
        }
      });
    }
  }
  
  sleep(1);
}

// Test slow database queries
export function testSlowDB() {
  const headers = { 'Content-Type': 'application/json' };
  
  console.log('Testing with slow database queries...');
  
  // Heavy read operation
  const campaigns = http.get(`${BASE_URL}/api/campaigns?limit=100&sort=-createdAt`, { headers });
  
  check(campaigns, {
    'campaigns load despite slow DB': (r) => r.status === 200,
    'timeout not reached': (r) => r.status !== 504,
  });
  
  // Check if read model helps performance
  if (campaigns.status === 200) {
    const campaignList = JSON.parse(campaigns.body);
    if (campaignList.campaigns && campaignList.campaigns.length > 0) {
      const details = http.get(`${BASE_URL}/api/campaigns/${campaignList.campaigns[0]._id}`, { headers });
      
      check(details, {
        'read model serves quickly': (r) => r.status === 200 && r.timings.duration < 1000,
        'campaign totals from read model': (r) => {
          if (r.status === 200) {
            const body = JSON.parse(r.body);
            return typeof body.campaign.currentAmount !== 'undefined';
          }
          return false;
        }
      });
    }
  }
  
  sleep(0.5);
}

// Test service timeout handling
export function testTimeout() {
  const headers = { 
    'Content-Type': 'application/json',
    'X-Timeout-Test': 'true' 
  };
  
  console.log('Testing service timeout resilience...');
  
  // Try operations with potential timeouts
  const campaigns = http.get(`${BASE_URL}/api/campaigns`, { 
    headers,
    timeout: '10s' 
  });
  
  check(campaigns, {
    'service responds before timeout': (r) => r.status !== 0,
    'graceful error handling': (r) => {
      if (r.status >= 400) {
        try {
          const body = JSON.parse(r.body);
          return body.error || body.message;
        } catch (e) {
          return false;
        }
      }
      return true;
    }
  });
  
  sleep(2);
}

export function handleSummary(data) {
  console.log('\n' + '='.repeat(60));
  console.log('FAILURE SCENARIO TEST RESULTS');
  console.log('='.repeat(60));
  
  Object.keys(data.metrics).forEach(metric => {
    if (metric.includes('scenario')) {
      console.log(`\n${metric}:`);
      console.log(`  Count: ${data.metrics[metric].values.count || 'N/A'}`);
      console.log(`  Rate: ${data.metrics[metric].values.rate || 'N/A'}`);
    }
  });
  
  return {
    'stdout': '\nFailure scenario tests completed\n',
    'failure-test-results.json': JSON.stringify(data, null, 2),
  };
}
