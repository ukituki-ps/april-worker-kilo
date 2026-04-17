import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const baseURL = __ENV.BASE_URL || "http://localhost:18081";
const token = __ENV.AUTH_TOKEN || "";

if (!token) {
  throw new Error("AUTH_TOKEN is required");
}

export const options = {
  scenarios: {
    extended_mix: {
      executor: "ramping-vus",
      startVUs: 2,
      stages: [
        { duration: "30s", target: Number(__ENV.K6_EXTENDED_VUS || 12) },
        { duration: __ENV.K6_EXTENDED_DURATION || "2m", target: Number(__ENV.K6_EXTENDED_VUS || 12) },
        { duration: "30s", target: 0 },
      ],
      gracefulRampDown: "20s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.03"],
    http_req_duration: ["p(95)<1500", "p(99)<2500"],
    checks: ["rate>0.98"],
    auth_failures: ["rate<0.01"],
  },
};

const authFailures = new Rate("auth_failures");
const dashboardDuration = new Trend("extended_dashboard_duration", true);
const summaryDuration = new Trend("extended_summary_duration", true);

export default function () {
  const cid = `${__VU}-${__ITER}`;
  const reqHeaders = {
    Authorization: `Bearer ${token}`,
    "X-Correlation-Id": `k6-extended-corr-${cid}`,
    "X-Request-Id": `k6-extended-req-${cid}`,
  };

  const dashboard = http.get(`${baseURL}/api/v1/aggregation/dashboard`, { headers: reqHeaders });
  dashboardDuration.add(dashboard.timings.duration);
  check(dashboard, {
    "dashboard status is 200": (r) => r.status === 200,
    "dashboard payload has status field": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status === "ok" || body.status === "degraded";
      } catch (_err) {
        return false;
      }
    },
  });

  const summary = http.get(`${baseURL}/api/v1/aggregation/summary`, { headers: reqHeaders });
  summaryDuration.add(summary.timings.duration);
  check(summary, {
    "summary status is 200": (r) => r.status === 200,
  });

  const me = http.get(`${baseURL}/api/v1/me`, { headers: reqHeaders });
  const meOk = check(me, { "me status is 200": (r) => r.status === 200 });
  authFailures.add(!meOk);

  sleep(0.4);
}
