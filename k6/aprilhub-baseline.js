import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";

const baseURL = __ENV.BASE_URL || "http://localhost:18081";
const token = __ENV.AUTH_TOKEN || "";

if (!token) {
  throw new Error("AUTH_TOKEN is required");
}

export const options = {
  vus: Number(__ENV.K6_VUS || 4),
  duration: __ENV.K6_DURATION || "20s",
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<1200", "p(99)<2000"],
    checks: ["rate>0.97"],
  },
};

const commonHeaders = {
  Authorization: `Bearer ${token}`,
};

const meDuration = new Trend("endpoint_me_duration", true);
const dashboardDuration = new Trend("endpoint_dashboard_duration", true);
const overviewDuration = new Trend("endpoint_overview_duration", true);

export default function () {
  const cid = `${__VU}-${__ITER}`;
  const reqHeaders = {
    ...commonHeaders,
    "X-Correlation-Id": `k6-corr-${cid}`,
    "X-Request-Id": `k6-req-${cid}`,
  };

  const me = http.get(`${baseURL}/api/v1/me`, { headers: reqHeaders });
  meDuration.add(me.timings.duration);
  check(me, {
    "me status is 200": (r) => r.status === 200,
  });

  const dashboard = http.get(`${baseURL}/api/v1/aggregation/dashboard`, { headers: reqHeaders });
  dashboardDuration.add(dashboard.timings.duration);
  check(dashboard, {
    "dashboard status is 200": (r) => r.status === 200,
    "dashboard has valid status": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status === "ok" || body.status === "degraded";
      } catch (_err) {
        return false;
      }
    },
  });

  const overview = http.get(`${baseURL}/api/v1/overview`, { headers: reqHeaders });
  overviewDuration.add(overview.timings.duration);
  check(overview, {
    "overview status is 200": (r) => r.status === 200,
  });

  sleep(0.5);
}
