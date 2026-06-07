const db = require("../config/db");

const REPORT_TYPES = {
  SALES_BY_PERIOD: "sales_by_period",
  LISTINGS_BY_STATUS: "listings_by_status",
  TOP_PROPERTIES_BY_VIEWS: "top_properties_by_views",
  REVENUE_BY_AGENT: "revenue_by_agent",
  PENDING_OFFERS_AGING: "pending_offers_aging",
  ACTIVE_SUBSCRIPTIONS: "active_subscriptions",
};

const GROUP_BY_FORMATS = {
  day: "%Y-%m-%d",
  week: "%x-W%v",
  month: "%Y-%m",
};

const allowedReportTypes = Object.values(REPORT_TYPES);

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const ensureTable = async (tableName) => {
  const [rows] = await db.query(
    `SELECT TABLE_NAME
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );

  if (rows.length === 0) {
    throw createError(`Report requires missing table: ${tableName}.`, 500);
  }
};

const getColumns = async (tableName) => {
  const [rows] = await db.query(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );

  return new Set(rows.map((row) => row.COLUMN_NAME));
};

const ensureColumns = async (tableName, columnNames) => {
  const columns = await getColumns(tableName);
  const missing = columnNames.filter((columnName) => !columns.has(columnName));

  if (missing.length > 0) {
    throw createError(`Report requires missing ${tableName} columns: ${missing.join(", ")}.`, 500);
  }

  return columns;
};

const normalizeDate = (value, fallback) => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createError(`${value} is not a valid date.`);
  }
  return date.toISOString().slice(0, 10);
};

const normalizeDateRange = (params = {}) => {
  const today = new Date();
  const fallbackTo = today.toISOString().slice(0, 10);
  const from = new Date(today);
  from.setDate(from.getDate() - 90);
  const fallbackFrom = from.toISOString().slice(0, 10);

  const dateFrom = normalizeDate(params.date_from, fallbackFrom);
  const dateTo = normalizeDate(params.date_to, fallbackTo);

  if (dateFrom > dateTo) {
    throw createError("date_from must be before or equal to date_to.");
  }

  return { dateFrom, dateTo };
};

const addSellerScope = (where, params, user, tableAlias = "p") => {
  if (user?.role === "seller") {
    where.push(`${tableAlias}.seller_id = ?`);
    params.push(user.id);
  }
};

const runSalesByPeriod = async (params = {}, user = {}) => {
  const { dateFrom, dateTo } = normalizeDateRange(params);
  const groupBy = params.group_by || "month";

  if (!GROUP_BY_FORMATS[groupBy]) {
    throw createError("group_by must be one of: day, week, month.");
  }

  if (!(await hasTable("transactions"))) {
    return {
      type: REPORT_TYPES.SALES_BY_PERIOD,
      parameters: { date_from: dateFrom, date_to: dateTo, group_by: groupBy, seller_id: params.seller_id || null },
      rows: [],
    };
  }

  await ensureColumns("transactions", ["id", "amount", "status", "seller_id", "created_at"]);

  const columns = await getColumns("transactions");
  const dateColumn = columns.has("completed_at") ? "completed_at" : "created_at";

  const where = [
    "status = 'completed'",
    `DATE(${dateColumn}) BETWEEN ? AND ?`,
  ];
  const queryParams = [dateFrom, dateTo];

  if (params.seller_id) {
    where.push("seller_id = ?");
    queryParams.push(params.seller_id);
  }
  if (user.role === "seller") {
    where.push("seller_id = ?");
    queryParams.push(user.id);
  }

  const [rows] = await db.query(
    `SELECT
       DATE_FORMAT(${dateColumn}, ?) AS period,
       COUNT(*) AS transactions_count,
       COALESCE(SUM(amount), 0) AS total_value,
       COALESCE(AVG(amount), 0) AS average_value
     FROM transactions
     WHERE ${where.join(" AND ")}
     GROUP BY period
     ORDER BY period ASC`,
    [GROUP_BY_FORMATS[groupBy], ...queryParams]
  );

  return {
    type: REPORT_TYPES.SALES_BY_PERIOD,
    parameters: { date_from: dateFrom, date_to: dateTo, group_by: groupBy, seller_id: params.seller_id || null },
    rows,
  };
};

const runListingsByStatus = async (params = {}, user = {}) => {
  await ensureTable("properties");
  const columns = await ensureColumns("properties", ["id", "price", "status", "seller_id", "created_at"]);

  const { dateFrom, dateTo } = normalizeDateRange(params);
  const where = ["DATE(p.created_at) BETWEEN ? AND ?"];
  const queryParams = [dateFrom, dateTo];

  if (params.type_id && columns.has("type_id")) {
    where.push("p.type_id = ?");
    queryParams.push(params.type_id);
  } else if (params.type && columns.has("type")) {
    where.push("p.type = ?");
    queryParams.push(params.type);
  }

  if (params.category_id && columns.has("category_id")) {
    where.push("p.category_id = ?");
    queryParams.push(params.category_id);
  }

  if (params.city_id && columns.has("location_id")) {
    await ensureTable("locations");
    await ensureColumns("locations", ["id", "city_id"]);
    where.push("l.city_id = ?");
    queryParams.push(params.city_id);
  }

  addSellerScope(where, queryParams, user, "p");

  const locationJoin = params.city_id && columns.has("location_id")
    ? "LEFT JOIN locations l ON l.id = p.location_id"
    : "";

  const [rows] = await db.query(
    `SELECT
       p.status,
       COUNT(*) AS count,
       ROUND(COUNT(*) * 100 / NULLIF(total.total_count, 0), 2) AS percent,
       COALESCE(AVG(p.price), 0) AS average_price
     FROM properties p
     ${locationJoin}
     CROSS JOIN (
       SELECT COUNT(*) AS total_count
       FROM properties p
       ${locationJoin}
       WHERE ${where.join(" AND ")}
     ) total
     WHERE ${where.join(" AND ")}
     GROUP BY p.status, total.total_count
     ORDER BY count DESC, p.status ASC`,
    [...queryParams, ...queryParams]
  );

  return {
    type: REPORT_TYPES.LISTINGS_BY_STATUS,
    parameters: {
      date_from: dateFrom,
      date_to: dateTo,
      type_id: params.type_id || null,
      category_id: params.category_id || null,
      city_id: params.city_id || null,
    },
    rows,
  };
};

const runTopPropertiesByViews = async (params = {}, user = {}) => {
  await ensureTable("properties");
  const columns = await ensureColumns("properties", ["id", "title", "seller_id"]);
  const hasViewsCount = columns.has("views_count");
  const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 100);
  const { dateFrom, dateTo } = normalizeDateRange(params);
  const where = [];
  const queryParams = [];

  addSellerScope(where, queryParams, user, "p");

  const favoritesJoin = "LEFT JOIN favorites f ON f.property_id = p.id";
  const offersJoin = await hasTable("offers") ? "LEFT JOIN offers o ON o.property_id = p.id" : "";
  const offersCount = offersJoin ? "COUNT(DISTINCT o.id)" : "0";

  let viewsExpression = hasViewsCount ? "p.views_count" : "0";
  let viewsJoin = "";

  if (await hasTable("property_view_logs")) {
    const viewLogColumns = await getColumns("property_view_logs");
    if (viewLogColumns.has("property_id") && viewLogColumns.has("created_at")) {
      viewsJoin = `LEFT JOIN property_view_logs pvl
        ON pvl.property_id = p.id AND DATE(pvl.created_at) BETWEEN ? AND ?`;
      viewsExpression = "COUNT(DISTINCT pvl.id)";
      queryParams.unshift(dateFrom, dateTo);
    }
  }

  const [rows] = await db.query(
    `SELECT
       p.id AS property_id,
       p.title,
       ${viewsExpression} AS views,
       COUNT(DISTINCT f.id) AS favorites,
       ${offersCount} AS offers_count
     FROM properties p
     ${viewsJoin}
     ${favoritesJoin}
     ${offersJoin}
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     GROUP BY p.id, p.title${hasViewsCount && !viewsJoin ? ", p.views_count" : ""}
     ORDER BY views DESC, favorites DESC, offers_count DESC
     LIMIT ?`,
    [...queryParams, limit]
  );

  return {
    type: REPORT_TYPES.TOP_PROPERTIES_BY_VIEWS,
    parameters: { date_from: dateFrom, date_to: dateTo, limit },
    rows,
  };
};

const runRevenueByAgent = async (params = {}, user = {}) => {
  const { dateFrom, dateTo } = normalizeDateRange(params);

  if (!(await hasTable("transactions"))) {
    return {
      type: REPORT_TYPES.REVENUE_BY_AGENT,
      parameters: { date_from: dateFrom, date_to: dateTo, agency_id: params.agency_id || null },
      rows: [],
    };
  }

  const transactionColumns = await ensureColumns("transactions", ["id", "amount", "commission_amount", "status", "created_at"]);
  const dateColumn = transactionColumns.has("completed_at") ? "completed_at" : "created_at";
  const hasAgentId = transactionColumns.has("agent_id");
  const canJoinAgents = hasAgentId && await hasTable("agents");
  const canJoinUsers = canJoinAgents && await hasTable("users");
  const where = ["t.status = 'completed'", `DATE(t.${dateColumn}) BETWEEN ? AND ?`];
  const queryParams = [dateFrom, dateTo];

  if (params.agency_id && canJoinAgents) {
    where.push("a.agency_id = ?");
    queryParams.push(params.agency_id);
  }
  if (user.role === "seller" && transactionColumns.has("seller_id")) {
    where.push("t.seller_id = ?");
    queryParams.push(user.id);
  }

  const agentSelect = canJoinUsers
    ? "COALESCE(u.name, CONCAT('Agent #', t.agent_id), 'Unassigned')"
    : hasAgentId ? "COALESCE(CONCAT('Agent #', t.agent_id), 'Unassigned')" : "'Unassigned'";
  const joins = [
    canJoinAgents ? "LEFT JOIN agents a ON a.id = t.agent_id" : "",
    canJoinUsers ? "LEFT JOIN users u ON u.id = a.user_id" : "",
  ].join(" ");

  const [rows] = await db.query(
    `SELECT
       ${agentSelect} AS agent_name,
       COUNT(*) AS sales_count,
       COALESCE(SUM(t.amount), 0) AS total_revenue,
       COALESCE(SUM(t.commission_amount), 0) AS commission_total,
       COALESCE(AVG(t.amount), 0) AS avg_deal_size
     FROM transactions t
     ${joins}
     WHERE ${where.join(" AND ")}
     GROUP BY agent_name
     ORDER BY total_revenue DESC, sales_count DESC`,
    queryParams
  );

  return {
    type: REPORT_TYPES.REVENUE_BY_AGENT,
    parameters: { date_from: dateFrom, date_to: dateTo, agency_id: params.agency_id || null },
    rows,
  };
};

const runPendingOffersAging = async (params = {}, user = {}) => {
  const asOfDate = normalizeDate(params.as_of_date, new Date().toISOString().slice(0, 10));
  const minAgeDays = Math.max(Number(params.min_age_days) || 0, 0);

  if (!(await hasTable("offers"))) {
    return {
      type: REPORT_TYPES.PENDING_OFFERS_AGING,
      parameters: { as_of_date: asOfDate, min_age_days: minAgeDays },
      rows: [],
    };
  }

  await ensureColumns("offers", ["id", "property_id", "buyer_id", "amount", "status", "created_at"]);
  const where = [
    "o.status = 'pending'",
    "DATEDIFF(?, DATE(o.created_at)) >= ?",
  ];
  const queryParams = [asOfDate, minAgeDays];

  if (user.role === "seller") {
    where.push("o.seller_id = ?");
    queryParams.push(user.id);
  }

  const [rows] = await db.query(
    `SELECT
       o.id AS offer_id,
       p.title AS property_title,
       u.name AS buyer,
       o.amount,
       DATEDIFF(?, DATE(o.created_at)) AS age_days,
       o.status
     FROM offers o
     INNER JOIN properties p ON p.id = o.property_id
     INNER JOIN users u ON u.id = o.buyer_id
     WHERE ${where.join(" AND ")}
     ORDER BY age_days DESC, o.amount DESC`,
    [asOfDate, ...queryParams]
  );

  return {
    type: REPORT_TYPES.PENDING_OFFERS_AGING,
    parameters: { as_of_date: asOfDate, min_age_days: minAgeDays },
    rows,
  };
};

const runActiveSubscriptions = async (params = {}, user = {}) => {
  const asOfDate = normalizeDate(params.as_of_date, new Date().toISOString().slice(0, 10));

  if (!(await hasTable("subscriptions")) || !(await hasTable("plans"))) {
    return {
      type: REPORT_TYPES.ACTIVE_SUBSCRIPTIONS,
      parameters: { as_of_date: asOfDate, plan_id: params.plan_id || null },
      rows: [],
    };
  }

  await ensureColumns("subscriptions", ["id", "plan_id", "expires_at", "status"]);
  await ensureColumns("plans", ["id", "name", "price"]);
  const where = ["s.status = 'active'", "DATE(s.expires_at) >= ?"];
  const queryParams = [asOfDate];

  if (params.plan_id) {
    where.push("s.plan_id = ?");
    queryParams.push(params.plan_id);
  }
  if (user.role === "seller") {
    where.push("s.user_id = ?");
    queryParams.push(user.id);
  }

  const [rows] = await db.query(
    `SELECT
       p.name AS plan_name,
       COUNT(*) AS active_count,
       SUM(CASE WHEN DATE(s.expires_at) BETWEEN ? AND DATE_ADD(?, INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS expiring_in_7_days,
       COALESCE(SUM(p.price), 0) AS mrr
     FROM subscriptions s
     INNER JOIN plans p ON p.id = s.plan_id
     WHERE ${where.join(" AND ")}
     GROUP BY p.id, p.name
     ORDER BY active_count DESC, mrr DESC`,
    [asOfDate, asOfDate, ...queryParams]
  );

  return {
    type: REPORT_TYPES.ACTIVE_SUBSCRIPTIONS,
    parameters: { as_of_date: asOfDate, plan_id: params.plan_id || null },
    rows,
  };
};

const hasTable = async (tableName) => {
  const [rows] = await db.query(
    `SELECT TABLE_NAME
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );

  return rows.length > 0;
};

const generateReport = async (type, params = {}, user = {}) => {
  if (!allowedReportTypes.includes(type)) {
    throw createError(`Unsupported report type. Use one of: ${allowedReportTypes.join(", ")}.`);
  }

  if (type === REPORT_TYPES.SALES_BY_PERIOD) return runSalesByPeriod(params, user);
  if (type === REPORT_TYPES.LISTINGS_BY_STATUS) return runListingsByStatus(params, user);
  if (type === REPORT_TYPES.TOP_PROPERTIES_BY_VIEWS) return runTopPropertiesByViews(params, user);
  if (type === REPORT_TYPES.REVENUE_BY_AGENT) return runRevenueByAgent(params, user);
  if (type === REPORT_TYPES.PENDING_OFFERS_AGING) return runPendingOffersAging(params, user);
  return runActiveSubscriptions(params, user);
};

module.exports = {
  REPORT_TYPES,
  generateReport,
  runSalesByPeriod,
  runListingsByStatus,
  runTopPropertiesByViews,
  runRevenueByAgent,
  runPendingOffersAging,
  runActiveSubscriptions,
};
